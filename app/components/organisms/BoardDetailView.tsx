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
  type DragOverEvent,
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
  updateBoardListName,
  updateListCardTitle,
} from "@/app/actions/lists";
import type {
  BoardDetail,
  BoardList,
  BoardMemberSummary,
  CardMemberSummary,
  BoardTask,
} from "@/app/types/board";
import { useUser } from "@/app/providers/UserProvider";
import { createSerialAsyncQueue } from "@/utils/serialAsyncQueue";

import { Avatar, Button, Icon } from "../atoms";
import { SortableBoardList } from "../molecules";
import BoardDueDateSidebar from "./BoardDueDateSidebar";
import BoardShareDialog from "./BoardShareDialog";
import CardDetailsDialog from "./CardDetailsDialog";

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
  onBoardUpdated: () => Promise<BoardDetail>;
};

export default function BoardDetailView({
  board,
  onBoardUpdated,
}: BoardDetailViewProps) {
  const user = useUser();
  const [lists, setLists] = useState(board.lists);
  const [members, setMembers] = useState(board.members);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSaveCount, setPendingSaveCount] = useState(0);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<BoardTask | null>(null);
  const [cardDropTarget, setCardDropTarget] = useState<{
    listId: string;
    index: number;
  } | null>(null);
  const [activeCardDetailsId, setActiveCardDetailsId] = useState<string | null>(
    null,
  );
  const listsRef = useRef(lists);
  const pendingDragDropActions = useRef(0);
  const persistQueueRef = useRef(createSerialAsyncQueue());
  const activeDetailsCard =
    lists
      .flatMap((list) => list.cards)
      .find((card) => card.id === activeCardDetailsId) ?? null;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (pendingDragDropActions.current === 0) return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, []);

  async function refreshBoard() {
    try {
      const refreshedBoard = await onBoardUpdated();
      listsRef.current = refreshedBoard.lists;
      setLists(refreshedBoard.lists);
      setMembers(refreshedBoard.members);
      setError(null);
    } catch (cause: unknown) {
      console.error("Failed to refresh board after an update.", cause);
      setError(
        "Đã lưu thay đổi nhưng không thể tải lại bảng. Vui lòng thử lại.",
      );
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    setCardDropTarget(null);
    if (!activeId.startsWith("card:")) {
      setActiveCard(null);
      return;
    }

    const cardId = activeId.slice("card:".length);
    const card = listsRef.current
      .flatMap((list) => list.cards)
      .find((item) => item.id === cardId);
    setActiveCard(card ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!activeId.startsWith("card:") || !overId) {
      setCardDropTarget(null);
      return;
    }

    const currentLists = listsRef.current;
    const activeCardId = activeId.slice("card:".length);
    const sourceListId = currentLists.find((list) =>
      list.cards.some((card) => card.id === activeCardId),
    )?.id;
    const destinationList = overId.startsWith("card:")
      ? currentLists.find((list) =>
          list.cards.some((card) => card.id === overId.slice("card:".length)),
        )
      : overId.startsWith("list:")
        ? currentLists.find((list) => list.id === overId.slice("list:".length))
        : undefined;
    if (!destinationList || destinationList.id === sourceListId) {
      setCardDropTarget(null);
      return;
    }

    const index = overId.startsWith("card:")
      ? destinationList.cards.findIndex(
          (card) => card.id === overId.slice("card:".length),
        )
      : destinationList.cards.length;
    setCardDropTarget(index < 0 ? null : { listId: destinationList.id, index });
  }

  function enqueueBoardPersist(
    task: () => Promise<void>,
    info: { name: string; details: Record<string, unknown> },
  ) {
    pendingDragDropActions.current += 1;
    setPendingSaveCount((count) => count + 1);
    persistQueueRef.current.enqueue(async () => {
      try {
        await task();
      } finally {
        pendingDragDropActions.current -= 1;
        setPendingSaveCount((count) => Math.max(0, count - 1));
      }
    }, info);
  }

  function persistListOrder(orderedListIds: string[]) {
    enqueueBoardPersist(
      async () => {
        try {
          const saved = await reorderBoardLists(
            board.encryptedId,
            orderedListIds,
          );
          if (!saved) throw new Error("Board list order was rejected.");
          if (pendingDragDropActions.current === 1) await refreshBoard();
        } catch (cause: unknown) {
          console.error("Failed to save board list order.", cause);
          setError("Không thể lưu thứ tự danh sách. Vui lòng thử lại.");
          throw cause;
        }
      },
      {
        name: "reorderBoardLists",
        details: {
          orderedListIds,
        },
      },
    );
  }

  function persistCardOrder(
    orderedLists: { listId: string; cardIds: string[] }[],
  ) {
    enqueueBoardPersist(
      async () => {
        try {
          const saved = await reorderBoardCards(
            board.encryptedId,
            orderedLists,
          );
          if (!saved) throw new Error("Board card order was rejected.");
          if (pendingDragDropActions.current === 1) await refreshBoard();
        } catch (cause: unknown) {
          console.error("Failed to save board card order.", cause);
          setError("Không thể lưu thay đổi thẻ. Vui lòng thử lại.");
          throw cause;
        }
      },
      {
        name: "reorderBoardCards",
        details: {
          orderedLists,
        },
      },
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    setCardDropTarget(null);
    const { active, over } = event;
    if (!board.canManageLists || isAdding || !over || active.id === over.id) {
      return;
    }

    const currentLists = listsRef.current;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId.startsWith("list:")) {
      const overListId = overId.startsWith("list:")
        ? overId.slice("list:".length)
        : null;
      const oldIndex = currentLists.findIndex(
        (list) => `list:${list.id}` === activeId,
      );
      const newIndex = overListId
        ? currentLists.findIndex((list) => list.id === overListId)
        : -1;
      if (oldIndex < 0 || newIndex < 0) return;

      const reorderedLists = arrayMove(currentLists, oldIndex, newIndex);
      listsRef.current = reorderedLists;
      setLists(reorderedLists);
      setError(null);
      persistListOrder(reorderedLists.map((list) => list.id));
      return;
    }

    if (!activeId.startsWith("card:")) return;
    const activeCardId = activeId.slice("card:".length);
    const sourceList = currentLists.find((list) =>
      list.cards.some((card) => card.id === activeCardId),
    );
    const destinationListId = overId.startsWith("card:")
      ? currentLists.find((list) =>
          list.cards.some((card) => card.id === overId.slice("card:".length)),
        )?.id
      : overId.startsWith("list:")
        ? overId.slice("list:".length)
        : undefined;
    const destinationList = currentLists.find(
      (list) => list.id === destinationListId,
    );
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
      handleReorderCards(sourceList.id, reorderedCards);
      return;
    }

    const sourceCards = sourceList.cards.filter(
      (card) => card.id !== activeCardId,
    );
    const destinationCards = [...destinationList.cards];
    destinationCards.splice(targetIndex, 0, sourceList.cards[sourceIndex]);
    handleReorderCards(
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
      await refreshBoard();
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
    await refreshBoard();
    return card;
  }

  async function handleRenameList(
    listId: string,
    name: string,
  ): Promise<string> {
    const updatedName = await updateBoardListName(
      board.encryptedId,
      listId,
      name,
    );
    if (!updatedName) {
      throw new Error("List name was rejected or access was denied.");
    }

    const updatedLists = listsRef.current.map((list) =>
      list.id === listId ? { ...list, name: updatedName } : list,
    );
    listsRef.current = updatedLists;
    setLists(updatedLists);
    return updatedName;
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
          card.id === updatedCard.id
            ? {
                ...updatedCard,
                attachments: updatedCard.attachments.length
                  ? updatedCard.attachments
                  : card.attachments,
                activityFeed: card.activityFeed,
              }
            : card,
        ),
      })),
    );
    await refreshBoard();
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
      throw new Error(
        "Card completion update was rejected or access was denied.",
      );
    }

    setLists((currentLists) =>
      currentLists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === updatedCard.id
            ? {
                ...updatedCard,
                attachments: updatedCard.attachments.length
                  ? updatedCard.attachments
                  : card.attachments,
                activityFeed: card.activityFeed,
              }
            : card,
        ),
      })),
    );
    await refreshBoard();
    return updatedCard;
  }

  function handleCardDetailsUpdated(updatedCard: BoardTask) {
    setLists((currentLists) =>
      currentLists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === updatedCard.id
            ? {
                ...updatedCard,
                attachments: updatedCard.attachments.length
                  ? updatedCard.attachments
                  : card.attachments,
                activityFeed: updatedCard.activityFeed.length
                  ? updatedCard.activityFeed
                  : card.activityFeed,
              }
            : card,
        ),
      })),
    );
    void refreshBoard();
  }

  function handleCardMemberAdded(cardId: string, member: CardMemberSummary) {
    setLists((currentLists) =>
      currentLists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === cardId &&
          !card.members.some((currentMember) => currentMember.id === member.id)
            ? { ...card, members: [...card.members, member] }
            : card,
        ),
      })),
    );
    void refreshBoard();
  }

  function handleCardMemberRemoved(cardId: string, memberId: number) {
    setLists((currentLists) =>
      currentLists.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === cardId
            ? {
                ...card,
                members: card.members.filter(
                  (member) => member.id !== memberId,
                ),
              }
            : card,
        ),
      })),
    );
    void refreshBoard();
  }

  function handleReorderCards(
    sourceListId: string,
    sourceCards: BoardTask[],
    destinationListId = sourceListId,
    destinationCards = sourceCards,
  ) {
    const nextLists = listsRef.current.map((list) =>
      list.id === sourceListId
        ? { ...list, cards: sourceCards }
        : list.id === destinationListId
          ? { ...list, cards: destinationCards }
          : list,
    );
    listsRef.current = nextLists;
    setLists(nextLists);
    setError(null);

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
    persistCardOrder(orderedLists);
  }

  return (
    <div className="flex h-[calc(100vh-68px)] gap-3 overflow-hidden bg-white p-3">
      <BoardDueDateSidebar lists={lists} />
      <main
        className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl text-white shadow-sm"
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
                canManageMembers={board.canManageMembers}
                canManageAdminMembers={board.canManageAdminMembers}
                members={members}
                onMemberAdded={(member) => {
                  setMembers((currentMembers) =>
                    currentMembers.some(
                      (currentMember) => currentMember.id === member.id,
                    )
                      ? currentMembers.map((currentMember) =>
                          currentMember.id === member.id
                            ? member
                            : currentMember,
                        )
                      : [...currentMembers, member],
                  );
                  void refreshBoard();
                }}
                onMemberUpdated={(updatedMember) => {
                  setMembers((currentMembers) =>
                    currentMembers.map((member) =>
                      member.id === updatedMember.id ? updatedMember : member,
                    ),
                  );
                  void refreshBoard();
                }}
                onMemberRemoved={(memberId) => {
                  setMembers((currentMembers) =>
                    currentMembers.filter((member) => member.id !== memberId),
                  );
                  void refreshBoard();
                }}
              />
            )}
          </div>
        </header>

        <section className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
          {error && (
            <p className="mb-4 shrink-0 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <DndContext
              collisionDetection={boardCollisionDetection}
              onDragCancel={() => {
                setActiveCard(null);
                setCardDropTarget(null);
              }}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragStart={handleDragStart}
              sensors={sensors}
            >
              <div
                aria-label="Các danh sách trong bảng"
                className="flex min-h-0 min-w-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden pb-4"
              >
                <SortableContext
                  items={lists.map((list) => `list:${list.id}`)}
                  strategy={horizontalListSortingStrategy}
                >
                  {lists.map((list: BoardList) => (
                    <SortableBoardList
                      dropPreview={
                        activeCard && cardDropTarget?.listId === list.id
                          ? { index: cardDropTarget.index, card: activeCard }
                          : null
                      }
                      disabled={isAdding || !board.canManageLists}
                      canAddCards={board.canManageLists}
                      key={list.id}
                      list={list}
                      onAddCard={handleAddCard}
                      onOpenCardDetails={setActiveCardDetailsId}
                      onRenameList={handleRenameList}
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
                      <Button
                        disabled={isSubmitting || !name.trim()}
                        type="submit"
                      >
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
                    className="flex h-12 w-72 shrink-0 items-center gap-2 rounded-xl bg-white/20 px-4 text-left text-sm font-semibold text-white transition hover:bg-white/30"
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
                  <article className="flex w-60 rotate-[4deg] items-start justify-between gap-2 rounded-lg bg-white p-3 text-sm text-gray-900 shadow-xl ring-1 ring-black/10">
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
          </div>
          {pendingSaveCount > 0 && (
            <p aria-live="polite" className="shrink-0 text-sm text-gray-600">
              Đang lưu thứ tự...
            </p>
          )}
        </section>
      </main>
      {activeDetailsCard && (
        <CardDetailsDialog
          boardToken={board.encryptedId}
          canEdit={!isAdding && board.canManageLists}
          card={activeDetailsCard}
          key={activeDetailsCard.id}
          onCardUpdated={handleCardDetailsUpdated}
          onClose={() => setActiveCardDetailsId(null)}
          onMemberAdded={handleCardMemberAdded}
          onMemberRemoved={handleCardMemberRemoved}
        />
      )}
    </div>
  );
}
