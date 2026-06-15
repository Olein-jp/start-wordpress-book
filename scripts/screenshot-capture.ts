import { Browser, chromium, Page } from "playwright";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

type Action =
  | { type: "click"; selector: string }
  | { type: "hover"; selector: string }
  | { type: "waitFor"; selector: string }
  | { type: "delay"; ms: number }
  | { type: "keyboard"; key?: string; text?: string };

type Shot = {
  id: string;
  title?: string;
  memo?: string | string[];
  url: string;
  output: string;
  waitFor?: string;
  delay?: number;
  authState?: string | boolean;
  viewport?: {
    width: number;
    height: number;
  };
  fullPage?: boolean;
  actions?: Action[];
  screenshot?: {
    selector?: string;
    zoom?: number;
    deviceScaleFactor?: number;
    outputScale?: number;
    focus?: {
      selector: string;
      width?: number;
      height?: number;
      padding?: number;
    };
    clip?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
};

type Scenario = {
  defaults?: {
    authState?: string | boolean;
    delay?: number;
    fullPage?: boolean;
    viewport?: {
      width: number;
      height: number;
    };
  };
  shots: Shot[];
};

type ScreenshotConfig = {
  defaults?: Scenario["defaults"];
};

async function runActions(page: Page, actions: Action[] = []) {
  for (const action of actions) {
    if (action.type === "click") {
      await page.locator(action.selector).click();
    }

    if (action.type === "hover") {
      await page.locator(action.selector).hover();
    }

    if (action.type === "waitFor") {
      await page.waitForSelector(action.selector);
    }

    if (action.type === "delay") {
      await page.waitForTimeout(action.ms);
    }

    if (action.type === "keyboard") {
      if (action.text) {
        await page.keyboard.type(action.text);
      }

      if (action.key) {
        await page.keyboard.press(action.key);
      }
    }
  }
}

function resolveShotUrl(baseUrl: string, shotUrl: string) {
  return new URL(shotUrl, baseUrl).toString();
}

function loadScreenshotConfig() {
  const configPath = path.resolve("screenshots.config.yaml");

  if (!fs.existsSync(configPath)) {
    return {};
  }

  return yaml.parse(fs.readFileSync(configPath, "utf8")) as ScreenshotConfig;
}

function getClipAroundBox(
  box: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
  options: { width?: number; height?: number; padding?: number } = {}
) {
  const padding = options.padding ?? 0;
  const clipWidth = Math.min(options.width ?? box.width + padding * 2, viewport.width);
  const clipHeight = Math.min(options.height ?? box.height + padding * 2, viewport.height);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const x = Math.max(0, Math.min(centerX - clipWidth / 2, viewport.width - clipWidth));
  const y = Math.max(0, Math.min(centerY - clipHeight / 2, viewport.height - clipHeight));

  return {
    x,
    y,
    width: clipWidth,
    height: clipHeight,
  };
}

function getFocusedCrop(
  box: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
  options: {
    width?: number;
    height?: number;
    padding?: number;
    zoom?: number;
    outputScale?: number;
  } = {}
) {
  const targetWidth = options.width ?? viewport.width;
  const targetHeight = options.height ?? viewport.height;
  const zoom = Math.max(options.zoom ?? 1, 1);
  const outputScale = Math.max(options.outputScale ?? 1, 1);
  const padding = options.padding ?? 0;
  const sourceWidth = Math.min(targetWidth / zoom + padding * 2, viewport.width);
  const sourceHeight = Math.min(targetHeight / zoom + padding * 2, viewport.height);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const x = Math.max(0, Math.min(centerX - sourceWidth / 2, viewport.width - sourceWidth));
  const y = Math.max(0, Math.min(centerY - sourceHeight / 2, viewport.height - sourceHeight));

  return {
    source: {
      x,
      y,
      width: sourceWidth,
      height: sourceHeight,
    },
    output: {
      width: targetWidth * outputScale,
      height: targetHeight * outputScale,
    },
  };
}

async function saveZoomedCrop(
  page: Page,
  outputPath: string,
  crop: ReturnType<typeof getFocusedCrop>
) {
  const screenshot = await page.screenshot();
  const dataUrl = `data:image/png;base64,${screenshot.toString("base64")}`;
  const mimeType = /\.(jpe?g)$/i.test(outputPath) ? "image/jpeg" : "image/png";
  const renderPage = await page.context().newPage();

  try {
    const renderedDataUrl = await renderPage.evaluate(
      async ({ dataUrl, crop, mimeType }) => {
        const image = new Image();
        image.src = dataUrl;
        await image.decode();

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(crop.output.width);
        canvas.height = Math.round(crop.output.height);

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Failed to create canvas context.");
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        const scaleX = image.naturalWidth / window.innerWidth;
        const scaleY = image.naturalHeight / window.innerHeight;

        context.drawImage(
          image,
          crop.source.x * scaleX,
          crop.source.y * scaleY,
          crop.source.width * scaleX,
          crop.source.height * scaleY,
          0,
          0,
          crop.output.width,
          crop.output.height
        );

        return canvas.toDataURL(mimeType, 0.92);
      },
      { dataUrl, crop, mimeType }
    );

    fs.writeFileSync(
      outputPath,
      Buffer.from(renderedDataUrl.replace(/^data:image\/\w+;base64,/, ""), "base64")
    );
  } finally {
    await renderPage.close();
  }
}

function getDefaultAuthStatePath(baseUrl: string) {
  const origin = new URL(baseUrl).origin
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");

  return `screenshots/auth/${origin}.json`;
}

const verifiedStorageStates = new Set<string>();

async function createAuthState(browser: Browser, baseUrl: string, storageState: string) {
  const username = process.env.WP_USER || "admin";
  const password = process.env.WP_PASSWORD || "password";
  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 1200,
    },
    deviceScaleFactor: 1,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  });
  const page = await context.newPage();

  try {
    await page.goto(new URL("/wp-admin/", baseUrl).toString());
    await page.fill("#user_login", username);
    await page.fill("#user_pass", password);
    await page.click("#wp-submit");
    await page.waitForSelector("#wpbody-content");

    fs.mkdirSync(path.dirname(storageState), {
      recursive: true,
    });

    await context.storageState({
      path: storageState,
    });

    console.log(`Saved auth state: ${storageState}`);
  } finally {
    await context.close();
  }
}

async function isStorageStateValid(
  browser: Browser,
  baseUrl: string,
  storageState: string
) {
  const context = await browser.newContext({
    storageState,
    viewport: {
      width: 1440,
      height: 1200,
    },
    deviceScaleFactor: 1,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  });
  const page = await context.newPage();

  try {
    await page.goto(new URL("/wp-admin/", baseUrl).toString(), {
      waitUntil: "domcontentloaded",
    });

    try {
      await page.waitForSelector("#wpbody-content", {
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  } finally {
    await context.close();
  }
}

async function getStorageState(
  browser: Browser,
  baseUrl: string,
  authState: string | boolean | undefined
) {
  if (authState === false) {
    return undefined;
  }

  const storageState =
    authState === true ? getDefaultAuthStatePath(baseUrl) : authState;

  if (!storageState) {
    return undefined;
  }

  if (!fs.existsSync(storageState)) {
    console.log(`Auth state not found. Logging in: ${storageState}`);
    await createAuthState(browser, baseUrl, storageState);
  } else if (!verifiedStorageStates.has(storageState)) {
    if (!(await isStorageStateValid(browser, baseUrl, storageState))) {
      console.log(`Auth state expired. Logging in again: ${storageState}`);
      await createAuthState(browser, baseUrl, storageState);
    }

    verifiedStorageStates.add(storageState);
  }

  return storageState;
}

async function main() {
  const scenarioPath = process.argv[2];

  if (!scenarioPath) {
    console.error("Usage: tsx scripts/screenshot-capture.ts article/01/screenshots.yaml");
    process.exit(1);
  }

  const scenarioDir = path.dirname(scenarioPath);
  const config = loadScreenshotConfig();
  const scenario = yaml.parse(fs.readFileSync(scenarioPath, "utf8")) as Scenario;
  const baseUrl = process.env.WP_BASE_URL || "http://localhost:8889";

  if (!Array.isArray(scenario.shots)) {
    throw new Error(`No shots found in scenario: ${scenarioPath}`);
  }

  const browser = await chromium.launch();

  try {
    for (const shot of scenario.shots) {
      const viewport =
        shot.viewport ?? scenario.defaults?.viewport ?? config.defaults?.viewport;
      const context = await browser.newContext({
        storageState: await getStorageState(
          browser,
          baseUrl,
          shot.authState ?? scenario.defaults?.authState ?? config.defaults?.authState
        ),
        viewport: viewport ?? {
          width: 1440,
          height: 1200,
        },
        deviceScaleFactor: shot.screenshot?.deviceScaleFactor ?? 1,
        locale: "ja-JP",
        timezoneId: "Asia/Tokyo",
      });

      const page = await context.newPage();

      if (viewport) {
        await page.setViewportSize(viewport);
      }

      await page.goto(resolveShotUrl(baseUrl, shot.url));

      if (shot.waitFor) {
        await page.waitForSelector(shot.waitFor);
      }

      await page.waitForTimeout(
        shot.delay ?? scenario.defaults?.delay ?? config.defaults?.delay ?? 0
      );

      await runActions(page, shot.actions);

      const outputPath = path.resolve(scenarioDir, shot.output);

      fs.mkdirSync(path.dirname(outputPath), {
        recursive: true,
      });

      if (shot.screenshot?.focus) {
        const resolvedViewport = viewport ?? { width: 1440, height: 1200 };
        const focusLocator = page.locator(shot.screenshot.focus.selector);
        await focusLocator.scrollIntoViewIfNeeded();
        const box = await focusLocator.boundingBox();

        if (!box) {
          throw new Error(`Focus selector was not found: ${shot.screenshot.focus.selector}`);
        }

        if (shot.screenshot.zoom) {
          await saveZoomedCrop(
            page,
            outputPath,
            getFocusedCrop(box, resolvedViewport, {
              width: shot.screenshot.focus.width,
              height: shot.screenshot.focus.height,
              padding: shot.screenshot.focus.padding,
              zoom: shot.screenshot.zoom,
              outputScale: shot.screenshot.outputScale,
            })
          );
        } else {
          await page.screenshot({
            path: outputPath,
            clip: getClipAroundBox(box, resolvedViewport, {
              width: shot.screenshot.focus.width,
              height: shot.screenshot.focus.height,
              padding: shot.screenshot.focus.padding,
            }),
          });
        }
      } else if (shot.screenshot?.selector) {
        await page.locator(shot.screenshot.selector).screenshot({
          path: outputPath,
        });
      } else {
        await page.screenshot({
          path: outputPath,
          fullPage:
            shot.fullPage ??
            scenario.defaults?.fullPage ??
            config.defaults?.fullPage ??
            false,
          clip: shot.screenshot?.clip,
        });
      }

      console.log(`Captured: ${outputPath}`);

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
