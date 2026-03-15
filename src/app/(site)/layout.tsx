import { Layout } from "@olinfo/react-components";

import { Navbar } from "./navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <Navbar />
      <div className="mx-auto flex w-full max-w-screen-xl grow flex-col p-4 pb-8 isolate">{children}</div>
    </Layout>
  );
}
