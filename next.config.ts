import type { NextConfig } from "next";

// GitHub Codespaces shows the app at https://<codespace>-3000.app.github.dev while
// the server itself thinks it's at localhost:3000. Next.js blocks form saves when
// those differ (a protection against other websites submitting forms), so we
// allow exactly this Codespace's addresses — and nothing else. Ports 3000–3009
// are covered because Next.js moves to the next port if 3000 is busy.
const { CODESPACE_NAME, GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN } = process.env;
const codespaceHosts =
  CODESPACE_NAME && GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
    ? Array.from({ length: 10 }, (_, i) => `${CODESPACE_NAME}-${3000 + i}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`)
    : [];

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
