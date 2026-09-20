CREATE TABLE `borrows` (
	`id` text PRIMARY KEY NOT NULL,
	`container_id` text NOT NULL,
	`consumer_user_id` text NOT NULL,
	`issued_by_user_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`deposit_minor` integer DEFAULT 0 NOT NULL,
	`deposit_currency` text DEFAULT 'EUR' NOT NULL,
	`deposit_status` text DEFAULT 'not_collected' NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`issued_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`returned_at` text,
	FOREIGN KEY (`container_id`) REFERENCES `containers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`consumer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`issued_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `borrows_one_active_per_container` ON `borrows` (`container_id`) WHERE "borrows"."status" = 'active';--> statement-breakpoint
CREATE INDEX `borrows_consumer_status_idx` ON `borrows` (`consumer_user_id`,`status`);--> statement-breakpoint
CREATE TABLE `circulation_events` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`container_id` text NOT NULL,
	`borrow_id` text,
	`actor_user_id` text NOT NULL,
	`event_type` text NOT NULL,
	`occurred_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`container_id`) REFERENCES `containers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`borrow_id`) REFERENCES `borrows`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `circulation_events_venue_time_idx` ON `circulation_events` (`venue_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `circulation_events_container_time_idx` ON `circulation_events` (`container_id`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `containers` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`label` text NOT NULL,
	`qr_id` text NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`venue_id`) REFERENCES `venues`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `containers_qr_id_unique` ON `containers` (`qr_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `containers_venue_label_unique` ON `containers` (`venue_id`,`label`);--> statement-breakpoint
CREATE INDEX `containers_venue_status_idx` ON `containers` (`venue_id`,`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`account_type` text,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `venues` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `venues_owner_idx` ON `venues` (`owner_user_id`);
--> statement-breakpoint
CREATE TRIGGER `circulation_events_no_update`
BEFORE UPDATE ON `circulation_events`
BEGIN
	SELECT RAISE(ABORT, 'circulation events are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER `circulation_events_no_delete`
BEFORE DELETE ON `circulation_events`
BEGIN
	SELECT RAISE(ABORT, 'circulation events are immutable');
END;
--> statement-breakpoint
INSERT INTO `users` (`id`, `email`, `display_name`, `account_type`, `is_demo`)
VALUES
	('local_seedy', 'seedy@sites.test', 'Jordan Kim', 'business_operator', true),
	('demo_maya', 'maya.demo@retray.local', 'Maya L.', 'consumer', true);
--> statement-breakpoint
INSERT INTO `venues` (`id`, `owner_user_id`, `name`, `is_demo`)
VALUES ('demo_kora_kitchen', 'local_seedy', 'Kora Kitchen', true);
--> statement-breakpoint
INSERT INTO `containers` (`id`, `venue_id`, `label`, `qr_id`, `status`, `is_demo`)
VALUES (
	'demo_rt_024',
	'demo_kora_kitchen',
	'RT-024',
	'RT024DEMO001',
	'borrowed',
	true
);
--> statement-breakpoint
INSERT INTO `borrows` (
	`id`,
	`container_id`,
	`consumer_user_id`,
	`issued_by_user_id`,
	`status`,
	`deposit_minor`,
	`deposit_currency`,
	`deposit_status`,
	`is_demo`
)
VALUES (
	'demo_borrow_rt_024',
	'demo_rt_024',
	'demo_maya',
	'local_seedy',
	'active',
	300,
	'EUR',
	'not_collected',
	true
);
--> statement-breakpoint
INSERT INTO `circulation_events` (
	`id`,
	`venue_id`,
	`container_id`,
	`borrow_id`,
	`actor_user_id`,
	`event_type`
)
VALUES (
	'demo_event_rt_024_issued',
	'demo_kora_kitchen',
	'demo_rt_024',
	'demo_borrow_rt_024',
	'local_seedy',
	'issued'
);
