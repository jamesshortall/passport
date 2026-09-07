export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-4xl">📡</p>
      <h1 className="mt-3 text-2xl font-bold text-brand-navy">You're offline</h1>
      <p className="mt-2 text-slate-600">
        This page hasn't been saved for offline use yet. Country pages you've
        already visited will still work without a connection.
      </p>
    </div>
  );
}
