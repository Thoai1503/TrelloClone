"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  addCardMember,
  removeCardMember,
  updateCardDetails,
} from "@/app/actions/lists";
import type {
  BoardMemberSummary,
  BoardTask,
  CardMemberSummary,
} from "@/app/types/board";
import { Avatar, Button, Icon } from "@/app/components/atoms";

type CardDetailsControlsProps = {
  boardToken: string;
  boardMembers: BoardMemberSummary[];
  card: BoardTask;
  canEdit: boolean;
  onBusyChange: (isBusy: boolean) => void;
  onCardUpdated: (card: BoardTask) => void;
  onMemberAdded: (cardId: string, member: CardMemberSummary) => void;
  onMemberRemoved: (cardId: string, memberId: number) => void;
};

type ActivePanel = "members" | "dates" | null;

function displayMemberName(member: CardMemberSummary): string {
  return member.full_name?.trim() || member.email || `Thành viên ${member.id}`;
}

export default function CardDetailsControls({
  boardToken,
  boardMembers,
  card,
  canEdit,
  onBusyChange,
  onCardUpdated,
  onMemberAdded,
  onMemberRemoved,
}: CardDetailsControlsProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [panelPosition, setPanelPosition] = useState({
    top: 16,
    left: 16,
    width: 320,
  });
  const [locallyAddedMembers, setLocallyAddedMembers] = useState<
    CardMemberSummary[]
  >([]);
  const [locallyRemovedMemberIds, setLocallyRemovedMemberIds] = useState<
    number[]
  >([]);
  const members = [
    ...card.members.filter(
      (member) => !locallyRemovedMemberIds.includes(member.id),
    ),
    ...locallyAddedMembers.filter(
      (member) =>
        !card.members.some((current) => current.id === member.id) &&
        !locallyRemovedMemberIds.includes(member.id),
    ),
  ];
  const [memberSearch, setMemberSearch] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(card.start_date?.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(card.due_date?.slice(0, 10) ?? "");
  const [isSavingDates, setIsSavingDates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const membersTriggerRef = useRef<HTMLButtonElement>(null);
  const datesTriggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const availableBoardMembers = boardMembers
    .filter((member) => !members.some((current) => current.id === member.id))
    .filter((member) => {
      const search = memberSearch.trim().toLocaleLowerCase();
      return (
        !search ||
        displayMemberName(member).toLocaleLowerCase().includes(search) ||
        member.email?.toLocaleLowerCase().includes(search)
      );
    });

  useLayoutEffect(() => {
    if (!activePanel) return;

    function updatePosition() {
      const trigger =
        activePanel === "members"
          ? membersTriggerRef.current
          : datesTriggerRef.current;
      if (!trigger) return;

      const bounds = trigger.getBoundingClientRect();
      const padding = 16;
      const width = Math.min(448, window.innerWidth - padding * 2);
      const left = Math.max(
        padding,
        Math.min(bounds.left, window.innerWidth - width - padding),
      );
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 280;
      const belowTop = bounds.bottom + 8;
      const top =
        belowTop + panelHeight <= window.innerHeight - padding
          ? belowTop
          : Math.max(
              padding,
              Math.min(
                bounds.top - panelHeight - 8,
                window.innerHeight - panelHeight - padding,
              ),
            );

      setPanelPosition({ top, left, width });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [activePanel, memberSearch, members.length, availableBoardMembers.length]);

  async function handleAddMember(candidate: CardMemberSummary) {
    if (isAddingMember) return;

    setIsAddingMember(true);
    onBusyChange(true);
    setError(null);
    try {
      const member = await addCardMember(boardToken, card.id, candidate.id);
      if (!member) throw new Error("Card member could not be added.");
      setLocallyAddedMembers((current) =>
        current.some((item) => item.id === member.id) ? current : [...current, member],
      );
      setLocallyRemovedMemberIds((current) =>
        current.filter((id) => id !== member.id),
      );
      onMemberAdded(card.id, member);
      setMemberSearch("");
    } catch (cause: unknown) {
      console.error("Failed to add card member.", cause);
      setError("Không thể thêm thành viên. Vui lòng thử lại.");
    } finally {
      setIsAddingMember(false);
      onBusyChange(false);
    }
  }

  async function handleRemoveMember(member: CardMemberSummary) {
    if (removingMemberId !== null) return;

    setRemovingMemberId(member.id);
    onBusyChange(true);
    setError(null);
    try {
      const removed = await removeCardMember(boardToken, card.id, member.id);
      if (!removed) throw new Error("Card member could not be removed.");
      setLocallyRemovedMemberIds((current) =>
        current.includes(member.id) ? current : [...current, member.id],
      );
      setLocallyAddedMembers((current) =>
        current.filter((item) => item.id !== member.id),
      );
      onMemberRemoved(card.id, member.id);
    } catch (cause: unknown) {
      console.error("Failed to remove card member.", cause);
      setError("Không thể xóa thành viên khỏi thẻ. Vui lòng thử lại.");
    } finally {
      setRemovingMemberId(null);
      onBusyChange(false);
    }
  }

  async function handleSaveDates() {
    if (startDate && endDate && startDate > endDate) {
      setError("Ngày bắt đầu không thể sau ngày kết thúc.");
      return;
    }

    setIsSavingDates(true);
    onBusyChange(true);
    setError(null);
    try {
      const updatedCard = await updateCardDetails(
        boardToken,
        card.id,
        card.description ?? "",
        startDate || null,
        endDate || null,
      );
      if (!updatedCard) throw new Error("Card dates could not be updated.");
      onCardUpdated({ ...updatedCard, attachments: card.attachments });
      setActivePanel(null);
    } catch (cause: unknown) {
      console.error("Failed to save card dates.", cause);
      setError("Không thể lưu ngày. Vui lòng thử lại.");
    } finally {
      setIsSavingDates(false);
      onBusyChange(false);
    }
  }

  function togglePanel(panel: Exclude<ActivePanel, null>) {
    setActivePanel((current) => (current === panel ? null : panel));
    setError(null);
    if (panel === "members") {
      setMemberSearch("");
    } else {
      setStartDate(card.start_date?.slice(0, 10) ?? "");
      setEndDate(card.due_date?.slice(0, 10) ?? "");
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            activePanel === "members"
              ? "border-blue-300 bg-blue-100 text-blue-900"
              : "border-gray-300 bg-gray-100 text-gray-900 hover:border-gray-400 hover:bg-gray-200"
          }`}
          disabled={!canEdit}
          onClick={() => togglePanel("members")}
          ref={membersTriggerRef}
          type="button"
        >
          <Icon className="h-4 w-4 text-current" name="members" />
          Thành viên
        </button>
        <button
          className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            activePanel === "dates"
              ? "border-blue-300 bg-blue-100 text-blue-900"
              : "border-gray-300 bg-gray-100 text-gray-900 hover:border-gray-400 hover:bg-gray-200"
          }`}
          disabled={!canEdit}
          onClick={() => togglePanel("dates")}
          ref={datesTriggerRef}
          type="button"
        >
          <span aria-hidden="true">▦</span>
          Ngày
          {(startDate || endDate) && (
            <span className="text-xs">
              {startDate || "—"} – {endDate || "—"}
            </span>
          )}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {activePanel &&
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
            {activePanel === "members" ? (
              <>
                <h3 className="text-sm font-semibold">Thành viên của thẻ</h3>
                <label className="sr-only" htmlFor={`card-member-search-${card.id}`}>
                  Tìm thành viên trong board
                </label>
                <div className="mt-3">
                  <input
                    autoComplete="off"
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    id={`card-member-search-${card.id}`}
                    onChange={(event) => {
                      setMemberSearch(event.target.value);
                      setError(null);
                    }}
                    placeholder="Tìm thành viên trong board..."
                    type="search"
                    value={memberSearch}
                  />
                </div>
                {availableBoardMembers.length > 0 ? (
                  <ul className="mt-3 max-h-52 space-y-1 overflow-y-auto">
                    {availableBoardMembers.map((member) => (
                      <li key={member.id}>
                        <button
                          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-100 disabled:opacity-50"
                          disabled={isAddingMember}
                          onClick={() => void handleAddMember(member)}
                          type="button"
                        >
                          <Avatar
                            imageUrl={member.avatar_url}
                            label={displayMemberName(member)}
                            userId={member.id}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {displayMemberName(member)}
                            </span>
                            {member.email && (
                              <span className="block truncate text-xs text-gray-500">
                                {member.email}
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-blue-700">
                            {isAddingMember ? "Đang thêm..." : "Thêm"}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">
                    {boardMembers.length === 0
                      ? "Board chưa có thành viên."
                      : memberSearch.trim()
                        ? "Không tìm thấy thành viên phù hợp."
                        : "Tất cả thành viên board đã có trong card."}
                  </p>
                )}
                {members.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {members.map((member) => (
                      <li
                        className="flex items-center gap-2"
                        key={member.id}
                      >
                        <Avatar
                          imageUrl={member.avatar_url}
                          label={displayMemberName(member)}
                          userId={member.id}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">
                            {displayMemberName(member)}
                          </span>
                          {member.email && (
                            <span className="block truncate text-xs text-gray-500">
                              {member.email}
                            </span>
                          )}
                        </span>
                        <button
                          aria-label={`Xóa ${displayMemberName(member)} khỏi thẻ`}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          disabled={removingMemberId !== null}
                          onClick={() => void handleRemoveMember(member)}
                          type="button"
                        >
                          {removingMemberId === member.id ? "…" : "×"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </div>,
          document.body,
        )}

      {members.length > 0 && (
        <div className="mt-5 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Thành viên:</span>
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
    </>
  );
}
