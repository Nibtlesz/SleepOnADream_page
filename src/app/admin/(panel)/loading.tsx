export default function Loading() {
  return (
    <div className="space-y-4" aria-busy aria-label="Cargando">
      <div className="h-12 w-60 animate-pulse bg-coal" />
      <div className="h-80 animate-pulse bg-coal" />
    </div>
  );
}
