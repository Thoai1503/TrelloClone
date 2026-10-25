"use client";

import Image from "next/image";
import { useState } from "react";

type AvatarProps = {
  label: string;
  userId?: number;
  imageUrl?: string | null;
  title?: string;
};

export default function Avatar({
  label,
  userId,
  imageUrl,
  title,
}: AvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const initial = label.trim().charAt(0).toLocaleUpperCase("vi") || "U";
  const imageFailed = imageUrl !== null && imageUrl === failedImageUrl;

  return (
    <div
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800 ring-2 ring-white"
      title={title ?? (userId === undefined ? label : `Người dùng ID ${userId}`)}
    >
      {imageUrl && !imageFailed ? (
        <Image
          alt=""
          className="h-full w-full rounded-full object-cover"
          height={36}
          onError={() => setFailedImageUrl(imageUrl)}
          src={imageUrl}
          unoptimized
          width={36}
        />
      ) : (
        initial
      )}
    </div>
  );
}
