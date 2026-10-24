export default function BoardDetailSkeleton() {
  return (
    <main className="flex h-[calc(100vh-68px)] flex-col overflow-hidden bg-blue-600 p-5 sm:p-7">
      <div className="h-14 shrink-0 border-b border-white/20" />
      <section className="mt-6 flex min-h-0 flex-1 gap-3 overflow-hidden">
        {[0, 1, 2].map((item) => (
          <div
            className="h-36 w-72 shrink-0 animate-pulse rounded-xl bg-white/20"
            key={item}
          />
        ))}
      </section>
    </main>
  );
}
