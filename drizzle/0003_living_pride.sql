CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int,
	`eventName` enum('START_RECORD','RECORD_CREATED','SOURCE_ATTACHED','RECORD_ACTIVATED','RETURN') NOT NULL,
	`dedupeKey` varchar(190) NOT NULL,
	`metadata` text,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `analytics_events_dedupeKey_unique` UNIQUE(`dedupeKey`)
);
--> statement-breakpoint
CREATE TABLE `case_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('OWNER','COLLABORATOR') NOT NULL DEFAULT 'COLLABORATOR',
	`status` enum('ACTIVE','REVOKED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `case_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `case_members_case_user_idx` UNIQUE(`caseId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `citations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int NOT NULL,
	`targetType` enum('EVIDENCE_ROW','TIMELINE_EVENT','MOTION_DRAFT') NOT NULL,
	`targetId` int NOT NULL,
	`sourceRecordId` int,
	`excerptId` int,
	`relationship` enum('SUPPORTS','LIMITS','CONTRADICTS','CONTEXT') NOT NULL,
	`locator` varchar(255),
	`note` text,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `citations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int NOT NULL,
	`sourceRecordId` int,
	`itemId` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`kind` enum('DOCUMENT','IMAGE','AUDIO','VIDEO','COMMUNICATION','OTHER') NOT NULL,
	`state` enum('REFERENCE_ONLY','UPLOAD_RESERVED','READY','QUARANTINED') NOT NULL DEFAULT 'REFERENCE_ONLY',
	`sensitivity` enum('STANDARD','SENSITIVE','RESTRICTED') NOT NULL DEFAULT 'STANDARD',
	`externalReference` text,
	`storageKey` varchar(512),
	`contentType` varchar(255),
	`byteSize` int,
	`sha256` varchar(64),
	`provenanceNote` text NOT NULL,
	`safetyAcknowledgedAt` timestamp,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidence_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `evidence_items_owner_case_item_idx` UNIQUE(`userId`,`caseId`,`itemId`)
);
--> statement-breakpoint
CREATE TABLE `privacy_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int,
	`requestType` enum('CORRECTION','TAKEDOWN','ACCESS','DELETION','OTHER') NOT NULL,
	`status` enum('OPEN','IN_REVIEW','CLOSED') NOT NULL DEFAULT 'OPEN',
	`details` text NOT NULL,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `privacy_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revision_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int NOT NULL,
	`action` enum('CREATED','UPDATED','SOFT_DELETED','RESTORED','PRIVACY_REQUESTED') NOT NULL,
	`summary` varchar(500) NOT NULL,
	`changedFields` text,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revision_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `source_excerpts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int NOT NULL,
	`sourceRecordId` int,
	`evidenceItemId` int,
	`label` varchar(255) NOT NULL,
	`excerptText` text NOT NULL,
	`locator` varchar(255),
	`confidenceStatus` enum('PRIMARY-RECORD','USER-REPORTED','VERIFY','SOURCE-UNAVAILABLE','CONFLICTING') NOT NULL DEFAULT 'VERIFY',
	`isRedacted` boolean NOT NULL DEFAULT false,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `source_excerpts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `acquisition_items` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `chronology_events` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `evidence_rows` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `source_records` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `privacyNoticeVersion` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `privacyNoticeAcknowledgedAt` timestamp;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_case_fk` FOREIGN KEY (`caseId`) REFERENCES `legal_cases`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `case_members` ADD CONSTRAINT `case_members_case_fk` FOREIGN KEY (`caseId`) REFERENCES `legal_cases`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `case_members` ADD CONSTRAINT `case_members_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT IGNORE INTO `case_members` (`caseId`, `userId`, `role`, `status`) SELECT `id`, `userId`, 'OWNER', 'ACTIVE' FROM `legal_cases`;--> statement-breakpoint
ALTER TABLE `citations` ADD CONSTRAINT `citations_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `citations` ADD CONSTRAINT `citations_source_fk` FOREIGN KEY (`sourceRecordId`) REFERENCES `source_records`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `citations` ADD CONSTRAINT `citations_excerpt_fk` FOREIGN KEY (`excerptId`) REFERENCES `source_excerpts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence_items` ADD CONSTRAINT `evidence_items_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidence_items` ADD CONSTRAINT `evidence_items_source_fk` FOREIGN KEY (`sourceRecordId`) REFERENCES `source_records`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `privacy_requests` ADD CONSTRAINT `privacy_requests_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `privacy_requests` ADD CONSTRAINT `privacy_requests_case_fk` FOREIGN KEY (`caseId`) REFERENCES `legal_cases`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revision_events` ADD CONSTRAINT `revision_events_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revision_events` ADD CONSTRAINT `revision_events_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `source_excerpts` ADD CONSTRAINT `source_excerpts_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `source_excerpts` ADD CONSTRAINT `source_excerpts_source_fk` FOREIGN KEY (`sourceRecordId`) REFERENCES `source_records`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `source_excerpts` ADD CONSTRAINT `source_excerpts_evidence_item_fk` FOREIGN KEY (`evidenceItemId`) REFERENCES `evidence_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `analytics_events_event_occurred_idx` ON `analytics_events` (`eventName`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `case_members_user_idx` ON `case_members` (`userId`);--> statement-breakpoint
CREATE INDEX `citations_owner_case_target_idx` ON `citations` (`userId`,`caseId`,`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `evidence_items_owner_case_idx` ON `evidence_items` (`userId`,`caseId`);--> statement-breakpoint
CREATE INDEX `privacy_requests_user_status_idx` ON `privacy_requests` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `revision_events_owner_case_occurred_idx` ON `revision_events` (`userId`,`caseId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `source_excerpts_owner_case_idx` ON `source_excerpts` (`userId`,`caseId`);