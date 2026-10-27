# Card attachments

New card attachments are uploaded server-side to Cloudinary as authenticated
assets. Images use Cloudinary's `image` resource type; other supported files use
`raw`. The database stores an internal Cloudinary reference in `file_url`, not a
public delivery URL. Downloads and inline image previews continue through the
authenticated `/api/attachments/[attachmentId]` route, which checks board
access before fetching the asset. Cloudinary API credentials must remain
server-side and be configured as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
and `CLOUDINARY_API_SECRET`.

Uploading and deleting an attachment writes a card activity entry. Upload
entries link to the file by its name; PDF and image links open inline when the
browser supports it. The attachment menu provides download and, to users
allowed to edit the card, delete actions. Deletion removes the database record,
writes an activity entry, and then cleans up the stored file.

Uploads are limited to 10 MB per file and support images (JPEG, PNG, GIF, WebP),
PDF, Microsoft Office documents, CSV, and TXT. New Cloudinary uploads use
random public IDs and authenticated delivery.

The upload request still passes through the application server. Deployments
with request-body limits lower than the configured 10 MB attachment limit may
reject large multipart uploads before the route runs; in that case, use a
signed direct-to-Cloudinary upload flow rather than increasing server limits.

Existing attachments whose `file_url` is a local storage key continue to be
read from `storage/card-attachments` during migration. On deployments where
that directory is ephemeral or unavailable, old local attachments may no
longer be retrievable; migrate any files that still exist before removing the
legacy local read path.
