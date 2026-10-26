"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  addCardMember,
  createCardComment,
  findCardMemberCandidate,
  updateCardDetails,
} from "@/app/actions/lists";
import type {
  BoardTask,
  CardActivityFeedItem,
  CardMemberSummary,
} from "@/app/types/board";
import { Avatar, Button, Icon } from "@/app/components/atoms";

type CardDetailsDialogProps = {
  boardToken: string;
  card: BoardTask;
  canEdit: boolean;
  onClose: () => void;
  onCardUpdated: (card: BoardTask) => void;
  onMemberAdded: (cardId: string, member: CardMemberSummary) => void;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function displayMemberName(member: CardMemberSummary): string {
  return member.full_name?.trim() || member.email || `Thành viên ${member.id}`;
}

export default function CardDetailsDialog({
  boardToken,
  card,
  canEdit,
  onClose,
  onCardUpdated,
  onMemberAdded,
}: CardDetailsDialogProps) {
  const [description, setDescription] = useState(card.description ?? "");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [startDate, setStartDate] = useState(card.start_date?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(card.due_date?.slice(0, 10) ?? "");
  const [locallyAddedMembers, setLocallyAddedMembers] = useState<
    CardMemberSummary[]
  >([]);
  const [locallyCreatedComments, setLocallyCreatedComments] = useState<
    CardActivityFeedItem[]
  >([]);
  const members = [
    ...card.members,
    ...locallyAddedMembers.filter(
      (member) => !card.members.some((current) => current.id === member.id),
    ),
  ];
  const activityFeed = [
    ...new Map(
      [...card.activityFeed, ...locallyCreatedComments].map((item) => [
        `${item.kind}-${item.id}`,
        item,
      ]),
    ).values(),
  ].sort(
    (first, second) =>
      Date.parse(second.created_at) - Date.parse(first.created_at) ||
      second.id.localeCompare(first.id),
  );
  const [commentDraft, setCommentDraft] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [candidate, setCandidate] = useState<CardMemberSummary | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [activePanel, setActivePanel] = useState<"members" | "dates" | null>(
    null,
  );
  const [panelPosition, setPanelPosition] = useState({ top: 16, left: 16, width: 320 });
  const [error, setError] = useState<string | null>(null);
  const membersTriggerRef = useRef<HTMLDivElement>(null);
  const datesTriggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isBusy =
    isSavingDescription ||
    isSavingDates ||
    isAddingMember ||
    isSubmittingComment;

  useLayoutEffect(() => {
    if (!activePanel) return;

    function updatePanelPosition() {
      const trigger =
        activePanel === "members"
          ? membersTriggerRef.current
          : datesTriggerRef.current;
      if (!trigger) return;

      const bounds = trigger.getBoundingClientRect();
      const viewportPadding = 16;
      const width = Math.min(448, window.innerWidth - viewportPadding * 2);
      const left = Math.max(
        viewportPadding,
        Math.min(bounds.left, window.innerWidth - width - viewportPadding),
      );
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 280;
      const belowTop = bounds.bottom + 8;
      const top =
        belowTop + panelHeight <= window.innerHeight - viewportPadding
          ? belowTop
          : Math.max(
              viewportPadding,
              Math.min(
                bounds.top - panelHeight - 8,
                window.innerHeight - panelHeight - viewportPadding,
              ),
            );

      setPanelPosition({ top, left, width });
    }

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [activePanel, candidate, email, isSearching, members.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isBusy, onClose]);

  useEffect(() => {
    if (
      !activePanel ||
      activePanel !== "members" ||
      !emailPattern.test(email.trim())
    ) {
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(() => {
      setIsSearching(true);
      void findCardMemberCandidate(boardToken, card.id, email.trim())
        .then((foundCandidate) => {
          if (active) setCandidate(foundCandidate);
        })
        .catch((cause: unknown) => {
          if (!active) return;
          console.error("Failed to find card member candidate.", cause);
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
  }, [activePanel, boardToken, card.id, email]);

  async function handleSaveDescription() {
    setIsSavingDescription(true);
    setError(null);
    try {
      const updatedCard = await updateCardDetails(
        boardToken,
        card.id,
        description,
        card.start_date?.slice(0, 10) || null,
        card.due_date?.slice(0, 10) || null,
      );
      if (!updatedCard) {
        throw new Error("Card details were rejected or access was denied.");
      }
      onCardUpdated(updatedCard);
      setDescription(updatedCard.description ?? "");
      setIsEditingDescription(false);
    } catch (cause: unknown) {
      console.error("Failed to save card description.", cause);
      setError("Không thể lưu mô tả. Vui lòng thử lại.");
    } finally {
      setIsSavingDescription(false);
    }
  }

  async function handleSaveDates() {
    if (startDate && endDate && startDate > endDate) {
      setError("Ngày bắt đầu không thể sau ngày kết thúc.");
      return;
    }

    setIsSavingDates(true);
    setError(null);
    try {
      const updatedCard = await updateCardDetails(
        boardToken,
        card.id,
        card.description ?? "",
        startDate || null,
        endDate || null,
      );
      if (!updatedCard) {
        throw new Error("Card dates were rejected or access was denied.");
      }
      onCardUpdated(updatedCard);
      setActivePanel(null);
    } catch (cause: unknown) {
      console.error("Failed to save card dates.", cause);
      setError("Không thể lưu ngày. Vui lòng thử lại.");
    } finally {
      setIsSavingDates(false);
    }
  }

  async function handleAddMember() {
    if (!candidate || isAddingMember) return;

    setIsAddingMember(true);
    setError(null);
    try {
      const member = await addCardMember(boardToken, card.id, candidate.id);
      if (!member) {
        throw new Error("Card member was rejected or access was denied.");
      }
      setLocallyAddedMembers((currentMembers) =>
        currentMembers.some((currentMember) => currentMember.id === member.id)
          ? currentMembers
          : [...currentMembers, member],
      );
      onMemberAdded(card.id, member);
      setEmail("");
      setCandidate(null);
    } catch (cause: unknown) {
      console.error("Failed to add card member.", cause);
      setError("Không thể thêm thành viên. Vui lòng thử lại.");
    } finally {
      setIsAddingMember(false);
    }
  }

  async function handleSubmitComment() {
    const content = commentDraft.trim();
    if (!content || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const createdComment = await createCardComment(
        boardToken,
        card.id,
        content,
      );
      if (!createdComment) {
        throw new Error("Card comment was rejected or access was denied.");
      }
      const nextFeed = [
        {
          kind: "comment" as const,
          ...createdComment,
        },
        ...activityFeed,
      ].sort(
        (first, second) =>
          Date.parse(second.created_at) - Date.parse(first.created_at) ||
          second.id.localeCompare(first.id),
      );
      setLocallyCreatedComments((currentComments) => [
        {
          kind: "comment",
          ...createdComment,
        },
        ...currentComments,
      ]);
      onCardUpdated({ ...card, activityFeed: nextFeed });
      setCommentDraft("");
    } catch (cause: unknown) {
      console.error("Failed to create card comment.", cause);
      setCommentError("Không thể gửi bình luận. Vui lòng thử lại.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  const dialog = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        aria-label="Đóng chi tiết thẻ"
        className="absolute inset-0 cursor-default bg-black/50"
        disabled={isBusy}
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <section
        aria-labelledby={`card-details-title-${card.id}`}
        aria-modal="true"
        className="relative z-10 flex max-h-[min(90vh,52rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white text-gray-900 shadow-2xl"
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 p-5 pb-0 sm:p-7 sm:pb-0">
          <div className="flex min-w-0 items-start gap-3">
            <Icon
              className={`mt-1 h-5 w-5 shrink-0 ${
                card.is_completed ? "text-green-600" : "text-gray-400"
              }`}
              name="check"
            />
            <div className="min-w-0">
              <h2
                className="break-words text-xl font-semibold"
                id={`card-details-title-${card.id}`}
              >
                {card.title}
              </h2>
              <p className="mt-1 text-sm text-gray-500">Chi tiết thẻ</p>
            </div>
          </div>
          <button
            aria-label="Đóng"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            disabled={isBusy}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
          <div className="p-5 sm:p-7 lg:min-h-0 lg:overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          <div ref={membersTriggerRef}>
            <button
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                activePanel === "members"
                  ? "border-blue-300 bg-blue-100 text-blue-900"
                  : "border-gray-300 bg-gray-100 text-gray-900 hover:border-gray-400 hover:bg-gray-200"
              }`}
              disabled={!canEdit}
              onClick={() => {
                setActivePanel(activePanel === "members" ? null : "members");
                setCandidate(null);
                setError(null);
              }}
              type="button"
            >
              <Icon className="h-4 w-4 text-current" name="members" />
              Thành viên
            </button>
          </div>
          <div ref={datesTriggerRef}>
            <button
              className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                activePanel === "dates"
                  ? "border-blue-300 bg-blue-100 text-blue-900"
                  : "border-gray-300 bg-gray-100 text-gray-900 hover:border-gray-400 hover:bg-gray-200"
              }`}
              disabled={!canEdit}
              onClick={() => {
                setActivePanel(activePanel === "dates" ? null : "dates");
                setError(null);
              }}
              type="button"
            >
              <span aria-hidden="true" className="text-current">▦</span>
              Ngày
              {(startDate || endDate) && (
                <span className="text-xs text-current">
                  {startDate || "—"} – {endDate || "—"}
                </span>
              )}
            </button>
          </div>
          {activePanel === "members" &&
            typeof document !== "undefined" &&
            createPortal(
            <div
              className="fixed z-[70] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-2xl"
              ref={panelRef}
              style={{
                top: panelPosition.top,
                left: panelPosition.left,
                width: panelPosition.width,
              }}
            >
              <h3 className="text-sm font-semibold">Thêm thành viên</h3>
              <label className="sr-only" htmlFor={`card-member-email-${card.id}`}>
                Email thành viên
              </label>
              <div className="relative mt-3 flex gap-2">
                <input
                  autoComplete="off"
                  className="h-10 min-w-0 flex-1 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  id={`card-member-email-${card.id}`}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setCandidate(null);
                    setIsSearching(false);
                    setError(null);
                  }}
                  placeholder="Nhập email..."
                  type="email"
                  value={email}
                />
                {candidate && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    <button
                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50"
                      onClick={() => void handleAddMember()}
                      type="button"
                    >
                      <Avatar
                        imageUrl={candidate.avatar_url}
                        label={displayMemberName(candidate)}
                        userId={candidate.id}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {displayMemberName(candidate)}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {candidate.email}
                        </span>
                      </span>
                      <span className="text-xs text-blue-700">Thêm</span>
                    </button>
                  </div>
                )}
                {isSearching && (
                  <span className="absolute right-3 top-3 text-xs text-gray-500">
                    Đang tìm...
                  </span>
                )}
                {!isSearching &&
                  !candidate &&
                  emailPattern.test(email.trim()) && (
                    <span className="absolute left-3 top-full mt-2 text-xs text-gray-500">
                      Không tìm thấy tài khoản phù hợp.
                    </span>
                  )}
              </div>
              {members.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {members.map((member) => (
                    <li className="flex items-center gap-2" key={member.id}>
                      <Avatar
                        imageUrl={member.avatar_url}
                        label={displayMemberName(member)}
                        userId={member.id}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm">
                          {displayMemberName(member)}
                        </span>
                        {member.email && (
                          <span className="block truncate text-xs text-gray-500">
                            {member.email}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {isAddingMember && (
                <p className="mt-2 text-xs text-gray-500">Đang thêm...</p>
              )}
            </div>,
            document.body,
          )}
          {activePanel === "dates" &&
            typeof document !== "undefined" &&
            createPortal(
            <div
              className="fixed z-[70] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-gray-900 shadow-2xl"
              ref={panelRef}
              style={{
                top: panelPosition.top,
                left: panelPosition.left,
                width: panelPosition.width,
              }}
            >
              <h3 className="text-sm font-semibold">Ngày của thẻ</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                    htmlFor={`card-start-date-${card.id}`}
                  >
                    Ngày bắt đầu (không bắt buộc)
                  </label>
                  <input
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    id={`card-start-date-${card.id}`}
                    onChange={(event) => setStartDate(event.target.value)}
                    type="date"
                    value={startDate}
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-xs font-medium text-gray-600"
                    htmlFor={`card-end-date-${card.id}`}
                  >
                    Ngày kết thúc
                  </label>
                  <input
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    id={`card-end-date-${card.id}`}
                    onChange={(event) => setEndDate(event.target.value)}
                    type="date"
                    value={endDate}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setActivePanel(null)}
                  type="button"
                >
                  Hủy
                </button>
                <Button
                  disabled={isSavingDates}
                  onClick={() => void handleSaveDates()}
                >
                  {isSavingDates ? "Đang lưu..." : "Lưu ngày"}
                </Button>
              </div>
            </div>,
            document.body,
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {members.length > 0 && (
          <div className="mt-5 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">
              Thành viên:
            </span>
            <div className="flex -space-x-2">
              {members.map((member) => (
                <span
                  className="rounded-full ring-2 ring-white"
                  key={member.id}
                  title={member.email || displayMemberName(member)}
                >
                  <Avatar
                    imageUrl={member.avatar_url}
                    label={displayMemberName(member)}
                    title={member.email || displayMemberName(member)}
                    userId={member.id}
                  />
                </span>
              ))}
            </div>
          </div>
        )}

        <section className="mt-7">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-800">Mô tả</h3>
            {canEdit && !isEditingDescription && (
              <button
                className="rounded-md px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                onClick={() => setIsEditingDescription(true)}
                type="button"
              >
                Chỉnh sửa
              </button>
            )}
          </div>
          {isEditingDescription ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                className="min-h-32 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                disabled={isSavingDescription}
                maxLength={20000}
                onChange={(event) => setDescription(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder="Thêm mô tả chi tiết cho thẻ..."
                value={description}
              />
              <div className="flex gap-2">
                <Button
                  className="bg-blue-700 text-white hover:bg-blue-800"
                  disabled={isSavingDescription}
                  onClick={() => void handleSaveDescription()}
                >
                  {isSavingDescription ? "Đang lưu..." : "Lưu mô tả"}
                </Button>
                <button
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  disabled={isSavingDescription}
                  onClick={() => {
                    setDescription(card.description ?? "");
                    setIsEditingDescription(false);
                  }}
                  type="button"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <p className="min-h-16 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-700">
              {card.description || "Chưa có mô tả cho thẻ này."}
            </p>
          )}
        </section>
          </div>

          <section
            aria-labelledby={`card-activity-title-${card.id}`}
            className="flex min-h-[22rem] flex-col border-t border-gray-200 p-5 sm:p-7 lg:min-h-0 lg:border-l lg:border-t-0"
          >
            <div className="flex shrink-0 items-center justify-between gap-3">
              <h3
                className="text-base font-semibold text-gray-900"
                id={`card-activity-title-${card.id}`}
              >
                Hoạt động và bình luận
              </h3>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {activityFeed.length}
              </span>
            </div>

            <form
              className="mt-4 shrink-0"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmitComment();
              }}
            >
              <label
                className="sr-only"
                htmlFor={`card-comment-input-${card.id}`}
              >
                Viết bình luận
              </label>
              <textarea
                className="min-h-24 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                disabled={isSubmittingComment}
                id={`card-comment-input-${card.id}`}
                maxLength={5000}
                onChange={(event) => {
                  setCommentDraft(event.target.value);
                  setCommentError(null);
                }}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (
                    event.key === "Enter" &&
                    (event.ctrlKey || event.metaKey)
                  ) {
                    event.preventDefault();
                    void handleSubmitComment();
                  }
                }}
                placeholder="Viết bình luận..."
                value={commentDraft}
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">
                  Ctrl/⌘ + Enter để gửi
                </span>
                <Button
                  className="bg-blue-700 text-white hover:bg-blue-800"
                  disabled={!commentDraft.trim() || isSubmittingComment}
                  type="submit"
                >
                  {isSubmittingComment ? "Đang gửi..." : "Gửi"}
                </Button>
              </div>
            </form>

            {commentError && (
              <p className="mt-3 shrink-0 text-sm text-red-600" role="alert">
                {commentError}
              </p>
            )}

            <div
              aria-live="polite"
              className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-gray-100 pt-4 pr-1"
            >
              {activityFeed.length > 0 ? (
                <div className="space-y-4">
                  {activityFeed.map((item) => {
                    const actor =
                      item.kind === "comment" ? item.author : item.actor;
                    const actorName =
                      actor.full_name?.trim() ||
                      actor.email ||
                      `Thành viên ${actor.id}`;
                    const timestamp = new Intl.DateTimeFormat("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(item.created_at));

                    return (
                      <article
                        className="flex items-start gap-3"
                        key={`${item.kind}-${item.id}`}
                      >
                        <Avatar
                          imageUrl={actor.avatar_url}
                          label={actorName}
                          size="small"
                          title={actor.email || actorName}
                          userId={actor.id}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-semibold text-gray-800">
                              {actorName}
                            </span>
                            <time
                              className="text-xs text-gray-500"
                              dateTime={item.created_at}
                            >
                              {timestamp}
                            </time>
                          </div>
                          {item.kind === "comment" ? (
                            <p className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-gray-50 px-3 py-2 text-sm leading-6 text-gray-700">
                              {item.content}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm leading-6 text-gray-700">
                              {item.action === "card_moved"
                                ? `đã chuyển thẻ “${item.cardTitle || card.title}” từ “${item.fromListName || "danh sách khác"}” sang “${item.toListName || "danh sách khác"}”.`
                                : "đã cập nhật hoạt động trên thẻ."}
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Chưa có hoạt động hoặc bình luận nào.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );

  return typeof document === "undefined"
    ? null
    : createPortal(dialog, document.body);
}
