"use client";

import Image from "next/image";
import { useState } from "react";

type AvatarProps = {
  label: string;
  userId?: number;
  imageUrl?: string | null;
  title?: string;
  size?: "small" | "default";
};

export default function Avatar({
  label,
  userId,
  imageUrl,
  title,
  size = "default",
}: AvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const initial = label.trim().charAt(0).toLocaleUpperCase("vi") || "U";
  const imageFailed = imageUrl !== null && imageUrl === failedImageUrl;
  const dimensions =
    size === "small"
      ? { className: "h-6 w-6 text-xs", pixels: 24 }
      : { className: "h-9 w-9 text-sm", pixels: 36 };

  return (
    <div
      aria-label={label}
      className={`flex ${dimensions.className} shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-800 ring-2 ring-white`}
      title={title ?? (userId === undefined ? label : `Người dùng ID ${userId}`)}
    >
      {imageUrl && !imageFailed ? (
        <Image
          alt=""
          className="h-full w-full rounded-full object-cover"
          height={dimensions.pixels}
          onError={() => setFailedImageUrl(imageUrl)}
          src={imageUrl}
          unoptimized
          width={dimensions.pixels}
        />
      ) : (
        initial
      )}
    </div>
  );
}
