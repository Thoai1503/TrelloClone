export const WORKSPACE_COLORS = [
  { name: "Xanh dương", value: "#0c66e4" },
  { name: "Tím", value: "#7c3aed" },
  { name: "Xanh lá", value: "#0f766e" },
  { name: "Cam", value: "#c2410c" },
  { name: "Hồng", value: "#be185d" },
  { name: "Xám", value: "#475569" },
  { name: "Xanh ngọc", value: "#0e7490" },
  { name: "Lục", value: "#4d7c0f" },
] as const;

export function isWorkspaceColor(value: unknown): value is (typeof WORKSPACE_COLORS)[number]["value"] {
  return WORKSPACE_COLORS.some((color) => color.value === value);
}
