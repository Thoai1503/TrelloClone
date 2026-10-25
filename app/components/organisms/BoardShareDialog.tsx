"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  addBoardMember,
  findBoardMemberCandidate,
} from "@/app/actions/boards";
import type {
  BoardMemberCandidate,
  BoardMemberSummary,
} from "@/app/types/board";

import { Avatar, Button, Icon } from "../atoms";

type BoardShareDialogProps = {
  boardToken: string;
  members: BoardMemberSummary[];
  onMemberAdded: (member: BoardMemberSummary) => void;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getMemberName(member: {
  id: number;
  email: string | null;
  full_name: string | null;
}): string {
  return member.full_name?.trim() || member.email || `Thành viên ${member.id}`;
}

export default function BoardShareDialog({
  boardToken,
  members,
  onMemberAdded,
}: BoardShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedMember, setSelectedMember] =
    useState<BoardMemberCandidate | null>(null);
  const [candidate, setCandidate] = useState<BoardMemberCandidate | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeDialog = useCallback(() => {
    if (isSubmitting) return;
    setIsOpen(false);
    setEmail("");
    setSelectedMember(null);
    setCandidate(null);
    setError(null);
  }, [isSubmitting]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        closeDialog();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeDialog, isOpen, isSubmitting]);

  useEffect(() => {
    if (!isOpen || selectedMember || !emailPattern.test(email.trim())) return;

    let active = true;
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      void findBoardMemberCandidate(boardToken, email.trim())
        .then((foundCandidate) => {
          if (active) setCandidate(foundCandidate);
        })
        .catch((cause: unknown) => {
          if (!active) return;
          console.error("Failed to find a board member candidate.", cause);
          setError("Không thể tìm tài khoản. Vui lòng thử lại.");
        })
        .finally(() => {
          if (active) setIsSearching(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [boardToken, email, isOpen, selectedMember]);

  async function handleShare() {
    if (!selectedMember || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const member = await addBoardMember(boardToken, selectedMember.id);
      if (!member) {
        setError("Không thể chia sẻ bảng. Hãy kiểm tra quyền truy cập.");
        return;
      }

      onMemberAdded(member);
      setSelectedMember(null);
      setCandidate(null);
      setEmail("");
    } catch (cause: unknown) {
      console.error("Failed to share board with member.", cause);
      setError("Không thể chia sẻ bảng lúc này. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const dialog = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Đóng hộp thoại chia sẻ bảng"
        className="absolute inset-0 cursor-default bg-black/45"
        disabled={isSubmitting}
        onClick={closeDialog}
        tabIndex={-1}
        type="button"
      />
      <section
        aria-labelledby="board-share-title"
        aria-modal="true"
        className="relative z-10 max-h-[min(90vh,42rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 text-gray-900 shadow-2xl sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold" id="board-share-title">
              Chia sẻ bảng
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Thêm thành viên để cùng cộng tác trên bảng này.
            </p>
          </div>
          <button
            aria-label="Đóng"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
            disabled={isSubmitting}
            onClick={closeDialog}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="mt-6">
          {selectedMember && (
            <div className="mb-2 flex">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 py-1 pl-1 pr-2 text-sm text-blue-900 ring-1 ring-blue-200">
                <Avatar
                  imageUrl={selectedMember.avatar_url}
                  label={getMemberName(selectedMember)}
                  userId={selectedMember.id}
                />
                <span className="max-w-56 truncate">
                  {selectedMember.email || getMemberName(selectedMember)}
                </span>
                <button
                  aria-label="Bỏ chọn thành viên"
                  className="ml-1 text-blue-700 hover:text-blue-950"
                  onClick={() => {
                    setSelectedMember(null);
                    setCandidate(null);
                  }}
                  type="button"
                >
                  ×
                </button>
              </span>
            </div>
          )}
          <label className="sr-only" htmlFor="board-share-email">
            Email thành viên
          </label>
          <div className="flex items-start gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                autoComplete="off"
                autoFocus
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                disabled={Boolean(selectedMember) || isSubmitting}
                id="board-share-email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setCandidate(null);
                  setIsSearching(false);
                  setError(null);
                }}
                placeholder="Nhập email thành viên..."
                type="email"
                value={email}
              />
              {(candidate || isSearching) && !selectedMember && (
                <div
                  className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                  role="listbox"
                >
                  {candidate ? (
                    <button
                      aria-selected="false"
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50"
                      onClick={() => {
                        setSelectedMember(candidate);
                        setCandidate(null);
                        setIsSearching(false);
                      }}
                      role="option"
                      type="button"
                    >
                      <Avatar
                        imageUrl={candidate.avatar_url}
                        label={getMemberName(candidate)}
                        userId={candidate.id}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {getMemberName(candidate)}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {candidate.email}
                        </span>
                      </span>
                    </button>
                  ) : (
                    <p className="px-3 py-2.5 text-sm text-gray-500">
                      Đang tìm tài khoản...
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button
              className="h-10 shrink-0"
              disabled={!selectedMember || isSubmitting}
              onClick={() => void handleShare()}
            >
              {isSubmitting ? "Đang chia sẻ..." : "Chia sẻ"}
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-7">
          <h3 className="text-sm font-semibold text-gray-900">
            Thành viên trong bảng
          </h3>
          {members.length > 0 ? (
            <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
              {members.map((member) => (
                <li
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                  key={member.id}
                >
                  <Avatar
                    imageUrl={member.avatar_url}
                    label={getMemberName(member)}
                    userId={member.id}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {getMemberName(member)}
                    </span>
                    {member.email && (
                      <span className="block truncate text-xs text-gray-500">
                        {member.email}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {member.role === "ADMIN"
                      ? "Quản trị viên"
                      : member.role === "VIEWER"
                        ? "Chỉ xem"
                        : "Thành viên"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Bảng chưa có thành viên.
            </p>
          )}
        </div>
      </section>
    </div>
  );

  return (
    <>
      <Button
        aria-haspopup="dialog"
        className="inline-flex h-9 shrink-0 items-center gap-2 border border-white/25 bg-white/10 px-3 text-white hover:bg-white/20"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
      >
        <Icon className="h-4 w-4" name="members" />
        <span className="hidden sm:inline">Chia sẻ</span>
      </Button>
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(dialog, document.body)}
    </>
  );
}
