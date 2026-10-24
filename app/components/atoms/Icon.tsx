import type { ComponentProps, ReactNode } from "react";

export type IconName = "arrow" | "home" | "members" | "search" | "workspace";

type IconProps = Omit<ComponentProps<"svg">, "children"> & {
  name: IconName;
};

const iconPaths: Record<IconName, ReactNode> = {
  arrow: (
    <path
      d="M5 12h14m-6-6 6 6-6 6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  ),
  home: (
    <path
      d="m3.5 10 8.5-7 8.5 7v10.5h-6v-6h-5v6h-6V10Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  ),
  members: (
    <path
      d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm6-6.7a3.5 3.5 0 0 1 0 6.7m2 3h.5a3.5 3.5 0 0 1 3.5 3.5V20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4.2 4.2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </>
  ),
  workspace: (
    <>
      <rect height="15" rx="2" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="5" />
      <path d="M8 9v7m4-7v4m4-4v7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </>
  ),
};

export default function Icon({ name, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      {iconPaths[name]}
    </svg>
  );
}
