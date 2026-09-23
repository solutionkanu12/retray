CREATE TABLE `oauth_authorization_states` (
  `state_digest` text PRIMARY KEY NOT NULL,
  `nonce_digest` text NOT NULL,
  `intent` text NOT NULL,
  `account_type` text,
  `venue_name` text,
  `expires_at` text NOT NULL,
  `consumed_at` text,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `oauth_authorization_states_expiry_idx` ON `oauth_authorization_states` (`expires_at`);
--> statement-breakpoint
CREATE TABLE `oauth_identities` (
  `id` text PRIMARY KEY NOT NULL,
  `provider` text NOT NULL,
  `provider_subject` text NOT NULL,
  `user_id` text NOT NULL,
  `email` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_identities_provider_subject_unique` ON `oauth_identities` (`provider`,`provider_subject`);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_identities_provider_user_unique` ON `oauth_identities` (`provider`,`user_id`);
--> statement-breakpoint
CREATE INDEX `oauth_identities_user_idx` ON `oauth_identities` (`user_id`);
