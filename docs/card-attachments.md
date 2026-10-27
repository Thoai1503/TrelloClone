# Card attachments

Card attachments are stored outside `public/` and served only through an
authenticated download route. Uploads are limited to 10 MB per file and support
images (JPEG, PNG, GIF, WebP), PDF, Microsoft Office documents, CSV, and TXT.

The default storage directory is `storage/card-attachments` in the application
working directory. Set `CARD_ATTACHMENT_STORAGE_DIR` to an absolute path on a
persistent volume when deploying, then ensure the application process can read
and write that directory. The volume must remain mounted across deployments and
be shared by every application instance that handles uploads and downloads.
