CREATE TABLE `email_verification_tokens` (
	`token_digest` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`consumed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `email_verification_tokens_user_idx` ON `email_verification_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`token_digest` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`consumed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `payment_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`borrow_id` text NOT NULL,
	`consumer_user_id` text NOT NULL,
	`provider_reference` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`authorization_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`borrow_id`) REFERENCES `borrows`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`consumer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_attempts_provider_reference_unique` ON `payment_attempts` (`provider_reference`);--> statement-breakpoint
CREATE INDEX `payment_attempts_borrow_idx` ON `payment_attempts` (`borrow_id`);--> statement-breakpoint
CREATE TABLE `processed_webhook_events` (
	`event_digest` text PRIMARY KEY NOT NULL,
	`payment_attempt_id` text,
	`event_type` text NOT NULL,
	`processed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`payment_attempt_id`) REFERENCES `payment_attempts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `processed_webhook_events_payment_idx` ON `processed_webhook_events` (`payment_attempt_id`);--> statement-breakpoint
CREATE TABLE `rate_limit_windows` (
	`key_digest` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`window_started_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_attempt_id` text NOT NULL,
	`borrow_id` text NOT NULL,
	`provider_reference` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`payment_attempt_id`) REFERENCES `payment_attempts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`borrow_id`) REFERENCES `borrows`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refunds_payment_attempt_id_unique` ON `refunds` (`payment_attempt_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `refunds_provider_reference_unique` ON `refunds` (`provider_reference`);--> statement-breakpoint
CREATE INDEX `refunds_borrow_idx` ON `refunds` (`borrow_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified_at` text;