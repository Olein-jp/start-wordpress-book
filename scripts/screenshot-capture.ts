import { Browser, chromium, Page } from "playwright";
import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

type Action =
  | { type: "click"; selector: string }
  | { type: "waitFor"; selector: string }
  | { type: "delay"; ms: number }
  | { type: "keyboard"; key?: string; text?: string };

type Shot = {
  id: string;
  title?: string;
  memo?: string | string[];
  url: string;
  output: string;
  outputSuffix?: string | false;
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
    outputSuffix?: string | false;
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

function applyOutputSuffix(output: string, outputSuffix: string | false | undefined) {
  if (!outputSuffix) {
    return output;
  }

  const extension = path.extname(output);
  const basename = output.slice(0, -extension.length);

  if (basename.endsWith(outputSuffix)) {
    return output;
  }

  return `${basename}${outputSuffix}${extension}`;
}

function loadScreenshotConfig() {
  const configPath = path.resolve("screenshots.config.yaml");

  if (!fs.existsSync(configPath)) {
    return {};
  }

  return yaml.parse(fs.readFileSync(configPath, "utf8")) as ScreenshotConfig;
}

function getDefaultAuthStatePath(baseUrl: string) {
  const origin = new URL(baseUrl).origin
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");

  return `screenshots/auth/${origin}.json`;
}

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
        deviceScaleFactor: 1,
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

      const output = applyOutputSuffix(
        shot.output,
        shot.outputSuffix ??
          scenario.defaults?.outputSuffix ??
          config.defaults?.outputSuffix
      );
      const outputPath = path.resolve(scenarioDir, output);

      fs.mkdirSync(path.dirname(outputPath), {
        recursive: true,
      });

      if (shot.screenshot?.selector) {
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
