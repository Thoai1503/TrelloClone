"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  createBoardList,
  createListCard,
  reorderBoardCards,
  reorderBoardLists,
  setListCardCompleted,
  updateListCardTitle,
} from "@/app/actions/lists";
import type {
  BoardDetail,
  BoardList,
  BoardMemberSummary,
  BoardTask,
} from "@/app/types/board";
import { useUser } from "@/app/providers/UserProvider";

import { Avatar, Button, Icon } from "../atoms";
import { SortableBoardList } from "../molecules";
import BoardShareDialog from "./BoardShareDialog";

const boardCollisionDetection: CollisionDetection = (args) => {
  const activeType = String(args.active.id).split(":")[0];
  const validTypes = activeType === "card" ? ["card", "list"] : ["list"];
  const pointerCollisions = pointerWithin(args).filter((collision) =>
    validTypes.includes(String(collision.id).split(":")[0]),
  );
  const cardCollisions = pointerCollisions.filter(
    (collision) => String(collision.id).split(":")[0] === "card",
  );
  if (cardCollisions.length > 0) return cardCollisions;
  if (pointerCollisions.length > 0) return pointerCollisions;

  return closestCenter(args).filter((collision) =>
    validTypes.includes(String(collision.id).split(":")[0]),
  );
};

type BoardDetailViewProps = {
  board: BoardDetail;
};

export default function BoardDetailView({ board }: BoardDetailViewProps) {
  const user = useUser();
  const [lists, setLists] = useState(board.lists);
  const [members, setMembers] = useState(board.members);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isSavingCardOrder, setIsSavingCardOrder] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<BoardTask | null>(null);
  const pendingDragDropActions = useRef(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (pendingDragDropActions.current === 0) return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, []);

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    if (!activeId.startsWith("card:")) {
      setActiveCard(null);
      return;
    }

    const cardId = activeId.slice("card:".length);
    const card = lists
      .flatMap((list) => list.cards)
      .find((item) => item.id === cardId);
    setActiveCard(card ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (
      !board.canManageLists ||
      isAdding ||
      !over ||
      active.id === over.id ||
      isSavingOrder
    ) {
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId.startsWith("list:")) {
      const overListId = overId.startsWith("list:")
        ? overId.slice("list:".length)
        : null;
      const oldIndex = lists.findIndex(
        (list) => `list:${list.id}` === activeId,
      );
      const newIndex = overListId
        ? lists.findIndex((list) => list.id === overListId)
        : -1;
      if (oldIndex < 0 || newIndex < 0) return;

      const previousLists = lists;
      const reorderedLists = arrayMove(lists, oldIndex, newIndex);
      setLists(reorderedLists);
      setIsSavingOrder(true);
      pendingDragDropActions.current += 1;
      setError(null);

      try {
        const saved = await reorderBoardLists(
          board.encryptedId,
          reorderedLists.map((list) => list.id),
        );
        if (!saved) throw new Error("Board list order was rejected.");
      } catch (cause: unknown) {
        console.error("Failed to save board list order.", cause);
        setLists(previousLists);
        setError("Không thể lưu thứ tự danh sách. Vui lòng thử lại.");
      } finally {
        pendingDragDropActions.current -= 1;
        setIsSavingOrder(false);
      }
      return;
    }

    if (!activeId.startsWith("card:")) return;
    const activeCardId = activeId.slice("card:".length);
    const sourceList = lists.find((list) =>
      list.cards.some((card) => card.id === activeCardId),
    );
    const destinationListId = overId.startsWith("card:")
      ? lists.find((list) =>
          list.cards.some((card) => card.id === overId.slice("card:".length)),
        )?.id
      : overId.startsWith("list:")
        ? overId.slice("list:".length)
        : undefined;
    const destinationList = lists.find((list) => list.id === destinationListId);
    if (!sourceList || !destinationList) return;

    const sourceIndex = sourceList.cards.findIndex(
      (card) => card.id === activeCardId,
    );
    const targetIndex = overId.startsWith("card:")
      ? destinationList.cards.findIndex(
          (card) => card.id === overId.slice("card:".length),
        )
      : destinationList.cards.length;
    if (sourceIndex < 0 || targetIndex < 0) return;

    if (sourceList.id === destinationList.id) {
      const reorderedCards = arrayMove(
        sourceList.cards,
        sourceIndex,
        targetIndex,
      );
      if (
        reorderedCards.every(
          (card, index) => card.id === sourceList.cards[index]?.id,
        )
      ) {
        return;
      }
      await handleReorderCards(sourceList.id, reorderedCards);
      return;
    }

    const sourceCards = sourceList.cards.filter(
      (card) => card.id !== activeCardId,
    );
    const destinationCards = [...destinationList.cards];
    destinationCards.splice(targetIndex, 0, sourceList.cards[sourceIndex]);
    await handleReorderCards(
      sourceList.id,
      sourceCards,
      destinationList.id,
      destinationCards,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const createdList = await createBoardList(board.encryptedId, trimmedName);
      if (!createdList) {
        throw new Error("Board or list name is invalid, or access was denied.");
      }
      setLists((currentLists) => [...currentLists, createdList]);
      setName("");
      setIsAdding(false);
    } catch (cause: unknown) {
      console.error("Failed to create board list.", cause);
      setError("Không thể tạo danh sách. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddCard(
    listId: string,
    title: string,
  ): Promise<BoardTask> {
    const card = await createListCard(board.encryptedId, listId, title);
    if (!card) {
      throw new Error("List or card title is invalid, or access was denied.");
    }
    setLists((currentLists) =>
      currentLists.map((list) =>
        list.id === listId ? { ...list, cards: [...list.cards, card] } : list,
      ),
    );
    return card;
  }

  async function handleUpdateCard(
    cardId: string,
    title: string,
  ): Promise<BoardTask> {
    const updatedCard = await updateListCardTitle(
      board.encryptedId,
      cardId,
      title,
    );
    if (!updatedCard) {
      throw new Error("Card title was rejected or access was denied.");
    }

    setLists((currentLists) =>
      currentLists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card,
        ),
      })),
    );
    return updatedCard;
  }

  async function handleToggleCardCompleted(
    cardId: string,
    isCompleted: boolean,
  ): Promise<BoardTask> {
    const updatedCard = await setListCardCompleted(
      board.encryptedId,
      cardId,
      isCompleted,
    );
    if (!updatedCard) {
      throw new Error("Card completion update was rejected or access was denied.");
    }

    setLists((currentLists) =>
      currentLists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === updatedCard.id ? updatedCard : card,
        ),
      })),
    );
    return updatedCard;
  }

  async function handleReorderCards(
    sourceListId: string,
    sourceCards: BoardTask[],
    destinationListId = sourceListId,
    destinationCards = sourceCards,
  ): Promise<void> {
    if (isSavingCardOrder) return;

    const previousLists = lists;
    setLists((currentLists) =>
      currentLists.map((list) =>
        list.id === sourceListId
          ? { ...list, cards: sourceCards }
          : list.id === destinationListId
            ? { ...list, cards: destinationCards }
            : list,
      ),
    );
    setIsSavingCardOrder(true);
    pendingDragDropActions.current += 1;
    setError(null);

    try {
      const orderedLists =
        sourceListId === destinationListId
          ? [
              {
                listId: sourceListId,
                cardIds: sourceCards.map((card) => card.id),
              },
            ]
          : [
              {
                listId: sourceListId,
                cardIds: sourceCards.map((card) => card.id),
              },
              {
                listId: destinationListId,
                cardIds: destinationCards.map((card) => card.id),
              },
            ];
      const saved = await reorderBoardCards(board.encryptedId, orderedLists);
      if (!saved) throw new Error("Board card order was rejected.");
    } catch (cause: unknown) {
      console.error("Failed to save board card order.", cause);
      setLists(previousLists);
      setError("Không thể lưu thay đổi thẻ. Vui lòng thử lại.");
    } finally {
      pendingDragDropActions.current -= 1;
      setIsSavingCardOrder(false);
    }
  }

  return (
    <main
      className="flex h-[calc(100vh-68px)] flex-col overflow-hidden text-white"
      style={{ backgroundColor: board.backgroundColor }}
    >
      <header
        className="flex h-14 shrink-0 items-center border-b border-white/15 px-4 sm:px-6"
        style={{
          backgroundColor: `color-mix(in srgb, ${board.backgroundColor} 85%, black)`,
        }}
      >
        <Link
          aria-label="Quay lại danh sách workspace và bảng"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/90 transition hover:bg-white/15"
          href={
            user
              ? `/u/${encodeURIComponent(user.username)}/board#workspace-${board.workspaceEncryptedId}`
              : "/"
          }
        >
          <Icon className="h-5 w-5 rotate-180" name="arrow" />
        </Link>
        <span className="mx-3 h-7 w-px shrink-0 bg-white/25" />
        <div className="min-w-0">
          <p className="truncate text-xs text-white/70">
            {board.workspaceName}
          </p>
          <h1 className="truncate text-sm font-semibold sm:text-base">
            {board.name}
          </h1>
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-3">
          {members.length > 0 && (
            <div
              aria-label="Thành viên trong bảng"
              className="flex shrink-0 items-center -space-x-2"
            >
              {members.map((member: BoardMemberSummary) => {
                const name =
                  member.full_name?.trim() ||
                  member.email ||
                  `Thành viên ${member.id}`;
                return (
                  <span
                    aria-label={member.email || name}
                    className="rounded-full ring-2 ring-white"
                    key={member.id}
                    title={member.email || name}
                  >
                    <Avatar
                      imageUrl={member.avatar_url}
                      label={name}
                      title={member.email || name}
                      userId={member.id}
                    />
                  </span>
                );
              })}
            </div>
          )}
          {board.canManageMembers && (
            <BoardShareDialog
              boardToken={board.encryptedId}
              onMemberAdded={(member) =>
                setMembers((currentMembers) =>
                  currentMembers.some(
                    (currentMember) => currentMember.id === member.id,
                  )
                    ? currentMembers
                    : [...currentMembers, member],
                )
              }
            />
          )}
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col p-5 sm:p-7">
        <div className="mb-5 flex shrink-0 items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Danh sách công việc
            </h2>
            <p className="mt-1 text-sm text-white/75">
              Các danh sách (column) trong bảng này.
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-white/15 px-3 py-1.5 text-sm text-white">
            {lists.length} danh sách
          </span>
        </div>

        {error && (
          <p className="mb-4 shrink-0 text-sm text-white" role="alert">
            {error}
          </p>
        )}

        <DndContext
          collisionDetection={boardCollisionDetection}
          onDragCancel={() => setActiveCard(null)}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <div
            aria-label="Các danh sách trong bảng"
            className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden pb-4"
          >
            <SortableContext
              items={lists.map((list) => `list:${list.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list: BoardList) => (
                <SortableBoardList
                  disabled={
                    isSavingOrder ||
                    isSavingCardOrder ||
                    isAdding ||
                    !board.canManageLists
                  }
                  canAddCards={board.canManageLists}
                  key={list.id}
                  list={list}
                  onAddCard={handleAddCard}
                  onToggleCardCompleted={handleToggleCardCompleted}
                  onUpdateCard={handleUpdateCard}
                />
              ))}
            </SortableContext>

            {isAdding ? (
              <form
                className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-gray-100 p-3 text-gray-900 shadow-sm"
                onSubmit={handleSubmit}
              >
                <label className="sr-only" htmlFor="new-list-name">
                  Tên danh sách
                </label>
                <input
                  autoFocus
                  className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  id="new-list-name"
                  maxLength={150}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nhập tên danh sách..."
                  value={name}
                />
                <div className="flex items-center gap-2">
                  <Button disabled={isSubmitting || !name.trim()} type="submit">
                    {isSubmitting ? "Đang thêm..." : "Thêm danh sách"}
                  </Button>
                  <button
                    className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-200"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsAdding(false);
                      setError(null);
                    }}
                    type="button"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : board.canManageLists ? (
              <button
                className="flex h-12 w-72 shrink-0 items-center gap-2 rounded-xl bg-white/20 px-4 text-left text-sm font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSavingOrder}
                onClick={() => setIsAdding(true)}
                type="button"
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  +
                </span>
                Thêm danh sách khác
              </button>
            ) : null}
          </div>
          <DragOverlay dropAnimation={null} zIndex={1000}>
            {activeCard ? (
              <article className="flex w-60 items-start justify-between gap-2 rounded-lg bg-white p-3 text-sm text-gray-900 shadow-xl ring-1 ring-black/10">
                <span className="min-w-0 flex-1 break-words">
                  {activeCard.title}
                </span>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <circle cx="5" cy="3" r="1.2" />
                  <circle cx="11" cy="3" r="1.2" />
                  <circle cx="5" cy="8" r="1.2" />
                  <circle cx="11" cy="8" r="1.2" />
                  <circle cx="5" cy="13" r="1.2" />
                  <circle cx="11" cy="13" r="1.2" />
                </svg>
              </article>
            ) : null}
          </DragOverlay>
        </DndContext>
        {isSavingOrder && (
          <p aria-live="polite" className="shrink-0 text-sm text-white/75">
            Đang lưu thứ tự danh sách...
          </p>
        )}
      </section>
    </main>
  );
}
