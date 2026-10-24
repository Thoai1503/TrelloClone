import { Button, Icon } from "../atoms";

type WorkspaceEmptyStateProps = {
  hasWorkspaces: boolean;
  search: string;
  onClearSearch: () => void;
};

export default function WorkspaceEmptyState({
  hasWorkspaces,
  search,
  onClearSearch,
}: WorkspaceEmptyStateProps) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon className="h-[18px] w-[18px]" name="workspace" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">
        {hasWorkspaces ? "Không tìm thấy workspace" : "Bạn chưa có workspace nào"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        {hasWorkspaces
          ? "Thử tìm bằng một tên khác hoặc xóa nội dung tìm kiếm."
          : "Workspace sẽ xuất hiện tại đây khi bạn tạo mới hoặc được mời tham gia."}
      </p>
      {search && (
        <Button
          className="mt-4 bg-transparent px-0 py-0 text-blue-700 shadow-none hover:bg-transparent hover:text-blue-800"
          onClick={onClearSearch}
        >
          Xóa tìm kiếm
        </Button>
      )}
    </div>
  );
}
