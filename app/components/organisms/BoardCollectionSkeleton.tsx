export default function BoardCollectionSkeleton() {
  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#f7f8fa]">
      <div className="mx-auto flex min-h-[calc(100vh-68px)] max-w-[1440px]">
        <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-white md:block" />
        <main className="w-full p-6 sm:p-10">
          <div className="mx-auto max-w-6xl animate-pulse">
            <div className="h-8 w-56 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-80 max-w-full rounded bg-gray-200" />
            <div className="mt-10 h-6 w-48 rounded bg-gray-200" />
            <div className="mt-5 space-y-5">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-48 rounded-xl border border-gray-200 bg-white" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
