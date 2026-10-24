import Link from "next/link";
import type { ReactNode } from "react";

type LoginPageProps = {
  children: ReactNode;
};

export default function LoginPage({ children }: LoginPageProps) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
        <Link
          aria-label="Trello - Trang chủ"
          className="mx-auto flex w-full max-w-md items-center gap-2.5 lg:mx-0"
          href="/"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-black text-white shadow-sm">
            t
          </span>
          <span className="text-[22px] font-bold tracking-tight text-slate-800">trello</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Chào mừng trở lại
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Đăng nhập để tiếp tục quản lý công việc và cộng tác cùng đội nhóm.
              </p>
            </div>
            {children}
            <p className="mt-8 text-center text-sm text-slate-500">
              Chưa có tài khoản?{" "}
              <span className="font-semibold text-blue-700">Đăng ký sẽ sớm ra mắt</span>
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md text-xs text-slate-400 lg:mx-0">
          Bằng việc tiếp tục, bạn đồng ý sử dụng Trello một cách an toàn và có trách nhiệm.
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-12 py-16 text-white lg:flex lg:items-center">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 -left-20 h-[30rem] w-[30rem] rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-100">
            Một không gian, cả đội cùng tiến
          </p>
          <h2 className="mt-5 text-5xl font-bold leading-tight tracking-tight">
            Biến kế hoạch thành tiến độ.
          </h2>
          <p className="mt-6 text-lg leading-8 text-blue-100">
            Gom dự án, nhiệm vụ và cuộc trò chuyện vào một nơi để cả nhóm luôn biết điều gì cần
            làm tiếp theo.
          </p>
          <div className="mt-12 rounded-2xl border border-white/15 bg-white/10 p-5 shadow-xl backdrop-blur-sm">
            <p className="text-sm font-semibold">Một đội nhóm đang tiến triển</p>
            <div className="mt-5 space-y-4">
              {[
                { label: "Lên kế hoạch", width: "w-full" },
                { label: "Thiết kế trải nghiệm", width: "w-4/5" },
                { label: "Chuẩn bị ra mắt", width: "w-3/5" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-xs text-blue-100">
                    <span>{item.label}</span>
                    <span>Đang tiến hành</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/20">
                    <div className={`h-1.5 rounded-full bg-cyan-200 ${item.width}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
