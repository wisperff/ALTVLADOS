import type { NextConfig } from "next";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(rawBasePath)) {
  throw new Error("NEXT_PUBLIC_BASE_PATH must be a URL path such as /altzavod-site, not a full URL or URL scheme.");
}

const basePath = rawBasePath === "/" || rawBasePath === ""
  ? ""
  : `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`;

if (basePath && (!/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/.test(basePath) || /%(?![\da-f]{2})/i.test(basePath))) {
  throw new Error("NEXT_PUBLIC_BASE_PATH must be a URL path such as /altzavod-site, with valid percent escapes.");
}

if (basePath.split("/").some(segment => /^\.{1,2}$/.test(segment.replace(/%2e/gi, ".")))) {
  throw new Error("NEXT_PUBLIC_BASE_PATH must not contain . or .. path segments, including percent-encoded dots.");
}

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  poweredByHeader: false,
};

export default nextConfig;

