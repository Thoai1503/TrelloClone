import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Nhìn rõ mọi việc",
    description: "Tập hợp đầu việc, người phụ trách và tiến độ trong một không gian dễ theo dõi.",
  },
  {
    number: "02",
    title: "Làm việc cùng nhau",
    description: "Giúp cả nhóm thống nhất ưu tiên và luôn biết bước tiếp theo là gì.",
  },
  {
    number: "03",
    title: "Linh hoạt theo cách của bạn",
    description: "Sắp xếp bảng công việc theo quy trình phù hợp với từng dự án.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <header className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link aria-label="Tifo - Trang chủ" className="flex items-center gap-2.5" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-black text-white shadow-sm">
            T
          </span>
          <span className="text-[22px] font-bold tracking-tight text-slate-800">Tifo</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="flex items-center gap-5 sm:gap-9">
          <a
            className="text-sm font-semibold text-slate-600 transition hover:text-blue-700"
            href="#demo"
          >
            Demo
          </a>
          <Link
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:px-5"
            href="/login"
          >
            Đăng nhập
          </Link>
        </nav>
      </header>

      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(219,234,254,0.9),_transparent_52%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
              Làm việc rõ ràng hơn mỗi ngày
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl lg:text-[60px]">
              Mọi dự án,
              <br />
              <span className="text-blue-600">một tầm nhìn rõ ràng.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Sắp xếp công việc, phối hợp cùng đội nhóm và biến những kế hoạch lớn thành các bước
              tiến cụ thể — tất cả trong một không gian trực quan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                href="/login"
              >
                Bắt đầu với workspace
              </Link>
              <a
                className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                href="#features"
              >
                Khám phá tính năng
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Không gian làm việc trực quan cho cá nhân và đội nhóm.
            </p>
          </div>

          <div
            aria-label="Minh họa bảng quản lý công việc"
            className="relative mx-auto w-full max-w-[620px] scroll-mt-24"
            id="demo"
          >
            <div className="absolute -inset-5 -z-10 rounded-[32px] bg-blue-100/70 blur-2xl" />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-blue-900/10 sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">KHÔNG GIAN LÀM VIỆC</p>
                  <h2 className="mt-1 text-sm font-bold text-slate-800">Ra mắt sản phẩm mới</h2>
                </div>
                <div className="flex -space-x-2" aria-label="Các thành viên trong nhóm">
                  {["bg-violet-400", "bg-amber-400", "bg-emerald-400"].map((color, index) => (
                    <span
                      aria-hidden="true"
                      className={`h-8 w-8 rounded-full border-2 border-white ${color}`}
                      key={color}
                    >
                      <span className="sr-only">Thành viên {index + 1}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4 sm:gap-4">
                {[
                  {
                    title: "Cần làm",
                    color: "bg-blue-500",
                    tasks: ["Lên kế hoạch", "Phác thảo ý tưởng", "Chọn thông điệp"],
                  },
                  {
                    title: "Đang thực hiện",
                    color: "bg-amber-400",
                    tasks: ["Thiết kế trang chủ", "Chuẩn bị nội dung"],
                  },
                  {
                    title: "Hoàn thành",
                    color: "bg-emerald-500",
                    tasks: ["Tạo workspace", "Thống nhất mục tiêu"],
                  },
                ].map((column) => (
                  <div className="min-w-0 rounded-xl bg-slate-50 p-2.5 sm:p-3" key={column.title}>
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${column.color}`} />
                      <h3 className="truncate text-xs font-bold text-slate-700 sm:text-sm">
                        {column.title}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {column.tasks.map((task, index) => (
                        <div
                          className="rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm sm:p-3"
                          key={task}
                        >
                          <div
                            className={`mb-2 h-1.5 w-8 rounded-full ${
                              index === 0 ? column.color : "bg-slate-200"
                            }`}
                          />
                          <p className="text-[10px] font-medium leading-4 text-slate-700 sm:text-xs">
                            {task}
                          </p>
                          <div className="mt-3 h-1 w-10 rounded-full bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-xs font-medium text-blue-700">
                <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
                  +
                </span>
                Thêm danh sách công việc
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/70" id="features">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-700">Ít rối hơn, tiến xa hơn</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Tập trung vào điều quan trọng.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Từ ý tưởng đầu tiên đến khi hoàn thành, giữ mọi người và mọi việc cùng nhìn về một
              hướng.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                key={feature.number}
              >
                <span className="text-sm font-bold text-blue-600">{feature.number}</span>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© Trello</span>
          <span>Đưa công việc tiến về phía trước, cùng nhau.</span>
        </div>
      </footer>
    </main>
  );
}
