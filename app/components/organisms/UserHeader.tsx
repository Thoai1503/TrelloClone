"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useUser } from "@/app/providers/UserProvider";
import { useWorkspaceSearch } from "@/app/providers/WorkspaceSearchProvider";
import { Avatar } from "@/app/components/atoms";
import { BoardSearch, SignOutButton } from "@/app/components/molecules";
import CreateBoardDialog from "./CreateBoardDialog";

export default function UserHeader() {
  const user = useUser();
  const pathname = usePathname();
  const { search, setSearch } = useWorkspaceSearch();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const isBoardDetail =
    /^\/board\/[^/]+\/?$/.test(pathname) ||
    /^\/u\/[^/]+\/board\/[^/]+\/?$/.test(pathname);
  const isBoardCollection =
    !isBoardDetail && /^\/u\/[^/]+\/board\/?$/.test(pathname);
  const displayName = user?.full_name?.trim() || user?.email || "Tài khoản";

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !accountMenuRef.current?.contains(event.target)
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-gray-200 bg-white px-4 text-gray-900 sm:px-6">
      <Link
        aria-label="Tifo - Trang chủ"
        className="flex items-center gap-2.5"
        href={user ? `/u/${encodeURIComponent(user.username)}/board` : "/"}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-black text-white shadow-sm">
          T
        </span>
        <span className="text-[21px] font-bold tracking-tight text-gray-800">
          Tifo
        </span>
      </Link>

      <div className="mx-4 hidden w-full max-w-[560px] flex-1 items-center gap-2 md:flex">
        <BoardSearch
          className="w-full flex-1"
          onChange={setSearch}
          value={search}
        />
        <CreateBoardDialog />
      </div>

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
            <div className="relative" ref={accountMenuRef}>
              <button
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                aria-label="Mở menu tài khoản"
                className="flex rounded-full outline-none ring-blue-500 focus-visible:ring-2 focus-visible:ring-offset-2"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                type="button"
              >
                <Avatar
                  imageUrl={user.avatar_url}
                  label={displayName}
                  userId={user.id}
                />
              </button>
              {isAccountMenuOpen && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 text-gray-900 shadow-xl"
                  role="menu"
                >
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold">
                      {displayName}
                    </p>
                    {user.email && (
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <div className="p-1">
                    <SignOutButton className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900" />
                  </div>
                </div>
              )}
            </div>
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
