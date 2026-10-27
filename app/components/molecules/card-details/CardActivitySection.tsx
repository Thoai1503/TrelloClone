"use client";

import { useState } from "react";

import { createCardComment } from "@/app/actions/lists";
import type {
  BoardTask,
  CardActivityFeedItem,
} from "@/app/types/board";
import { Avatar, Button } from "@/app/components/atoms";

type CardActivitySectionProps = {
  boardToken: string;
  card: BoardTask;
  onBusyChange: (isBusy: boolean) => void;
  onCardUpdated: (card: BoardTask) => void;
};

function describeActivity(
  item: Extract<CardActivityFeedItem, { kind: "activity" }>,
  cardTitle: string,
): string {
  const title = item.cardTitle || cardTitle;
  switch (item.action) {
    case "card_moved":
      return `đã chuyển thẻ “${title}” từ “${item.fromListName || "danh sách khác"}” sang “${item.toListName || "danh sách khác"}”.`;
    case "card_completed":
      return `đã đánh dấu thẻ “${title}” hoàn thành.`;
    case "card_uncompleted":
      return `đã đánh dấu thẻ “${title}” chưa hoàn thành.`;
    case "card_dates_updated":
      return `đã cập nhật ngày của thẻ “${title}”: bắt đầu ${item.fromStartDate || "chưa đặt"} → ${item.toStartDate || "chưa đặt"}, kết thúc ${item.fromEndDate || "chưa đặt"} → ${item.toEndDate || "chưa đặt"}.`;
    case "card_member_added":
      return `đã thêm ${item.memberName || "một thành viên"} vào thẻ “${title}”.`;
    case "card_member_removed":
      return `đã xóa ${item.memberName || "một thành viên"} khỏi thẻ “${title}”.`;
    case "card_attachment_deleted":
      return `đã xóa tệp “${item.attachmentName || "tệp đính kèm"}” khỏi thẻ “${title}”.`;
    default:
      return "đã cập nhật hoạt động trên thẻ.";
  }
}

export default function CardActivitySection({
  boardToken,
  card,
  onBusyChange,
  onCardUpdated,
}: CardActivitySectionProps) {
  const [commentDraft, setCommentDraft] = useState("");
  const [locallyCreatedComments, setLocallyCreatedComments] = useState<
    CardActivityFeedItem[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function handleSubmitComment() {
    const content = commentDraft.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    onBusyChange(true);
    setError(null);
    try {
      const createdComment = await createCardComment(
        boardToken,
        card.id,
        content,
      );
      if (!createdComment) throw new Error("Card comment could not be created.");

      const newComment: CardActivityFeedItem = {
        kind: "comment",
        ...createdComment,
      };
      const nextFeed = [...activityFeed, newComment].sort(
        (first, second) =>
          Date.parse(second.created_at) - Date.parse(first.created_at) ||
          second.id.localeCompare(first.id),
      );
      setLocallyCreatedComments((current) => [newComment, ...current]);
      onCardUpdated({ ...card, activityFeed: nextFeed });
      setCommentDraft("");
    } catch (cause: unknown) {
      console.error("Failed to create card comment.", cause);
      setError("Không thể gửi bình luận. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
      onBusyChange(false);
    }
  }

  return (
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
        <label className="sr-only" htmlFor={`card-comment-input-${card.id}`}>
          Viết bình luận
        </label>
        <textarea
          className="min-h-24 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
          disabled={isSubmitting}
          id={`card-comment-input-${card.id}`}
          maxLength={5000}
          onChange={(event) => {
            setCommentDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              void handleSubmitComment();
            }
          }}
          placeholder="Viết bình luận..."
          value={commentDraft}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400">Ctrl/⌘ + Enter để gửi</span>
          <Button
            className="bg-blue-700 text-white hover:bg-blue-800"
            disabled={!commentDraft.trim() || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi"}
          </Button>
        </div>
      </form>
      {error && (
        <p className="mt-3 shrink-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div
        aria-live="polite"
        className="mt-4 min-h-0 flex-1 overflow-y-auto border-t border-gray-100 pt-4 pr-1"
      >
        {activityFeed.length > 0 ? (
          <div className="space-y-4">
            {activityFeed.map((item) => {
              const actor = item.kind === "comment" ? item.author : item.actor;
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
                      item.action === "card_attachment_uploaded" &&
                      item.attachmentName &&
                      item.attachmentDownloadUrl ? (
                        <p className="mt-1 text-sm leading-6 text-gray-700">
                          đã đính kèm tệp{" "}
                          <a
                            className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
                            href={`${item.attachmentDownloadUrl}?inline=1`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {item.attachmentName}
                          </a>{" "}
                          vào thẻ “{item.cardTitle || card.title}”.
                        </p>
                      ) : (
                        <p className="mt-1 text-sm leading-6 text-gray-700">
                          {describeActivity(item, card.title)}
                        </p>
                      )
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
  );
}
