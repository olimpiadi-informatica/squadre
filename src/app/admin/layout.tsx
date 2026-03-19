import type { ReactNode } from "react";

import { Layout } from "@olinfo/react-components";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
