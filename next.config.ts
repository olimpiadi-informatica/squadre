import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  productionBrowserSourceMaps: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  typedRoutes: true,
};

export default createMDX({ extension: /\.mdx?$/ })(config);
