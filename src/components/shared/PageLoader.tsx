/** Ditampilkan selama kode halaman (lazy route) pertama kali diunduh. */
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
    </div>
  );
}
