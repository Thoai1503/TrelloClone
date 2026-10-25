"use client";

import { useMemo, useState } from "react";

import type { BoardList } from "@/app/types/board";

type BoardDueDateSidebarProps = {
  lists: BoardList[];
};

type DueDateList = {
  listId: string;
  listName: string;
  cards: BoardList["cards"];
};

function getLocalMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00`));
}

function formatWeekday(date: string): string {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(
    new Date(`${date}T00:00:00`),
  );
}

export default function BoardDueDateSidebar({
  lists,
}: BoardDueDateSidebarProps) {
  const [selectedMonth, setSelectedMonth] = useState(getLocalMonth);
  const [expandedLists, setExpandedLists] = useState<Set<string>>(
    () => new Set(),
  );

  const dateGroups = useMemo(() => {
    const groups = new Map<string, DueDateList[]>();

    for (const list of lists) {
      for (const card of list.cards) {
        if (!card.due_date) continue;
        const date = card.due_date.slice(0, 10);
        if (!date.startsWith(`${selectedMonth}-`)) continue;

        const dateLists = groups.get(date) ?? [];
        let dateList = dateLists.find((item) => item.listId === list.id);
        if (!dateList) {
          dateList = { listId: list.id, listName: list.name, cards: [] };
          dateLists.push(dateList);
          groups.set(date, dateLists);
        }
        dateList.cards.push(card);
      }
    }

    return [...groups.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [lists, selectedMonth]);

  const monthDates = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth =
      year === today.getFullYear() && month === today.getMonth() + 1;
    const firstDay = isCurrentMonth ? today.getDate() : 1;

    return Array.from(
      { length: daysInMonth - firstDay + 1 },
      (_, index) => {
      const day = String(firstDay + index).padStart(2, "0");
      return `${selectedMonth}-${day}`;
      },
    );
  }, [selectedMonth]);

  function shiftMonth(amount: number) {
    const current = new Date(`${selectedMonth}-01T00:00:00`);
    current.setMonth(current.getMonth() + amount);
    setSelectedMonth(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  function toggleList(date: string, listId: string) {
    const key = `${date}:${listId}`;
    setExpandedLists((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <aside
      aria-label="Lịch ngày hết hạn"
      className="flex h-full w-[27vw] min-w-[17rem] max-w-[32rem] shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm"
    >
      <header className="shrink-0 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
          >
            <rect
              height="17"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.8"
              width="18"
              x="3"
              y="4"
            />
            <path
              d="M16 2v4M8 2v4M3 9h18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.8"
            />
          </svg>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Chọn tháng</span>
            <input
              aria-label={`Tháng đang xem: ${formatMonth(selectedMonth)}`}
              className="w-full cursor-pointer border-0 bg-transparent text-sm font-semibold capitalize outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(event) => setSelectedMonth(event.target.value)}
              type="month"
              value={selectedMonth}
            />
          </label>
          <button
            aria-label="Tháng trước"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
            onClick={() => shiftMonth(-1)}
            type="button"
          >
            ‹
          </button>
          <button
            className="h-9 shrink-0 rounded-md border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
            onClick={() => setSelectedMonth(getLocalMonth())}
            type="button"
          >
            Hôm nay
          </button>
          <button
            aria-label="Tháng sau"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
            onClick={() => shiftMonth(1)}
            type="button"
          >
            ›
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-3">
            {monthDates.map((date) => {
              const dateLists =
                dateGroups.find(([groupDate]) => groupDate === date)?.[1] ?? [];
              const totalCards = dateLists.reduce(
                (total, list) => total + list.cards.length,
                0,
              );
              return (
                <li className="border-b border-gray-100 pb-3 last:border-0" key={date}>
                  <div className="mb-1 flex items-baseline gap-2 px-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold capitalize text-gray-900">
                      {formatWeekday(date)}
                    </span>
                    <time
                      className="shrink-0 text-sm text-gray-600"
                      dateTime={date}
                    >
                      {Number(date.slice(8, 10))} tháng{" "}
                      {Number(date.slice(5, 7))}
                    </time>
                    <span className="shrink-0 text-xs text-gray-500">
                      {totalCards > 0 ? totalCards : null}
                    </span>
                  </div>
                  {dateLists.length > 0 ? (
                    <ul className="space-y-1">
                      {dateLists.map((list) => {
                      const key = `${date}:${list.listId}`;
                      const isExpanded = expandedLists.has(key);
                      return (
                        <li key={key}>
                          <button
                            aria-expanded={isExpanded}
                            className="flex w-full items-center gap-2 rounded-md bg-gray-100 px-2.5 py-2 text-left text-sm text-gray-800 hover:bg-gray-200"
                            onClick={() => toggleList(date, list.listId)}
                            type="button"
                          >
                            <svg
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-gray-600"
                              fill="none"
                              viewBox="0 0 20 20"
                            >
                              <circle
                                cx="10"
                                cy="10"
                                r="7.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <path
                                d="M10 5.5V10l3 2"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeWidth="1.5"
                              />
                            </svg>
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {list.cards.length} thẻ đến hạn
                            </span>
                            <span className="max-w-24 truncate text-xs text-gray-500">
                              {list.listName}
                            </span>
                            <span
                              aria-hidden="true"
                              className={`shrink-0 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            >
                              ⌄
                            </span>
                          </button>
                          {isExpanded && (
                            <ul className="mt-2 space-y-1.5 pl-2">
                              {list.cards.map((card) => (
                                <li
                                  className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
                                  key={card.id}
                                  title={card.title}
                                >
                                  {card.title}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                      })}
                    </ul>
                  ) : (
                    <p className="px-2 py-1 text-sm text-gray-400">
                      Chưa lên kế hoạch nào
                    </p>
                  )}
                </li>
              );
            })}
        </ul>
      </div>
    </aside>
  );
}
