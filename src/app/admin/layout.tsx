import { Layout } from "@olinfo/react-components";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <Layout>{children}</Layout>;
}
