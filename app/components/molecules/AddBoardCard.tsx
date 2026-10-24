"use client";

import { useState, type FormEvent } from "react";

import { Button } from "../atoms";

type AddBoardCardProps = {
  disabled: boolean;
  onAdd: (name: string) => Promise<void>;
};

export default function AddBoardCard({ disabled, onAdd }: AddBoardCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Vui lòng nhập tên bảng.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd(trimmedName);
      setName("");
      setIsOpen(false);
    } catch (cause: unknown) {
      console.error("Failed to create workspace board.", cause);
      setError("Không thể thêm bảng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        className="flex h-36 w-64 shrink-0 items-center justify-center rounded-xl border border-dashed border-white/50 bg-white/15 px-4 text-sm font-semibold text-white transition hover:border-white hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        + Thêm danh sách khác
      </button>
    );
  }

  return (
    <form
      className="flex h-36 w-64 shrink-0 flex-col rounded-xl border border-gray-200 bg-white p-3 text-gray-900 shadow-sm"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="new-board-name">
        Tên bảng
      </label>
      <input
        autoFocus
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        disabled={isSubmitting}
        id="new-board-name"
        maxLength={150}
        onChange={(event) => {
          setName(event.target.value);
          setError(null);
        }}
        placeholder="Nhập tên bảng..."
        value={name}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="mt-auto flex items-center gap-2">
        <Button className="px-3 py-1.5" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Đang thêm..." : "Thêm"}
        </Button>
        <button
          className="rounded px-2 py-1.5 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed"
          disabled={isSubmitting}
          onClick={() => {
            setIsOpen(false);
            setError(null);
          }}
          type="button"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
