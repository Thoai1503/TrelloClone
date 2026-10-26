CREATE TABLE `attachments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `card_id` BIGINT NOT NULL,
    `uploaded_by` INTEGER UNSIGNED NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_url` VARCHAR(1000) NOT NULL,
    `mime_type` VARCHAR(150) NULL,
    `file_size` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attachments_card_id_idx`(`card_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `attachments`
    ADD CONSTRAINT `attachments_card_id_fkey`
    FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `attachments`
    ADD CONSTRAINT `attachments_uploaded_by_fkey`
    FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
