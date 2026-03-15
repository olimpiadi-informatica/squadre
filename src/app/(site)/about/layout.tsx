export default function Layout({ children }: LayoutProps<"/about">) {
  return (
    <div className="prose before:*:prose-blockquote:content-none  prose-ol:prose-ol:list-[lower-alpha]">
      {children}
    </div>
  );
}
