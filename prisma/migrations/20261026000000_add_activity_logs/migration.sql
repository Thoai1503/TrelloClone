CREATE TABLE `activity_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `board_id` BIGINT NOT NULL,
  `card_id` BIGINT NULL,
  `actor_id` INT UNSIGNED NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `activity_logs_board_id_created_at_idx` (`board_id`, `created_at`),
  INDEX `activity_logs_card_id_created_at_idx` (`card_id`, `created_at`),
  INDEX `activity_logs_actor_id_created_at_idx` (`actor_id`, `created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_board_id_fkey`
  FOREIGN KEY (`board_id`) REFERENCES `board` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_card_id_fkey`
  FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_actor_id_fkey`
  FOREIGN KEY (`actor_id`) REFERENCES `user` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
