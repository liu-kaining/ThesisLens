export default function LoadingStockPage() {
  return (
    <main className="min-h-screen bg-canvas p-6">
      <div className="mx-auto max-w-7xl rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="h-6 w-32 animate-pulse rounded bg-line" />
        <div className="mt-6 h-10 w-72 animate-pulse rounded bg-line" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="h-40 animate-pulse rounded bg-line" />
          <div className="h-40 animate-pulse rounded bg-line" />
          <div className="h-40 animate-pulse rounded bg-line" />
        </div>
      </div>
    </main>
  );
}

