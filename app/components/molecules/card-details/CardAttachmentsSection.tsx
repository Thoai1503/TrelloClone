"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";

import type {
  BoardTask,
  CardActivityFeedItem,
  CardAttachmentSummary,
} from "@/app/types/board";

type CardAttachmentsSectionProps = {
  boardToken: string;
  card: BoardTask;
  canEdit: boolean;
  onBusyChange: (isBusy: boolean) => void;
  onCardUpdated: (card: BoardTask) => void;
};

function isAttachment(value: unknown): value is CardAttachmentSummary {
  if (typeof value !== "object" || value === null) return false;
  const attachment = value as Record<string, unknown>;
  return (
    typeof attachment.id === "string" &&
    typeof attachment.file_name === "string" &&
    (typeof attachment.mime_type === "string" ||
      attachment.mime_type === null) &&
    (typeof attachment.file_size === "string" ||
      attachment.file_size === null) &&
    typeof attachment.created_at === "string" &&
    typeof attachment.download_url === "string"
  );
}

function isActivityItem(value: unknown): value is CardActivityFeedItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  if (item.kind === "comment") return false;
  if (item.kind !== "activity" || typeof item.actor !== "object" || item.actor === null) {
    return false;
  }
  const actor = item.actor as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.action === "string" &&
    typeof item.created_at === "string" &&
    typeof actor.id === "number" &&
    (typeof item.attachmentName === "string" || item.attachmentName === null) &&
    (typeof item.attachmentDownloadUrl === "string" ||
      item.attachmentDownloadUrl === null)
  );
}

function getResponseError(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const error = (payload as Record<string, unknown>).error;
  return typeof error === "string" ? error : null;
}

function formatFileSize(size: string | null): string {
  if (!size) return "";
  const bytes = Number(size);
  if (!Number.isSafeInteger(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CardAttachmentsSection({
  boardToken,
  card,
  canEdit,
  onBusyChange,
  onCardUpdated,
}: CardAttachmentsSectionProps) {
  const [locallyAddedAttachments, setLocallyAddedAttachments] = useState<
    CardAttachmentSummary[]
  >([]);
  const attachments = [
    ...new Map(
      [...card.attachments, ...locallyAddedAttachments].map((attachment) => [
        attachment.id,
        attachment,
      ]),
    ).values(),
  ].sort(
    (first, second) =>
      Date.parse(second.created_at) - Date.parse(first.created_at) ||
      second.id.localeCompare(first.id),
  );
  const [preview, setPreview] = useState<CardAttachmentSummary | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(
    null,
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [locallyRemovedAttachmentIds, setLocallyRemovedAttachmentIds] = useState<
    string[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const visibleAttachments = attachments.filter(
    (attachment) => !locallyRemovedAttachmentIds.includes(attachment.id),
  );

  useEffect(() => {
    if (!openMenuId) return;

    function closeMenu(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        !event.target.closest("[data-attachment-menu]")
      ) {
        setOpenMenuId(null);
      }
    }
    function closeMenuOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenuId(null);
    }

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenuOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [openMenuId]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file || isUploading) return;

    setIsUploading(true);
    onBusyChange(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("boardToken", boardToken);
      formData.set("file", file);
      const response = await fetch(
        `/api/cards/${encodeURIComponent(card.id)}/attachments`,
        { method: "POST", body: formData },
      );
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          getResponseError(payload) ?? "Không thể tải tệp lên. Vui lòng thử lại.",
        );
      }

      const attachment =
        typeof payload === "object" && payload !== null
          ? (payload as Record<string, unknown>).attachment
          : null;
      const activity =
        typeof payload === "object" && payload !== null
          ? (payload as Record<string, unknown>).activity
          : null;
      if (!isAttachment(attachment) || !isActivityItem(activity)) {
        throw new Error("Máy chủ trả về thông tin tệp không hợp lệ.");
      }

      const nextAttachments = [...visibleAttachments, attachment].sort(
        (first, second) =>
          Date.parse(second.created_at) - Date.parse(first.created_at) ||
          second.id.localeCompare(first.id),
      );
      const nextActivityFeed = [...card.activityFeed, activity].sort(
        (first, second) =>
          Date.parse(second.created_at) - Date.parse(first.created_at) ||
          second.id.localeCompare(first.id),
      );
      setLocallyAddedAttachments((current) =>
        current.some((item) => item.id === attachment.id)
          ? current
          : [...current, attachment],
      );
      onCardUpdated({
        ...card,
        attachments: nextAttachments,
        activityFeed: nextActivityFeed,
      });
    } catch (cause: unknown) {
      console.error("Failed to upload card attachment.", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể tải tệp lên. Vui lòng thử lại.",
      );
    } finally {
      setIsUploading(false);
      onBusyChange(false);
      setInputKey((current) => current + 1);
    }
  }

  async function handleDelete(attachment: CardAttachmentSummary) {
    if (
      deletingAttachmentId ||
      !window.confirm(`Xóa tệp "${attachment.file_name}" khỏi thẻ?`)
    ) {
      return;
    }

    setDeletingAttachmentId(attachment.id);
    setOpenMenuId(null);
    onBusyChange(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/attachments/${encodeURIComponent(attachment.id)}`,
        { method: "DELETE" },
      );
      const payload: unknown = await response.json();
      const deleted =
        typeof payload === "object" &&
        payload !== null &&
        (payload as Record<string, unknown>).deleted === true;
      const activity =
        typeof payload === "object" && payload !== null
          ? (payload as Record<string, unknown>).activity
          : null;
      if (!deleted) {
        throw new Error(
          getResponseError(payload) ?? "Không thể xóa tệp. Vui lòng thử lại.",
        );
      }

      setLocallyRemovedAttachmentIds((current) =>
        current.includes(attachment.id) ? current : [...current, attachment.id],
      );
      setLocallyAddedAttachments((current) =>
        current.filter((item) => item.id !== attachment.id),
      );
      const remainingAttachments = visibleAttachments.filter(
        (item) => item.id !== attachment.id,
      );
      const nextActivityFeed = isActivityItem(activity)
        ? [...card.activityFeed, activity].sort(
            (first, second) =>
              Date.parse(second.created_at) - Date.parse(first.created_at) ||
              second.id.localeCompare(first.id),
          )
        : card.activityFeed;
      onCardUpdated({
        ...card,
        attachments: remainingAttachments,
        activityFeed: nextActivityFeed,
      });
      if (!response.ok) {
        setError(
          getResponseError(payload) ??
            "Tệp đã bị xóa khỏi thẻ nhưng chưa thể dọn khỏi nơi lưu trữ.",
        );
      }
    } catch (cause: unknown) {
      console.error("Failed to delete card attachment.", cause);
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể xóa tệp. Vui lòng thử lại.",
      );
    } finally {
      setDeletingAttachmentId(null);
      onBusyChange(false);
    }
  }

  return (
    <>
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Tệp đính kèm
            {visibleAttachments.length > 0 && (
              <span className="ml-2 text-xs font-medium text-gray-500">
                {visibleAttachments.length}
              </span>
            )}
          </h3>
          {canEdit && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-200 focus-within:ring-2 focus-within:ring-blue-500">
              <input
                key={inputKey}
                accept=".csv,.doc,.docx,.gif,.jpeg,.jpg,.pdf,.png,.ppt,.pptx,.txt,.webp,.xls,.xlsx"
                className="sr-only"
                disabled={isUploading}
                onChange={(event) => void handleUpload(event)}
                type="file"
              />
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  d="m7.5 10.8 5.4-5.4a2.5 2.5 0 0 1 3.5 3.5l-7.5 7.5a4 4 0 0 1-5.7-5.7l7.2-7.2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
              {isUploading ? "Đang tải..." : "Đính kèm"}
            </label>
          )}
        </div>
        {error && (
          <p className="mb-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {visibleAttachments.length > 0 ? (
          <ul className="space-y-2">
            {visibleAttachments.map((attachment) => (
              <li
                className="relative flex min-w-0 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2"
                key={attachment.id}
              >
                {attachment.mime_type?.startsWith("image/") ? (
                  <button
                    aria-label={`Xem ảnh ${attachment.file_name}`}
                    className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => setPreview(attachment)}
                    type="button"
                  >
                    <Image
                      alt={attachment.file_name}
                      className="object-cover"
                      fill
                      sizes="80px"
                      src={`${attachment.download_url}?inline=1`}
                      unoptimized
                    />
                  </button>
                ) : (
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-gray-500"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M5.5 2.5h6l4 4v10a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.4"
                    />
                    <path
                      d="M11.5 2.8v4h3.7M7 11h6m-6 3h6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.4"
                    />
                  </svg>
                )}
                <div className="min-w-0 flex-1">
                  <a
                    className="block truncate text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
                    href={`${attachment.download_url}?inline=1`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {attachment.file_name}
                  </a>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
                <div className="relative shrink-0" data-attachment-menu>
                  <button
                    aria-expanded={openMenuId === attachment.id}
                    aria-haspopup="menu"
                    aria-label={`Tùy chọn ${attachment.file_name}`}
                    className="rounded-md p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50"
                    disabled={deletingAttachmentId === attachment.id}
                    onClick={() =>
                      setOpenMenuId((current) =>
                        current === attachment.id ? null : attachment.id,
                      )
                    }
                    type="button"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <circle cx="4" cy="10" r="1.5" />
                      <circle cx="10" cy="10" r="1.5" />
                      <circle cx="16" cy="10" r="1.5" />
                    </svg>
                  </button>
                  {openMenuId === attachment.id && (
                    <div
                      className="absolute right-0 top-full z-20 mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                      role="menu"
                    >
                      <a
                        className="block px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        href={attachment.download_url}
                        onClick={() => setOpenMenuId(null)}
                        role="menuitem"
                      >
                        Tải xuống
                      </a>
                      {canEdit && (
                        <button
                          className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          disabled={deletingAttachmentId === attachment.id}
                          onClick={() => void handleDelete(attachment)}
                          role="menuitem"
                          type="button"
                        >
                          {deletingAttachmentId === attachment.id
                            ? "Đang xóa..."
                            : "Xóa tệp"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">
            Chưa có tệp nào được đính kèm.
          </p>
        )}
        <p className="mt-2 text-xs text-gray-400">Tối đa 10 MB / tệp</p>
      </section>

      {preview &&
        typeof document !== "undefined" &&
        createPortal(
          <ImagePreviewDialog
            attachment={preview}
            onClose={() => setPreview(null)}
          />,
          document.body,
        )}
    </>
  );
}

type ImagePreviewDialogProps = {
  attachment: CardAttachmentSummary;
  onClose: () => void;
};

function ImagePreviewDialog({
  attachment,
  onClose,
}: ImagePreviewDialogProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-label={`Xem ảnh ${attachment.file_name}`}
        aria-modal="true"
        className="relative flex h-full max-h-[90vh] w-full max-w-6xl flex-col items-center justify-center"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Đóng ảnh phóng to"
          className="absolute right-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <div className="relative min-h-0 w-full flex-1">
          <Image
            alt={attachment.file_name}
            className="object-contain"
            fill
            priority
            sizes="100vw"
            src={`${attachment.download_url}?inline=1`}
            unoptimized
          />
        </div>
        <p className="mt-3 max-w-full truncate text-sm text-white/90">
          {attachment.file_name}
        </p>
      </div>
    </div>
  );
}
