import { Browser, chromium, Page } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import yaml from "yaml";

type Action =
  | { type: "click"; selector: string; method?: "mouse" | "dom" }
  | {
      type: "frameClick";
      frameSelector: string;
      selector: string;
      method?: "mouse" | "dom";
    }
  | { type: "hover"; selector: string }
  | { type: "focus"; selector: string }
  | { type: "waitFor"; selector: string }
  | { type: "frameWaitFor"; frameSelector: string; selector: string }
  | { type: "delay"; ms: number }
  | { type: "keyboard"; key?: string; text?: string };

type WpTheme =
  | string
  | {
      slug: string;
      version?: string | number;
    };

type WpPlugin =
  | string
  | {
      slug: string;
      version?: string | number;
      active?: boolean;
    };

type WpUpdates = {
  plugins?: boolean;
  themes?: boolean;
};

type AfterSnap = {
  wpTheme?: WpTheme;
  wpUpdates?: WpUpdates;
  wpPluginsDelete?: string[];
};

type WpEnv = {
  config?: string;
  baseUrl?: string;
  start?: boolean;
  update?: boolean;
};

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
  wpTheme?: WpTheme;
  wpPlugins?: WpPlugin[];
  wpEnv?: WpEnv;
  afterSnap?: AfterSnap;
  wpOptions?: Record<string, string | number | boolean>;
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
    wpTheme?: WpTheme;
    wpPlugins?: WpPlugin[];
    wpEnv?: WpEnv;
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

function getShotIds(args: string[]) {
  const ids: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === "--id") {
      const id = args[index + 1];

      if (!id) {
        throw new Error("--id requires a shot id.");
      }

      ids.push(id);
      index++;
      continue;
    }

    if (arg.startsWith("--id=")) {
      const id = arg.slice("--id=".length);

      if (!id) {
        throw new Error("--id requires a shot id.");
      }

      ids.push(id);
      continue;
    }

    ids.push(arg);
  }

  return ids;
}

let currentWpEnvConfig: string | undefined;

function getWpEnvBin() {
  return path.resolve(
    "node_modules",
    ".bin",
    process.platform === "win32" ? "wp-env.cmd" : "wp-env"
  );
}

function getWpEnvArgs(args: string[], config = currentWpEnvConfig) {
  return config ? [`--config=${config}`, ...args] : args;
}

function runWpCli(args: string[], errorMessage: string) {
  const result = spawnSync(
    getWpEnvBin(),
    getWpEnvArgs(["run", "cli", "wp", ...args]),
    {
      stdio: "inherit",
    }
  );

  if (result.status !== 0) {
    throw new Error(errorMessage);
  }
}

function getWpCliOutput(args: string[]) {
  const result = spawnSync(
    getWpEnvBin(),
    getWpEnvArgs(["run", "cli", "wp", ...args]),
    {
      encoding: "utf8",
    }
  );

  if (result.status !== 0) {
    return undefined;
  }

  return result.stdout.trim();
}

async function runActions(page: Page, actions: Action[] = []) {
  for (const action of actions) {
    if (action.type === "click") {
      const locator = page.locator(action.selector);

      if (action.method === "dom") {
        await locator.evaluate((element) => {
          (element as HTMLElement).click();
        });
      } else {
        await locator.click();
      }
    }

    if (action.type === "frameClick") {
      const locator = page
        .frameLocator(action.frameSelector)
        .locator(action.selector);

      if (action.method === "dom") {
        await locator.evaluate((element) => {
          (element as HTMLElement).click();
        });
      } else {
        await locator.click();
      }
    }

    if (action.type === "hover") {
      await page.locator(action.selector).hover();
    }

    if (action.type === "focus") {
      await page.locator(action.selector).focus();
    }

    if (action.type === "waitFor") {
      await page.waitForSelector(action.selector);
    }

    if (action.type === "frameWaitFor") {
      await page
        .frameLocator(action.frameSelector)
        .locator(action.selector)
        .waitFor();
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

function normalizeWpEnv(wpEnv: WpEnv | undefined) {
  if (wpEnv === undefined) {
    return undefined;
  }

  if (!wpEnv || Array.isArray(wpEnv) || typeof wpEnv !== "object") {
    throw new Error("wpEnv must be an object.");
  }

  if (wpEnv.config !== undefined && typeof wpEnv.config !== "string") {
    throw new Error("wpEnv.config must be a string.");
  }

  if (wpEnv.baseUrl !== undefined && typeof wpEnv.baseUrl !== "string") {
    throw new Error("wpEnv.baseUrl must be a string.");
  }

  if (wpEnv.start !== undefined && typeof wpEnv.start !== "boolean") {
    throw new Error("wpEnv.start must be a boolean.");
  }

  if (wpEnv.update !== undefined && typeof wpEnv.update !== "boolean") {
    throw new Error("wpEnv.update must be a boolean.");
  }

  const config = wpEnv.config?.trim();
  const baseUrl = wpEnv.baseUrl?.trim();

  if (config === "") {
    throw new Error("wpEnv.config must be a non-empty string.");
  }

  if (baseUrl === "") {
    throw new Error("wpEnv.baseUrl must be a non-empty string.");
  }

  if (baseUrl !== undefined) {
    new URL(baseUrl);
  }

  return {
    config,
    baseUrl,
    start: wpEnv.start ?? false,
    update: wpEnv.update ?? false,
  };
}

function getWpEnvKey(wpEnv: ReturnType<typeof normalizeWpEnv>) {
  return wpEnv?.config ?? "default";
}

const startedWpEnvs = new Set<string>();

function ensureWpEnvStarted(wpEnv: ReturnType<typeof normalizeWpEnv>) {
  if (!wpEnv?.start) {
    return;
  }

  const key = `${getWpEnvKey(wpEnv)}:${wpEnv.update ? "update" : "start"}`;

  if (startedWpEnvs.has(key)) {
    return;
  }

  const result = spawnSync(
    getWpEnvBin(),
    getWpEnvArgs(["start", ...(wpEnv.update ? ["--update"] : [])], wpEnv.config),
    {
      stdio: "inherit",
    }
  );

  if (result.status !== 0) {
    throw new Error(`Failed to start wp-env: ${getWpEnvKey(wpEnv)}`);
  }

  startedWpEnvs.add(key);
}

function updateWpOptions(wpOptions: Shot["wpOptions"]) {
  if (wpOptions === undefined) {
    return;
  }

  if (!wpOptions || Array.isArray(wpOptions) || typeof wpOptions !== "object") {
    throw new Error("wpOptions must be an object.");
  }

  for (const [name, value] of Object.entries(wpOptions)) {
    runWpCli(
      ["option", "update", name, String(value)],
      `Failed to update WordPress option: ${name}`
    );
  }
}

function normalizeWpTheme(wpTheme: WpTheme | undefined) {
  if (wpTheme === undefined) {
    return undefined;
  }

  if (typeof wpTheme === "string") {
    const slug = wpTheme.trim();

    if (slug === "") {
      throw new Error("wpTheme must be a non-empty string.");
    }

    return {
      slug,
    };
  }

  if (!wpTheme || Array.isArray(wpTheme) || typeof wpTheme !== "object") {
    throw new Error("wpTheme must be a string or an object.");
  }

  if (typeof wpTheme.slug !== "string") {
    throw new Error("wpTheme.slug must be a non-empty string.");
  }

  if (
    wpTheme.version !== undefined &&
    typeof wpTheme.version !== "string" &&
    typeof wpTheme.version !== "number"
  ) {
    throw new Error("wpTheme.version must be a string or a number.");
  }

  const slug = wpTheme.slug.trim();
  const version =
    wpTheme.version === undefined ? undefined : String(wpTheme.version).trim();

  if (slug === "") {
    throw new Error("wpTheme must be a non-empty string.");
  }

  if (version === "") {
    throw new Error("wpTheme.version must be a non-empty string.");
  }

  return {
    slug,
    version,
  };
}

function getWpThemeKey(wpTheme: ReturnType<typeof normalizeWpTheme>) {
  if (!wpTheme) {
    return undefined;
  }

  return wpTheme.version ? `${wpTheme.slug}@${wpTheme.version}` : wpTheme.slug;
}

function getInstalledWpThemeVersion(slug: string) {
  return getWpCliOutput(["theme", "get", slug, "--field=version"]);
}

function installWpTheme(wpTheme: ReturnType<typeof normalizeWpTheme>) {
  if (!wpTheme?.version) {
    return;
  }

  if (getInstalledWpThemeVersion(wpTheme.slug) === wpTheme.version) {
    return;
  }

  runWpCli(
    ["theme", "install", wpTheme.slug, "--", `--version=${wpTheme.version}`, "--force"],
    `Failed to install WordPress theme: ${wpTheme.slug}@${wpTheme.version}`
  );
}

function activateWpTheme(wpTheme: ReturnType<typeof normalizeWpTheme>) {
  if (!wpTheme) {
    return;
  }

  installWpTheme(wpTheme);

  runWpCli(
    ["theme", "activate", wpTheme.slug],
    `Failed to activate WordPress theme: ${wpTheme.slug}`
  );
}

function normalizeWpPlugin(wpPlugin: WpPlugin) {
  if (typeof wpPlugin === "string") {
    const slug = wpPlugin.trim();

    if (slug === "") {
      throw new Error("wpPlugins entries must be non-empty strings or objects.");
    }

    return {
      slug,
      active: true,
    };
  }

  if (!wpPlugin || Array.isArray(wpPlugin) || typeof wpPlugin !== "object") {
    throw new Error("wpPlugins entries must be strings or objects.");
  }

  if (typeof wpPlugin.slug !== "string") {
    throw new Error("wpPlugins.slug must be a non-empty string.");
  }

  if (
    wpPlugin.version !== undefined &&
    typeof wpPlugin.version !== "string" &&
    typeof wpPlugin.version !== "number"
  ) {
    throw new Error("wpPlugins.version must be a string or a number.");
  }

  if (wpPlugin.active !== undefined && typeof wpPlugin.active !== "boolean") {
    throw new Error("wpPlugins.active must be a boolean.");
  }

  const slug = wpPlugin.slug.trim();
  const version =
    wpPlugin.version === undefined ? undefined : String(wpPlugin.version).trim();

  if (slug === "") {
    throw new Error("wpPlugins.slug must be a non-empty string.");
  }

  if (version === "") {
    throw new Error("wpPlugins.version must be a non-empty string.");
  }

  return {
    slug,
    version,
    active: wpPlugin.active ?? true,
  };
}

function normalizeWpPlugins(wpPlugins: WpPlugin[] | undefined) {
  if (wpPlugins === undefined) {
    return undefined;
  }

  if (!Array.isArray(wpPlugins)) {
    throw new Error("wpPlugins must be an array.");
  }

  return wpPlugins.map(normalizeWpPlugin);
}

function getWpPluginsKey(wpPlugins: ReturnType<typeof normalizeWpPlugins>) {
  if (!wpPlugins) {
    return undefined;
  }

  return wpPlugins
    .map((wpPlugin) => {
      const version = wpPlugin.version ? `@${wpPlugin.version}` : "";
      const status = wpPlugin.active ? "active" : "inactive";

      return `${wpPlugin.slug}${version}:${status}`;
    })
    .join(",");
}

function getInstalledWpPluginVersion(slug: string) {
  return getWpCliOutput(["plugin", "get", slug, "--field=version"]);
}

function getInstalledWpPluginStatus(slug: string) {
  return getWpCliOutput(["plugin", "get", slug, "--field=status"]);
}

function installWpPlugin(wpPlugin: ReturnType<typeof normalizeWpPlugin>) {
  if (!wpPlugin.version) {
    return;
  }

  if (getInstalledWpPluginVersion(wpPlugin.slug) === wpPlugin.version) {
    return;
  }

  runWpCli(
    ["plugin", "install", wpPlugin.slug, "--", `--version=${wpPlugin.version}`, "--force"],
    `Failed to install WordPress plugin: ${wpPlugin.slug}@${wpPlugin.version}`
  );
}

function applyWpPlugins(wpPlugins: ReturnType<typeof normalizeWpPlugins>) {
  if (!wpPlugins) {
    return;
  }

  for (const wpPlugin of wpPlugins) {
    installWpPlugin(wpPlugin);

    if (wpPlugin.active) {
      runWpCli(
        ["plugin", "activate", wpPlugin.slug],
        `Failed to activate WordPress plugin: ${wpPlugin.slug}`
      );
    } else {
      runWpCli(
        ["plugin", "deactivate", wpPlugin.slug],
        `Failed to deactivate WordPress plugin: ${wpPlugin.slug}`
      );
    }
  }
}

function normalizeWpPluginsDelete(wpPluginsDelete: string[] | undefined) {
  if (wpPluginsDelete === undefined) {
    return undefined;
  }

  if (!Array.isArray(wpPluginsDelete)) {
    throw new Error("afterSnap.wpPluginsDelete must be an array.");
  }

  return wpPluginsDelete.map((wpPlugin) => {
    if (typeof wpPlugin !== "string") {
      throw new Error("afterSnap.wpPluginsDelete entries must be strings.");
    }

    const slug = wpPlugin.trim();

    if (slug === "") {
      throw new Error("afterSnap.wpPluginsDelete entries must be non-empty strings.");
    }

    return slug;
  });
}

function normalizeWpUpdates(wpUpdates: WpUpdates | undefined) {
  if (wpUpdates === undefined) {
    return undefined;
  }

  if (!wpUpdates || Array.isArray(wpUpdates) || typeof wpUpdates !== "object") {
    throw new Error("afterSnap.wpUpdates must be an object.");
  }

  if (wpUpdates.plugins !== undefined && typeof wpUpdates.plugins !== "boolean") {
    throw new Error("afterSnap.wpUpdates.plugins must be a boolean.");
  }

  if (wpUpdates.themes !== undefined && typeof wpUpdates.themes !== "boolean") {
    throw new Error("afterSnap.wpUpdates.themes must be a boolean.");
  }

  return {
    plugins: wpUpdates.plugins ?? false,
    themes: wpUpdates.themes ?? false,
  };
}

function normalizeAfterSnap(afterSnap: AfterSnap | undefined) {
  if (afterSnap === undefined) {
    return undefined;
  }

  if (!afterSnap || Array.isArray(afterSnap) || typeof afterSnap !== "object") {
    throw new Error("afterSnap must be an object.");
  }

  return {
    wpTheme: normalizeWpTheme(afterSnap.wpTheme),
    wpUpdates: normalizeWpUpdates(afterSnap.wpUpdates),
    wpPluginsDelete: normalizeWpPluginsDelete(afterSnap.wpPluginsDelete),
  };
}

function applyWpUpdates(wpUpdates: ReturnType<typeof normalizeWpUpdates>) {
  if (!wpUpdates) {
    return;
  }

  if (wpUpdates.plugins) {
    runWpCli(
      ["plugin", "update", "--all"],
      "Failed to update WordPress plugins."
    );
  }

  if (wpUpdates.themes) {
    runWpCli(
      ["theme", "update", "--all"],
      "Failed to update WordPress themes."
    );
  }
}

function deleteWpPlugins(wpPluginsDelete: ReturnType<typeof normalizeWpPluginsDelete>) {
  if (!wpPluginsDelete) {
    return;
  }

  for (const slug of wpPluginsDelete) {
    const status = getInstalledWpPluginStatus(slug);

    if (!status) {
      continue;
    }

    if (status === "active") {
      runWpCli(
        ["plugin", "deactivate", slug],
        `Failed to deactivate WordPress plugin before delete: ${slug}`
      );
    }

    runWpCli(
      ["plugin", "delete", slug],
      `Failed to delete WordPress plugin: ${slug}`
    );
  }
}

function applyAfterSnap(afterSnap: ReturnType<typeof normalizeAfterSnap>) {
  if (!afterSnap) {
    return;
  }

  applyWpUpdates(afterSnap.wpUpdates);
  deleteWpPlugins(afterSnap.wpPluginsDelete);
  activateWpTheme(afterSnap.wpTheme);
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
  const targetAspectRatio = targetWidth / targetHeight;
  const minSourceWidth = Math.max(targetWidth / zoom, box.width + padding * 2);
  const minSourceHeight = Math.max(targetHeight / zoom, box.height + padding * 2);
  let sourceWidth = minSourceWidth;
  let sourceHeight = minSourceHeight;

  if (sourceWidth / sourceHeight > targetAspectRatio) {
    sourceHeight = sourceWidth / targetAspectRatio;
  } else {
    sourceWidth = sourceHeight * targetAspectRatio;
  }

  if (sourceWidth > viewport.width) {
    sourceWidth = viewport.width;
    sourceHeight = sourceWidth / targetAspectRatio;
  }

  if (sourceHeight > viewport.height) {
    sourceHeight = viewport.height;
    sourceWidth = sourceHeight * targetAspectRatio;
  }
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

function getZoomedClipCrop(
  clip: { x: number; y: number; width: number; height: number },
  options: {
    zoom?: number;
    outputScale?: number;
  } = {}
) {
  const zoom = Math.max(options.zoom ?? 1, 1);
  const outputScale = Math.max(options.outputScale ?? 1, 1);

  return {
    source: clip,
    output: {
      width: clip.width * zoom * outputScale,
      height: clip.height * zoom * outputScale,
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
  const shotIds = getShotIds(process.argv.slice(3));

  if (!scenarioPath) {
    console.error(
      "Usage: tsx scripts/screenshot-capture.ts article/01/screenshots.yaml [shot-id ...]"
    );
    process.exit(1);
  }

  const scenarioDir = path.dirname(scenarioPath);
  const config = loadScreenshotConfig();
  const scenario = yaml.parse(fs.readFileSync(scenarioPath, "utf8")) as Scenario;
  const defaultBaseUrl = process.env.WP_BASE_URL || "http://localhost:8889";

  if (!Array.isArray(scenario.shots)) {
    throw new Error(`No shots found in scenario: ${scenarioPath}`);
  }

  const targetShotIds = new Set(shotIds);
  const availableShotIds = new Set(scenario.shots.map((shot) => shot.id));
  const unknownShotIds = shotIds.filter((shotId) => !availableShotIds.has(shotId));
  const shots =
    targetShotIds.size === 0
      ? scenario.shots
      : scenario.shots.filter((shot) => targetShotIds.has(shot.id));

  if (unknownShotIds.length > 0) {
    throw new Error(
      [
        `No shots matched the requested id: ${unknownShotIds.join(", ")}`,
        "Available shot ids:",
        ...scenario.shots.map((shot) => `- ${shot.id}`),
      ].join("\n")
    );
  }

  const browser = await chromium.launch();
  let activeWpEnv: string | undefined;
  let activeWpTheme: string | undefined;
  let activeWpPlugins: string | undefined;

  try {
    for (const shot of shots) {
      const wpEnv = normalizeWpEnv(
        shot.wpEnv ?? scenario.defaults?.wpEnv ?? config.defaults?.wpEnv
      );
      const wpEnvKey = getWpEnvKey(wpEnv);
      const baseUrl = wpEnv?.baseUrl ?? defaultBaseUrl;
      const viewport =
        shot.viewport ?? scenario.defaults?.viewport ?? config.defaults?.viewport;
      const wpTheme = normalizeWpTheme(
        shot.wpTheme ?? scenario.defaults?.wpTheme ?? config.defaults?.wpTheme
      );
      const wpThemeKey = getWpThemeKey(wpTheme);
      const wpPlugins = normalizeWpPlugins(
        shot.wpPlugins ?? scenario.defaults?.wpPlugins ?? config.defaults?.wpPlugins
      );
      const wpPluginsKey = getWpPluginsKey(wpPlugins);
      const afterSnap = normalizeAfterSnap(shot.afterSnap);

      ensureWpEnvStarted(wpEnv);
      currentWpEnvConfig = wpEnv?.config;

      if (wpEnvKey !== activeWpEnv) {
        activeWpTheme = undefined;
        activeWpPlugins = undefined;
        activeWpEnv = wpEnvKey;
      }

      if (wpThemeKey && wpThemeKey !== activeWpTheme) {
        activateWpTheme(wpTheme);
        activeWpTheme = wpThemeKey;
      }

      if (wpPluginsKey !== undefined && wpPluginsKey !== activeWpPlugins) {
        applyWpPlugins(wpPlugins);
        activeWpPlugins = wpPluginsKey;
      }

      updateWpOptions(shot.wpOptions);

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

      try {
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
        } else if (shot.screenshot?.zoom && shot.screenshot?.clip) {
          await saveZoomedCrop(
            page,
            outputPath,
            getZoomedClipCrop(shot.screenshot.clip, {
              zoom: shot.screenshot.zoom,
              outputScale: shot.screenshot.outputScale,
            })
          );
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
        applyAfterSnap(afterSnap);

        if (afterSnap?.wpUpdates?.plugins || afterSnap?.wpPluginsDelete?.length) {
          activeWpPlugins = undefined;
        }

        if (afterSnap?.wpUpdates?.themes) {
          activeWpTheme = undefined;
        }

        if (afterSnap?.wpTheme) {
          activeWpTheme = getWpThemeKey(afterSnap.wpTheme);
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
