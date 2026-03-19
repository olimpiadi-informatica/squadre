import Link from "next/link";

type Props = {
  params: Promise<{ editionId: string }>;
};

export default async function AdminEditionPage({ params }: Props) {
  const { editionId } = await params;

  return (
    <div className="flex flex-col gap-4">
      <div className="breadcrumbs text-sm mb-4">
        <ul>
          <li>
            <Link href="/admin">Dashboard</Link>
          </li>
          <li>Edizione {editionId}</li>
        </ul>
      </div>
      <h1 className="text-3xl font-bold mb-2">Edizione: {editionId}</h1>
      <p className="text-base-content/60">
        Questa pagina è un placeholder. Il contenuto verrà aggiunto in seguito.
      </p>
    </div>
  );
}
