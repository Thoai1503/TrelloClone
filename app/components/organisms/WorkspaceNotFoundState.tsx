export default function WorkspaceNotFoundState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6">
      <section className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Không tìm thấy người dùng</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Không tìm thấy tài khoản demo có ID 1. Hãy kiểm tra dữ liệu người dùng trong database.
        </p>
      </section>
    </main>
  );
}
