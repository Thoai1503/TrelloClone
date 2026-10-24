import { Icon } from "../atoms";

type WorkspaceSearchProps = {
  className?: string;
  value: string;
  onChange: (value: string) => void;
};

export default function WorkspaceSearch({ className = "", value, onChange }: WorkspaceSearchProps) {
  return (
    <label className={`relative ${className}`}>
      <span className="sr-only">Tìm kiếm workspace</span>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
        <Icon className="h-4 w-4" name="search" />
      </span>
      <input
        className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tìm kiếm workspace..."
        type="search"
        value={value}
      />
    </label>
  );
}
