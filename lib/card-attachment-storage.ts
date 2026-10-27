import "server-only";

import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export const MAX_CARD_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const allowedMimeTypes: Record<string, string> = {
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function sanitizeAttachmentName(name: string): string | null {
  const sanitized = name
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .replace(/[\\/]/g, "_")
    .trim();

  return Array.from(sanitized).slice(0, 255).join("") || null;
}

export function getAllowedAttachmentMimeType(
  fileName: string,
  providedMimeType: string,
): string | null {
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const allowedMimeType = allowedMimeTypes[extension];
  if (!allowedMimeType) return null;

  const normalizedProvidedType = providedMimeType.trim().toLowerCase();
  if (
    normalizedProvidedType &&
    normalizedProvidedType !== allowedMimeType &&
    !(extension === ".csv" && normalizedProvidedType === "application/vnd.ms-excel")
  ) {
    return null;
  }

  return allowedMimeType;
}

function getStorageDirectory(): string {
  const configuredDirectory = process.env.CARD_ATTACHMENT_STORAGE_DIR;
  return configuredDirectory
    ? resolve(configuredDirectory)
    : join(process.cwd(), "storage", "card-attachments");
}

export function getAttachmentStoragePath(storageKey: string): string {
  if (!/^[0-9a-f-]{36}$/.test(storageKey)) {
    throw new Error("Invalid attachment storage key.");
  }
  return join(getStorageDirectory(), storageKey);
}

export async function saveCardAttachment(
  bytes: Uint8Array,
): Promise<string> {
  const storageKey = randomUUID();
  const directory = getStorageDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, storageKey), bytes, { flag: "wx" });
  return storageKey;
}

export async function removeCardAttachmentFile(
  storageKey: string,
): Promise<void> {
  await rm(getAttachmentStoragePath(storageKey), { force: true });
}
