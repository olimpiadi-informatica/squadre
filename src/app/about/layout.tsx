import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="prose before:*:prose-blockquote:content-none  prose-ol:prose-ol:list-[lower-alpha]">
      {children}
    </div>
  );
}
