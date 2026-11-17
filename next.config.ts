import type { NextConfig } from "next";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
const basePath = rawBasePath === "/" || rawBasePath === ""
  ? ""
  : `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`;

if (basePath && !/^\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/.test(basePath)) {
  throw new Error("NEXT_PUBLIC_BASE_PATH must be a URL path such as /altzavod-site.");
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
