import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";

import {
  getCloudinaryAttachmentReference,
  removeCardAttachmentFromCloudinary,
  readCardAttachmentFromCloudinary,
} from "@/lib/cloudinary-attachment-storage";
import {
  getAttachmentStoragePath,
  removeCardAttachmentFile,
} from "@/lib/card-attachment-storage";
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
    (attachment.mime_type?.startsWith("image/") === true ||
      attachment.mime_type === "application/pdf");

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

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }

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
              { board_members: { some: { user_id: userId, role: { not: "VIEWER" } } } },
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
      id: true,
      file_name: true,
      file_url: true,
      card: {
        select: {
          id: true,
          title: true,
          list: { select: { board: { select: { id: true } } } },
        },
      },
    },
  });
  if (!attachment) {
    return NextResponse.json(
      { error: "Không tìm thấy tệp hoặc bạn không có quyền xóa." },
      { status: 404 },
    );
  }

  const result = await prisma.$transaction(async (transaction) => {
    await transaction.attachment.delete({ where: { id: attachment.id } });
    const activity = await transaction.activity_log.create({
      data: {
        board_id: attachment.card.list.board.id,
        card_id: attachment.card.id,
        actor_id: userId,
        action: "card_attachment_deleted",
        metadata: {
          cardTitle: attachment.card.title,
          attachmentName: attachment.file_name,
        },
      },
      select: { id: true, created_at: true },
    });
    return activity;
  });

  try {
    if (getCloudinaryAttachmentReference(attachment.file_url)) {
      await removeCardAttachmentFromCloudinary(attachment.file_url);
    } else {
      await removeCardAttachmentFile(attachment.file_url);
    }
  } catch (cause: unknown) {
    console.error("Attachment row was deleted, but its stored file could not be removed.", cause);
    return NextResponse.json(
      {
        deleted: true,
        error: "Tệp đã bị xóa khỏi thẻ nhưng chưa thể dọn khỏi nơi lưu trữ.",
        activity: {
          kind: "activity",
          id: result.id.toString(),
          action: "card_attachment_deleted",
          created_at: result.created_at.toISOString(),
          actor: {
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.full_name,
            avatar_url: currentUser.avatar_url,
          },
          cardTitle: attachment.card.title,
          fromListName: null,
          toListName: null,
          fromStartDate: null,
          toStartDate: null,
          fromEndDate: null,
          toEndDate: null,
          memberName: null,
          attachmentName: attachment.file_name,
          attachmentDownloadUrl: null,
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    deleted: true,
    activity: {
      kind: "activity",
      id: result.id.toString(),
      action: "card_attachment_deleted",
      created_at: result.created_at.toISOString(),
      actor: {
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url,
      },
      cardTitle: attachment.card.title,
      fromListName: null,
      toListName: null,
      fromStartDate: null,
      toStartDate: null,
      fromEndDate: null,
      toEndDate: null,
      memberName: null,
      attachmentName: attachment.file_name,
      attachmentDownloadUrl: null,
    },
  });
}
