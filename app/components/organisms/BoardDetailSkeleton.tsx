export default function BoardDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải bảng"
      className="flex h-[calc(100vh-68px)] gap-3 overflow-hidden bg-white p-3"
      role="status"
    >
      <aside className="flex h-full w-[27vw] min-w-[17rem] max-w-[32rem] shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex h-[62px] shrink-0 items-center justify-between border-b border-gray-200 px-4">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-8 animate-pulse rounded-md bg-gray-100" />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div className="h-9 flex-1 animate-pulse rounded-md bg-gray-100" />
          <div className="h-9 w-20 animate-pulse rounded-md bg-gray-100" />
          <div className="h-9 w-9 animate-pulse rounded-md bg-gray-100" />
        </div>
        <div className="space-y-4 p-4">
          {[0, 1, 2, 3].map((item) => (
            <div className="space-y-2" key={item}>
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="ml-3 h-8 animate-pulse rounded-md bg-gray-100" />
            </div>
          ))}
        </div>
      </aside>

      <main
        className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-blue-600 text-white shadow-sm"
        role="presentation"
      >
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/15 bg-black/10 px-4 sm:px-6">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-md bg-white/20" />
          <div className="h-7 w-px shrink-0 bg-white/20" />
          <div className="min-w-0 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-white/25" />
            <div className="h-4 w-40 max-w-[30vw] animate-pulse rounded bg-white/35" />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div className="flex -space-x-2">
              {[0, 1, 2].map((item) => (
                <div
                  className="h-8 w-8 animate-pulse rounded-full bg-white/35 ring-2 ring-blue-600"
                  key={item}
                />
              ))}
            </div>
            <div className="h-9 w-24 animate-pulse rounded-md bg-white/20" />
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
          <div className="flex min-h-0 flex-1 items-start gap-3 overflow-hidden pb-4">
            {[0, 1, 2].map((list) => (
              <div
                className="flex max-h-full min-h-32 w-72 shrink-0 animate-pulse flex-col gap-3 rounded-xl bg-gray-100 p-3"
                key={list}
              >
                <div className="flex items-center justify-between px-1">
                  <div className="h-4 w-28 rounded bg-gray-300" />
                  <div className="h-6 w-6 rounded bg-gray-200" />
                </div>
                {[0, 1, 2].slice(0, list === 1 ? 2 : 3).map((card) => (
                  <div
                    className={`space-y-3 rounded-lg bg-white p-3 shadow-sm ${
                      card === 1 && list !== 1 ? "h-28" : "h-16"
                    }`}
                    key={card}
                  >
                    <div className="h-3 w-11/12 rounded bg-gray-200" />
                    {card === 1 && list !== 1 && (
                      <>
                        <div className="h-3 w-2/3 rounded bg-gray-100" />
                        <div className="flex justify-between">
                          <div className="h-5 w-12 rounded-full bg-gray-100" />
                          <div className="h-5 w-5 rounded-full bg-gray-200" />
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div className="mt-auto h-8 rounded-md bg-gray-200/80" />
              </div>
            ))}
            <div className="h-12 w-72 shrink-0 animate-pulse rounded-xl bg-white/20" />
          </div>
        </section>
      </main>
      <span className="sr-only">Đang tải nội dung bảng...</span>
    </div>
  );
}
