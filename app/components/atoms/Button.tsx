import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button">;

export default function Button({ className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      type={type}
      {...props}
    />
  );
}
