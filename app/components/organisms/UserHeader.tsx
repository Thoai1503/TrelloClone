"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useUser } from "@/app/providers/UserProvider";
import { useWorkspaceSearch } from "@/app/providers/WorkspaceSearchProvider";
import { Avatar } from "@/app/components/atoms";
import { BoardSearch, SignOutButton } from "@/app/components/molecules";
import CreateBoardDialog from "./CreateBoardDialog";

export default function UserHeader() {
  const user = useUser();
  const pathname = usePathname();
  const { search, setSearch } = useWorkspaceSearch();
  const isBoardCollection = /^\/u\/[^/]+\/board\/?$/.test(pathname);
  const displayName = user?.full_name?.trim() || user?.email || "Tài khoản";

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-gray-200 bg-white px-4 text-gray-900 sm:px-6">
      <Link
        aria-label="Trello - Trang chủ"
        className="flex items-center gap-2.5"
        href={user ? `/u/${encodeURIComponent(user.username)}/board` : "/"}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-black text-white shadow-sm">
          t
        </span>
        <span className="text-[21px] font-bold tracking-tight text-gray-800">
          trello
        </span>
      </Link>

      {isBoardCollection && (
        <div className="mx-4 hidden w-full max-w-[560px] flex-1 items-center gap-2 md:flex">
          <BoardSearch
            className="w-full flex-1"
            onChange={setSearch}
            value={search}
          />
          <CreateBoardDialog />
        </div>
      )}

      <div className="flex items-center gap-3">
        {isBoardCollection && (
          <div className="md:hidden">
            <CreateBoardDialog />
          </div>
        )}
        {user ? (
          <>
            <span
              className="hidden max-w-48 truncate text-sm text-gray-500 sm:inline"
              title={displayName}
            >
              {displayName}
            </span>
            <Avatar
              imageUrl={user.avatar_url}
              label={displayName}
              userId={user.id}
            />
            <SignOutButton className="rounded-md px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900" />
          </>
        ) : (
          <Link
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            href="/login"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
