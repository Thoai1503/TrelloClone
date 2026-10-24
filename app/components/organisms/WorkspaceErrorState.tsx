import { Button } from "../atoms";

type WorkspaceErrorStateProps = {
  message: string;
  onRetry: () => void;
};

export default function WorkspaceErrorState({ message, onRetry }: WorkspaceErrorStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6">
      <section className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Có lỗi xảy ra</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">{message}</p>
        <Button className="mt-5" onClick={onRetry}>
          Thử lại
        </Button>
      </section>
    </main>
  );
}
