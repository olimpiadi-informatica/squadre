import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  productionBrowserSourceMaps: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  webpack: (config) => {
    if (config.target[0] === "web") {
      config.target[1] = "es2022";
    }
    return config;
  },
};

export default createMDX({ extension: /\.mdx?$/ })(config);
