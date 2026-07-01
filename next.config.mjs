/** @type {import('next').NextConfig} */

// Long-lived cache for rarely-changing static assets served from /public
// (images, icons, fonts). Next.js already serves hashed /_next/static assets
// as immutable; these public files use stable paths, so we cache them hard but
// keep stale-while-revalidate so a redeploy still refreshes them in the
// background (rename the file for an instant cache-bust when needed).
const STATIC_ASSET_CACHE = "public, max-age=2592000, stale-while-revalidate=86400";

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*.(svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf)",
        headers: [{ key: "Cache-Control", value: STATIC_ASSET_CACHE }],
      },
    ];
  },
};

export default nextConfig;
