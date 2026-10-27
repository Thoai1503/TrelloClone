import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  removeCardAttachmentFromCloudinary,
  saveCardAttachmentToCloudinary,
} from "@/lib/cloudinary-attachment-storage";
import {
  getAllowedAttachmentMimeType,
  MAX_CARD_ATTACHMENT_SIZE,
  sanitizeAttachmentName,
} from "@/lib/card-attachment-storage";
import { getCurrentUser } from "@/utils/auth-session";
import { decryptBoardId } from "@/utils/resource-id";

type RouteContext = {
  params: Promise<{ cardId: string }>;
};

function isSameOriginRequest(request: NextRequest): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_CARD_ATTACHMENT_SIZE + 64 * 1024
  ) {
    return NextResponse.json(
      { error: "Tệp vượt quá giới hạn 10 MB." },
      { status: 413 },
    );
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Không đọc được tệp tải lên." },
      { status: 400 },
    );
  }

  const { cardId: cardIdInput } = await context.params;
  const boardToken = formData.get("boardToken");
  const file = formData.get("file");
  if (
    !/^\d{1,19}$/.test(cardIdInput) ||
    typeof boardToken !== "string" ||
    !file ||
    typeof file === "string" ||
    typeof File === "undefined" ||
    !(file instanceof File)
  ) {
    return NextResponse.json(
      { error: "Thông tin tệp hoặc thẻ không hợp lệ." },
      { status: 400 },
    );
  }

  const boardId = decryptBoardId(boardToken);
  if (boardId === null) {
    return NextResponse.json({ error: "Không tìm thấy bảng." }, { status: 404 });
  }

  const cardId = BigInt(cardIdInput);
  const userId = currentUser.id;
  const currentUserId = BigInt(userId);
  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      archived_at: null,
      list: {
        archived_at: null,
        board: {
          id: boardId,
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
    select: {
      id: true,
      title: true,
      list: { select: { board: { select: { id: true } } } },
    },
  });
  if (!card) {
    return NextResponse.json(
      { error: "Thẻ không tồn tại hoặc bạn không có quyền đính kèm tệp." },
      { status: 404 },
    );
  }

  if (file.size < 1 || file.size > MAX_CARD_ATTACHMENT_SIZE) {
    return NextResponse.json(
      { error: "Tệp phải có dung lượng từ 1 byte đến 10 MB." },
      { status: 413 },
    );
  }

  const fileName = sanitizeAttachmentName(file.name);
  if (!fileName) {
    return NextResponse.json({ error: "Tên tệp không hợp lệ." }, { status: 400 });
  }
  const mimeType = getAllowedAttachmentMimeType(fileName, file.type);
  if (!mimeType) {
    return NextResponse.json(
      {
        error:
          "Định dạng chưa được hỗ trợ. Chọn ảnh, PDF, tài liệu Office, CSV hoặc TXT.",
      },
      { status: 415 },
    );
  }

  const storageKey = await saveCardAttachmentToCloudinary(
    new Uint8Array(await file.arrayBuffer()),
    fileName,
    mimeType,
  );
  let result;
  try {
    result = await prisma.$transaction(async (transaction) => {
      const attachment = await transaction.attachment.create({
        data: {
          card_id: card.id,
          uploaded_by: userId,
          file_name: fileName,
          file_url: storageKey,
          mime_type: mimeType,
          file_size: BigInt(file.size),
        },
        select: {
          id: true,
          file_name: true,
          mime_type: true,
          file_size: true,
          created_at: true,
        },
      });
      const activity = await transaction.activity_log.create({
        data: {
          board_id: card.list.board.id,
          card_id: card.id,
          actor_id: userId,
          action: "card_attachment_uploaded",
          metadata: {
            cardTitle: card.title,
            attachmentName: fileName,
            attachmentDownloadUrl: `/api/attachments/${attachment.id.toString()}`,
          },
        },
        select: { id: true, created_at: true },
      });

      return { attachment, activity };
    });
  } catch (cause: unknown) {
    try {
      await removeCardAttachmentFromCloudinary(storageKey);
    } catch (cleanupCause: unknown) {
      console.error("Failed to remove orphaned Cloudinary attachment.", cleanupCause);
    }
    throw cause;
  }

  return NextResponse.json(
    {
      attachment: {
        id: result.attachment.id.toString(),
        file_name: result.attachment.file_name,
        mime_type: result.attachment.mime_type,
        file_size: result.attachment.file_size?.toString() ?? null,
        created_at: result.attachment.created_at.toISOString(),
        download_url: `/api/attachments/${result.attachment.id.toString()}`,
      },
      activity: {
        kind: "activity",
        id: result.activity.id.toString(),
        action: "card_attachment_uploaded",
        created_at: result.activity.created_at.toISOString(),
        actor: {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.full_name,
          avatar_url: currentUser.avatar_url,
        },
        cardTitle: card.title,
        fromListName: null,
        toListName: null,
        fromStartDate: null,
        toStartDate: null,
        fromEndDate: null,
        toEndDate: null,
        memberName: null,
        attachmentName: fileName,
        attachmentDownloadUrl: `/api/attachments/${result.attachment.id.toString()}`,
      },
    },
    { status: 201 },
  );
}
