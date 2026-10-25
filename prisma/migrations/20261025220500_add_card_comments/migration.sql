CREATE TABLE `comments` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `card_id` BIGINT NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `comments_card_id_created_at_idx` (`card_id`, `created_at`),
  INDEX `comments_user_id_idx` (`user_id`),
  CONSTRAINT `comments_card_id_fkey`
    FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
