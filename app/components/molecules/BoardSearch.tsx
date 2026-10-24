"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useWorkspaceSearch } from "@/app/providers/WorkspaceSearchProvider";
import { useUser } from "@/app/providers/UserProvider";
import { filterWorkspaceBoards } from "@/utils/filter-workspaces";

import { Icon } from "../atoms";

type BoardSearchProps = {
  className?: string;
  value: string;
  onChange: (value: string) => void;
};

export default function BoardSearch({ className = "", value, onChange }: BoardSearchProps) {
  const { workspaces } = useWorkspaceSearch();
  const user = useUser();
  const resultsId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const filteredWorkspaces = useMemo(
    () => filterWorkspaceBoards(workspaces, value),
    [value, workspaces],
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      event.currentTarget.blur();
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label>
        <span className="sr-only">Tìm kiếm workspace và bảng</span>
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Icon className="h-4 w-4" name="search" />
        </span>
        <input
          aria-expanded={isOpen && value.trim().length > 0}
          aria-haspopup="listbox"
          aria-controls={resultsId}
          aria-autocomplete="list"
          className="h-10 w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Tìm kiếm bảng..."
          role="combobox"
          type="search"
          value={value}
        />
      </label>

      {isOpen && value.trim() && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 min-w-[280px] overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 text-gray-900 shadow-xl"
          id={resultsId}
          role="listbox"
        >
          {filteredWorkspaces.length > 0 ? (
            filteredWorkspaces.map((workspace) => {
              const query = value.trim().toLocaleLowerCase("vi");
              const matchingBoards = workspace.boards.filter((board) =>
                `${board.name} ${board.description ?? ""}`
                  .toLocaleLowerCase("vi")
                  .includes(query),
              );
              const workspaceMatches =
                `${workspace.name} ${workspace.description ?? ""}`
                  .toLocaleLowerCase("vi")
                  .includes(query);
              const workspaceHref = user
                ? `/u/${encodeURIComponent(user.username)}/board#workspace-${workspace.encryptedId}`
                : "/";
              const displayedBoardCount = workspaceMatches
                ? workspace.boardCount
                : matchingBoards.length;

              return (
                <div className="border-b border-gray-100 last:border-0" key={workspace.encryptedId}>
                  <Link
                    className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
                    href={workspaceHref}
                    onClick={() => {
                      setIsOpen(false);
                      onChange("");
                    }}
                    role="option"
                  >
                    <span className="min-w-0 truncate text-sm font-semibold">
                      {workspace.name}
                    </span>
                    <span className="shrink-0 text-xs text-gray-500">
                      {displayedBoardCount} bảng
                    </span>
                  </Link>
                  {(workspaceMatches ? workspace.boards : matchingBoards).map((board) => (
                    <Link
                      className="block truncate py-2 pl-8 pr-4 text-sm text-gray-600 transition hover:bg-blue-50 hover:text-blue-700"
                      href={`/board/${board.encryptedId}`}
                      key={board.encryptedId}
                      onClick={() => {
                        setIsOpen(false);
                        onChange("");
                      }}
                      role="option"
                    >
                      {board.name}
                    </Link>
                  ))}
                </div>
              );
            })
          ) : (
            <p className="px-4 py-3 text-sm text-gray-500">
              Không tìm thấy workspace hoặc bảng phù hợp.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
