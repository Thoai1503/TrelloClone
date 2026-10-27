import "server-only";

import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";

type CloudinaryResourceType = "image" | "raw";
type CloudinaryAttachmentReference = {
  publicId: string;
  resourceType: CloudinaryResourceType;
};

const storagePrefix = "cloudinary:";
const folder = "card-attachments";

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function uploadBuffer(
  bytes: Uint8Array,
  publicId: string,
  resourceType: CloudinaryAttachmentReference["resourceType"],
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        type: "authenticated",
        overwrite: false,
        unique_filename: false,
        use_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary upload returned no asset information."));
          return;
        }
        resolve(result);
      },
    );
    stream.end(Buffer.from(bytes));
  });
}

export async function saveCardAttachmentToCloudinary(
  bytes: Uint8Array,
  fileName: string,
  mimeType: string,
): Promise<string> {
  configureCloudinary();

  const resourceType = mimeType.startsWith("image/") ? "image" : "raw";
  const extension = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const publicId =
    resourceType === "raw" ? `${randomUUID()}${extension}` : randomUUID();
  const result = await uploadBuffer(bytes, publicId, resourceType);

  return `${storagePrefix}${resourceType}:${result.public_id}`;
}

export function getCloudinaryAttachmentReference(
  storageKey: string,
): CloudinaryAttachmentReference | null {
  if (!storageKey.startsWith(storagePrefix)) return null;

  const match = /^cloudinary:(image|raw):([A-Za-z0-9_./-]+)$/.exec(storageKey);
  if (!match) {
    throw new Error("Invalid Cloudinary attachment storage reference.");
  }

  return {
    resourceType: match[1] === "image" ? "image" : "raw",
    publicId: match[2],
  };
}

export async function readCardAttachmentFromCloudinary(
  reference: CloudinaryAttachmentReference,
): Promise<Buffer> {
  configureCloudinary();
  const signedUrl = cloudinary.url(reference.publicId, {
    resource_type: reference.resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
  });
  const response = await fetch(signedUrl, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(
      `Cloudinary attachment delivery failed with status ${response.status}.`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function removeCardAttachmentFromCloudinary(
  storageKey: string,
): Promise<void> {
  const reference = getCloudinaryAttachmentReference(storageKey);
  if (!reference) {
    throw new Error("Invalid Cloudinary attachment storage reference.");
  }

  configureCloudinary();
  const result = await cloudinary.uploader.destroy(reference.publicId, {
    resource_type: reference.resourceType,
    type: "authenticated",
    invalidate: true,
  });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(`Cloudinary attachment deletion failed: ${result.result}.`);
  }
}
