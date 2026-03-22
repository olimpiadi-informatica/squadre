import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const config: NextConfig = {
  productionBrowserSourceMaps: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  typedRoutes: true,
  experimental: {
    authInterrupts: true,
  },
};

export default createMDX({ extension: /\.mdx?$/ })(config);
