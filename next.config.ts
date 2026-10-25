import type { NextConfig } from "next";

// GitHub Codespaces shows the app at https://<codespace>-3000.app.github.dev while
// the server itself thinks it's at localhost:3000. Next.js blocks form saves when
// those differ (a protection against other websites submitting forms).
// While developing, we allow Codespaces addresses. A published app (production)
// does not get this exception.
const isDev = process.env.NODE_ENV !== "production";
const codespaceHosts = isDev ? ["*.app.github.dev", "*.preview.app.github.dev", "*.github.dev"] : [];

if (isDev && (process.env.CODESPACES || process.env.CODESPACE_NAME)) {
  console.log("✓ Codespaces detected — saving forms from your Codespace address is allowed.");
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: codespaceHosts,
  experimental: {
    serverActions: {
      allowedOrigins: codespaceHosts,
    },
  },
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
