"use client";

import { useState } from "react";

import { updateCardDetails } from "@/app/actions/lists";
import type { BoardTask } from "@/app/types/board";
import { Button } from "@/app/components/atoms";

type CardDescriptionSectionProps = {
  boardToken: string;
  card: BoardTask;
  canEdit: boolean;
  onBusyChange: (isBusy: boolean) => void;
  onCardUpdated: (card: BoardTask) => void;
};

export default function CardDescriptionSection({
  boardToken,
  card,
  canEdit,
  onBusyChange,
  onCardUpdated,
}: CardDescriptionSectionProps) {
  const [description, setDescription] = useState(card.description ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    onBusyChange(true);
    setError(null);
    try {
      const updatedCard = await updateCardDetails(
        boardToken,
        card.id,
        description,
        card.start_date?.slice(0, 10) || null,
        card.due_date?.slice(0, 10) || null,
      );
      if (!updatedCard) throw new Error("Card description could not be saved.");
      onCardUpdated({ ...updatedCard, attachments: card.attachments });
      setDescription(updatedCard.description ?? "");
      setIsEditing(false);
    } catch (cause: unknown) {
      console.error("Failed to save card description.", cause);
      setError("Không thể lưu mô tả. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
      onBusyChange(false);
    }
  }

  return (
    <section className="mt-7">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-800">Mô tả</h3>
        {canEdit && !isEditing && (
          <button
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            Chỉnh sửa
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            className="min-h-32 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            disabled={isSaving}
            maxLength={20000}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            placeholder="Thêm mô tả chi tiết cho thẻ..."
            value={description}
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              className="bg-blue-700 text-white hover:bg-blue-800"
              disabled={isSaving}
              onClick={() => void handleSave()}
            >
              {isSaving ? "Đang lưu..." : "Lưu mô tả"}
            </Button>
            <button
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              disabled={isSaving}
              onClick={() => {
                setDescription(card.description ?? "");
                setError(null);
                setIsEditing(false);
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
  );
}
