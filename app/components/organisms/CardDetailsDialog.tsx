"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type {
  BoardMemberSummary,
  BoardTask,
  CardMemberSummary,
} from "@/app/types/board";
import { Icon } from "@/app/components/atoms";
import CardActivitySection from "@/app/components/molecules/card-details/CardActivitySection";
import CardAttachmentsSection from "@/app/components/molecules/card-details/CardAttachmentsSection";
import CardDescriptionSection from "@/app/components/molecules/card-details/CardDescriptionSection";
import CardDetailsControls from "@/app/components/molecules/card-details/CardDetailsControls";

export type CardDetailsDialogProps = {
  boardToken: string;
  boardMembers: BoardMemberSummary[];
  locationLabel?: string;
  card: BoardTask;
  canEdit: boolean;
  onClose: () => void;
  onCardUpdated: (card: BoardTask) => void;
  onMemberAdded: (cardId: string, member: CardMemberSummary) => void;
  onMemberRemoved: (cardId: string, memberId: number) => void;
};

export default function CardDetailsDialog({
  boardToken,
  boardMembers,
  locationLabel,
  card,
  canEdit,
  onClose,
  onCardUpdated,
  onMemberAdded,
  onMemberRemoved,
}: CardDetailsDialogProps) {
  const [isBusy, setIsBusy] = useState(false);
  const pendingOperations = useRef(0);

  function handleBusyChange(busy: boolean) {
    pendingOperations.current = Math.max(
      0,
      pendingOperations.current + (busy ? 1 : -1),
    );
    setIsBusy(pendingOperations.current > 0);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isBusy, onClose]);

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
        className="relative z-10 flex max-h-[min(90vh,52rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white text-gray-900 shadow-2xl"
        role="dialog"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 p-5 pb-0 sm:p-7 sm:pb-0">
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
              <p className="mt-1 text-sm text-gray-500">
                Chi tiết thẻ
                {locationLabel ? ` · ${locationLabel}` : ""}
              </p>
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
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
          <div className="p-5 sm:p-7 lg:min-h-0 lg:overflow-y-auto">
            <CardDetailsControls
              boardToken={boardToken}
              boardMembers={boardMembers}
              canEdit={canEdit}
              card={card}
              onBusyChange={handleBusyChange}
              onCardUpdated={onCardUpdated}
              onMemberAdded={onMemberAdded}
              onMemberRemoved={onMemberRemoved}
            />
            <CardDescriptionSection
              boardToken={boardToken}
              canEdit={canEdit}
              card={card}
              onBusyChange={handleBusyChange}
              onCardUpdated={onCardUpdated}
            />
            <CardAttachmentsSection
              boardToken={boardToken}
              canEdit={canEdit}
              card={card}
              onBusyChange={handleBusyChange}
              onCardUpdated={onCardUpdated}
            />
          </div>
          <CardActivitySection
            boardToken={boardToken}
            card={card}
            onBusyChange={handleBusyChange}
            onCardUpdated={onCardUpdated}
          />
        </div>
      </section>
    </div>
  );

  return typeof document === "undefined"
    ? null
    : createPortal(dialog, document.body);
}
