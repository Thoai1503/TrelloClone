import { Icon } from "../atoms";

type WorkspaceCounterProps = {
  count: number;
};

export default function WorkspaceCounter({ count }: WorkspaceCounterProps) {
  return (
    <div className="flex h-10 items-center gap-2 self-start rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-600 shadow-sm sm:self-auto">
      <Icon className="h-[18px] w-[18px]" name="workspace" />
      <span>{count} workspace</span>
    </div>
  );
}
