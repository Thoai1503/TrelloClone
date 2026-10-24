import Link from "next/link";

import type { CurrentUser } from "@/app/types/user";

import { Avatar } from "../atoms";
import { SignOutButton, WorkspaceSearch } from "../molecules";

type WorkspaceHeaderProps = {
  user: CurrentUser;
  search: string;
  onSearchChange: (value: string) => void;
};

export default function WorkspaceHeader({
  user,
  search,
  onSearchChange,
}: WorkspaceHeaderProps) {
  const displayName = user.full_name?.trim() || user.email || "Tài khoản demo";

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <Link aria-label="Trello - Trang chủ" className="flex items-center gap-2.5" href="/">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-black text-white shadow-sm">
          t
        </span>
        <span className="text-[21px] font-bold tracking-tight text-gray-800">trello</span>
      </Link>

      <WorkspaceSearch
        className="hidden w-full max-w-[440px] md:block"
        onChange={onSearchChange}
        value={search}
      />

      <div className="flex items-center gap-3">
        <span
          className="hidden max-w-48 truncate text-sm text-gray-500 sm:inline"
          title={displayName}
        >
          {displayName}
        </span>
        <Avatar label={displayName} userId={user.id} />
        <SignOutButton className="rounded-md px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900" />
      </div>
    </header>
  );
}
