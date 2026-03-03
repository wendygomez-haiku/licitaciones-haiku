export default function Home() {
  return (
    <main className="min-h-screen p-10 space-y-6">
      <h1 className="text-3xl font-bold">DaisyUI test</h1>

      <div className="flex gap-3 flex-wrap">
        <button className="btn">btn</button>
        <button className="btn btn-primary">primary</button>
        <button className="btn btn-secondary">secondary</button>
        <button className="btn btn-accent">accent</button>
      </div>

      <div className="alert alert-info">
        <span>Si esto se ve como un alert bonito, DaisyUI está ON.</span>
      </div>

      <div className="card bg-base-100 shadow-xl max-w-md">
        <div className="card-body">
          <h2 className="card-title">Card Daisy</h2>
          <p>Si ves sombra, padding y estilo de card, todo OK.</p>
          <div className="card-actions justify-end">
            <button className="btn btn-outline">Cancelar</button>
            <button className="btn btn-primary">Listo</button>
          </div>
        </div>
      </div>
    </main>
  );
}
