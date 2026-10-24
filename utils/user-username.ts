export function createUsername(
  fullName: string | null,
  email: string | null,
  userId: number,
): string {
  const source = fullName?.trim() || email?.split("@")[0] || "user";
  const slug = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "user"}-${userId}`;
}
