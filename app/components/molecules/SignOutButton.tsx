"use client";

import { signOut } from "next-auth/react";

type SignOutButtonProps = {
  className?: string;
};

export default function SignOutButton({ className = "" }: SignOutButtonProps) {
  return (
    <button
      className={className}
      onClick={() => void signOut({ callbackUrl: "/" })}
      type="button"
    >
      Đăng xuất
    </button>
  );
}
