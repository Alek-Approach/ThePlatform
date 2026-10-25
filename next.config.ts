import type { NextConfig } from "next";

// While developing in GitHub Codespaces the app is viewed at
// https://<codespace>-3000.app.github.dev; let the dev server accept that address.
const devOrigins = process.env.NODE_ENV !== "production" ? ["*.app.github.dev", "*.preview.app.github.dev"] : [];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: devOrigins,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
