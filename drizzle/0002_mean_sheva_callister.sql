CREATE TABLE `source_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int NOT NULL,
	`sourceId` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`recordType` varchar(120) NOT NULL,
	`origin` varchar(255) NOT NULL,
	`location` text NOT NULL,
	`documentDate` varchar(160),
	`provenanceNote` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `source_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `source_records_owner_case_source_idx` UNIQUE(`userId`,`caseId`,`sourceId`)
);
--> statement-breakpoint
ALTER TABLE `legal_cases` ADD CONSTRAINT `legal_cases_owner_id_idx` UNIQUE(`userId`,`id`);--> statement-breakpoint
ALTER TABLE `source_records` ADD CONSTRAINT `source_records_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `source_records_owner_case_idx` ON `source_records` (`userId`,`caseId`);--> statement-breakpoint
ALTER TABLE `acquisition_items` ADD CONSTRAINT `acquisition_items_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chronology_events` ADD CONSTRAINT `chronology_events_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence_rows` ADD CONSTRAINT `evidence_rows_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `legal_cases` ADD CONSTRAINT `legal_cases_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `motion_drafts` ADD CONSTRAINT `motion_drafts_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_entitlements` ADD CONSTRAINT `subscription_entitlements_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;