import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const TOKEN_VERSION = 1;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const configuredKey = process.env.WORKSPACE_ID_ENCRYPTION_KEY;

  if (!configuredKey || !/^[\da-fA-F]{64}$/.test(configuredKey)) {
    throw new Error(
      "WORKSPACE_ID_ENCRYPTION_KEY must be configured as a 64-character hexadecimal value."
    );
  }

  return createHash("sha256").update(Buffer.from(configuredKey, "hex")).digest();
}

export function encryptWorkspaceId(workspaceId: bigint | string): string {
  const id = workspaceId.toString();
  if (!/^[1-9]\d*$/.test(id)) {
    throw new Error("Workspace ID must be a positive integer.");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(id, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([Buffer.from([TOKEN_VERSION]), iv, authTag, ciphertext]).toString(
    "base64url"
  );
}

export function decryptWorkspaceId(token: string): bigint | null {
  const key = getEncryptionKey();
  if (!/^[A-Za-z0-9_-]+$/.test(token)) {
    return null;
  }

  const payload = Buffer.from(token, "base64url");
  if (
    payload.length <= 1 + IV_LENGTH + AUTH_TAG_LENGTH ||
    payload[0] !== TOKEN_VERSION
  ) {
    return null;
  }

  const iv = payload.subarray(1, 1 + IV_LENGTH);
  const authTag = payload.subarray(1 + IV_LENGTH, 1 + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = payload.subarray(1 + IV_LENGTH + AUTH_TAG_LENGTH);

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const id = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    return /^[1-9]\d*$/.test(id) ? BigInt(id) : null;
  } catch {
    return null;
  }
}

export function encryptBoardId(boardId: bigint | string): string {
  return encryptWorkspaceId(boardId);
}

export function decryptBoardId(token: string): bigint | null {
  return decryptWorkspaceId(token);
}
