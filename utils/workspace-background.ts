export function getWorkspaceBoardBackground(background: string | null): string {
  if (!background) {
    return "linear-gradient(135deg, #2563eb, #4f46e5)";
  }

  return background.startsWith("#")
    ? `linear-gradient(135deg, ${background}, #1e3a8a)`
    : background;
}
