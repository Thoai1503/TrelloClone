"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useWorkspaceSearch } from "@/app/providers/WorkspaceSearchProvider";

import { Icon } from "../atoms";

type WorkspaceSearchProps = {
  className?: string;
  value: string;
  onChange: (value: string) => void;
};

export default function WorkspaceSearch({ className = "", value, onChange }: WorkspaceSearchProps) {
  const { workspaces } = useWorkspaceSearch();
  const resultsId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const filteredWorkspaces = useMemo(() => {
    const query = value.trim().toLocaleLowerCase("vi");
    if (!query) return [];

    return workspaces.filter((workspace) =>
      `${workspace.name} ${workspace.description ?? ""}`
        .toLocaleLowerCase("vi")
        .includes(query),
    );
  }, [value, workspaces]);

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
        <span className="sr-only">Tìm kiếm workspace</span>
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
          placeholder="Tìm kiếm workspace..."
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
            filteredWorkspaces.map((workspace) => (
              <Link
                className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-blue-50 focus-visible:bg-blue-50 focus-visible:outline-none"
                href={`/workspaces/${workspace.encryptedId}`}
                key={workspace.encryptedId}
                onClick={() => {
                  setIsOpen(false);
                  onChange("");
                }}
                role="option"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {workspace.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-gray-500">
                    {workspace.description?.trim() || "Không có mô tả"}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-gray-500">
                  {workspace.boardCount} bảng
                </span>
              </Link>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-gray-500">
              Không tìm thấy workspace phù hợp.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
