import { chromium } from "playwright";
import fs from "node:fs";

const baseUrl = process.env.WP_BASE_URL || "http://localhost:8889";
const username = process.env.WP_USER || "admin";
const password = process.env.WP_PASSWORD || "password";

function getAuthStatePath(url: string) {
  const origin = new URL(url).origin
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");

  return `screenshots/auth/${origin}.json`;
}

async function main() {
  fs.mkdirSync("screenshots/auth", { recursive: true });

  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage({
    viewport: {
      width: 1440,
      height: 1200,
    },
  });

  try {
    await page.goto(new URL("/wp-admin/", baseUrl).toString());

    await page.fill("#user_login", username);
    await page.fill("#user_pass", password);
    await page.click("#wp-submit");

    await page.waitForSelector("#wpbody-content");

    await page.context().storageState({
      path: getAuthStatePath(baseUrl),
    });

    console.log("Saved auth state.");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
