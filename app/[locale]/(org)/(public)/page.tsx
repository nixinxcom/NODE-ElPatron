type PageProps = {
  params: Promise<{
    locale: string;
    tenant: string;
  }>;
};

export default async function OrgIndexPage({ params }: PageProps) {
  const { tenant } = await params;

  return (
    <>
      <h2>Panel de organización</h2>
      <p>
        Estás en la zona interna de NIXINX.org para el tenant{" "}
        <strong>{tenant}</strong>.
      </p>
      <p>
        El dominio/puerto define el inquilino permitido; el middleware sigue
        bloqueando cualquier ruta fuera de la carpeta que corresponda.
      </p>
    </>
  );
}
