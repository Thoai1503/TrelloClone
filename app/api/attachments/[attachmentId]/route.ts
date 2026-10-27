import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";

import {
  getCloudinaryAttachmentReference,
  readCardAttachmentFromCloudinary,
} from "@/lib/cloudinary-attachment-storage";
import { getAttachmentStoragePath } from "@/lib/card-attachment-storage";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/utils/auth-session";

type RouteContext = {
  params: Promise<{ attachmentId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const { attachmentId: attachmentIdInput } = await context.params;
  if (!/^\d{1,19}$/.test(attachmentIdInput)) {
    return NextResponse.json({ error: "Không tìm thấy tệp." }, { status: 404 });
  }

  const userId = currentUser.id;
  const currentUserId = BigInt(userId);
  const attachment = await prisma.attachment.findFirst({
    where: {
      id: BigInt(attachmentIdInput),
      card: {
        archived_at: null,
        list: {
          archived_at: null,
          board: {
            archived_at: null,
            workspace: { archived_at: null },
            OR: [
              { created_by: currentUserId },
              { board_members: { some: { user_id: userId } } },
              {
                workspace: {
                  OR: [
                    { created_by: currentUserId },
                    { members: { some: { user_id: userId } } },
                  ],
                },
              },
            ],
          },
        },
      },
    },
    select: {
      file_name: true,
      file_url: true,
      mime_type: true,
    },
  });
  if (!attachment) {
    return NextResponse.json({ error: "Không tìm thấy tệp." }, { status: 404 });
  }

  const cloudinaryReference = getCloudinaryAttachmentReference(attachment.file_url);
  let file: Buffer;
  if (cloudinaryReference) {
    file = await readCardAttachmentFromCloudinary(cloudinaryReference);
  } else {
    try {
      file = await readFile(getAttachmentStoragePath(attachment.file_url));
    } catch (cause: unknown) {
      if (
        typeof cause === "object" &&
        cause !== null &&
        "code" in cause &&
        cause.code === "ENOENT"
      ) {
        return NextResponse.json(
          { error: "Tệp không còn trên máy chủ." },
          { status: 404 },
        );
      }
      throw cause;
    }
  }

  const isInlineImage =
    request.nextUrl.searchParams.get("inline") === "1" &&
    attachment.mime_type?.startsWith("image/") === true;

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": attachment.mime_type ?? "application/octet-stream",
      "Content-Disposition": `${isInlineImage ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.file_name)}`,
      "Content-Length": String(file.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
