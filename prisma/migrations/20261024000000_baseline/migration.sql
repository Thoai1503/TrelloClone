CREATE TABLE `user` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NULL,
  `password_hash` VARCHAR(255) NULL,
  `full_name` VARCHAR(255) NULL,
  `avatar_url` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `workspace` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `created_by` BIGINT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NULL,
  `archived_at` DATETIME(3) NULL,
  INDEX `workspace_created_by_idx` (`created_by`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `workspace_member` (
  `workspace_id` BIGINT NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
  `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `workspace_member_user_id_idx` (`user_id`),
  PRIMARY KEY (`workspace_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `board` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT NOT NULL,
  `created_by` BIGINT NOT NULL,
  `background_color` CHAR(7) NOT NULL DEFAULT '#0c66e4',
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NULL,
  `archived_at` DATETIME(3) NULL,
  INDEX `board_workspace_id_archived_at_idx` (`workspace_id`, `archived_at`),
  INDEX `board_created_by_idx` (`created_by`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `board_members` (
  `board_id` BIGINT NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role` ENUM('ADMIN', 'EDITOR', 'VIEWER') NOT NULL DEFAULT 'EDITOR',
  `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `board_members_user_id_idx` (`user_id`),
  PRIMARY KEY (`board_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lists` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `board_id` BIGINT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `position` DECIMAL(20, 6) NOT NULL DEFAULT 1000,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NULL,
  `archived_at` DATETIME(3) NULL,
  INDEX `lists_board_id_position_idx` (`board_id`, `position`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `cards` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `list_id` BIGINT NOT NULL,
  `created_by` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `position` DECIMAL(20, 6) NOT NULL DEFAULT 1000,
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
  `due_date` DATETIME(3) NULL,
  `completed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NULL,
  `archived_at` DATETIME(3) NULL,
  INDEX `cards_list_id_position_idx` (`list_id`, `position`),
  INDEX `cards_created_by_idx` (`created_by`),
  INDEX `cards_due_date_idx` (`due_date`),
  INDEX `cards_updated_at_idx` (`updated_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `card_members` (
  `card_id` BIGINT NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `card_members_user_id_idx` (`user_id`),
  PRIMARY KEY (`card_id`, `user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `workspace_member`
  ADD CONSTRAINT `workspace_member_workspace_id_fkey`
  FOREIGN KEY (`workspace_id`) REFERENCES `workspace` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `workspace_member`
  ADD CONSTRAINT `workspace_member_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `board`
  ADD CONSTRAINT `board_workspace_id_fkey`
  FOREIGN KEY (`workspace_id`) REFERENCES `workspace` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `board_members`
  ADD CONSTRAINT `board_members_board_id_fkey`
  FOREIGN KEY (`board_id`) REFERENCES `board` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `board_members`
  ADD CONSTRAINT `board_members_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lists`
  ADD CONSTRAINT `lists_board_id_fkey`
  FOREIGN KEY (`board_id`) REFERENCES `board` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `cards`
  ADD CONSTRAINT `cards_list_id_fkey`
  FOREIGN KEY (`list_id`) REFERENCES `lists` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `cards`
  ADD CONSTRAINT `cards_created_by_fkey`
  FOREIGN KEY (`created_by`) REFERENCES `user` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `card_members`
  ADD CONSTRAINT `card_members_card_id_fkey`
  FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `card_members`
  ADD CONSTRAINT `card_members_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
