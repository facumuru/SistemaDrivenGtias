export function Encabezado({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-tinta">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-zinc-500">{subtitulo}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
