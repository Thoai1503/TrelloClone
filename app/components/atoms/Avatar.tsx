type AvatarProps = {
  label: string;
  userId?: number;
};

export default function Avatar({ label, userId }: AvatarProps) {
  const initial = label.trim().charAt(0).toLocaleUpperCase("vi") || "U";

  return (
    <div
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800 ring-2 ring-white"
      title={userId === undefined ? label : `Người dùng ID ${userId}`}
    >
      {initial}
    </div>
  );
}
