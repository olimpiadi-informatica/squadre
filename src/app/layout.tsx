import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Layout } from "@olinfo/react-components";

import "./globals.css";
import { Navbar } from "./navbar";

export const metadata: Metadata = {
  title: "OIS Stats",
  description: "Rankings and statistics of Italian Informatics Olympiads in Teams (OIS)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#e7e2df" />
        <meta name="theme-color" content="#15191e" media="(prefers-color-scheme: dark)" />
      </head>
      <body>
        <Layout>
          <Navbar />
          <div className="mx-auto flex w-full max-w-screen-xl grow flex-col p-4 pb-8">
            {children}
          </div>
        </Layout>
        {process.env.NODE_ENV === "production" && <GoogleAnalytics gaId="G-Q25K1YDNFL" />}
      </body>
    </html>
  );
}
