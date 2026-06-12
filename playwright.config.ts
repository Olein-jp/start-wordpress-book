import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: process.env.WP_BASE_URL || "http://localhost:8889",
    viewport: {
      width: 1440,
      height: 1200,
    },
    deviceScaleFactor: 1,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  },
});
