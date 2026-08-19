CREATE TABLE `acquisition_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`priority` enum('Critical','High','Medium','Low') NOT NULL,
	`primaryRecordNeeded` text NOT NULL,
	`purpose` text NOT NULL,
	`sourceIds` text NOT NULL,
	`nextAction` text NOT NULL,
	`status` enum('OPEN','REQUESTED','RECEIVED','CLOSED') NOT NULL DEFAULT 'OPEN',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `acquisition_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chronology_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int NOT NULL,
	`dateText` varchar(160) NOT NULL,
	`sortDate` timestamp,
	`eventDescription` text NOT NULL,
	`sourceIds` text NOT NULL,
	`confidenceStatus` enum('PRIMARY-RECORD','USER-REPORTED','VERIFY','SOURCE-UNAVAILABLE','CONFLICTING') NOT NULL,
	`validationRecordNeeded` text NOT NULL,
	`nextAction` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chronology_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence_rows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int NOT NULL,
	`proposition` text NOT NULL,
	`confidenceStatus` enum('PRIMARY-RECORD','USER-REPORTED','VERIFY','SOURCE-UNAVAILABLE','CONFLICTING') NOT NULL,
	`sourceIds` text NOT NULL,
	`supportingMaterial` text NOT NULL,
	`adverseMaterial` text NOT NULL,
	`primaryRecordNeeded` text NOT NULL,
	`nextAction` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidence_rows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `legal_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseNumber` varchar(160) NOT NULL,
	`court` varchar(255) NOT NULL,
	`caption` text NOT NULL,
	`partyRole` varchar(160) NOT NULL,
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `legal_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `legal_cases_owner_case_idx` UNIQUE(`userId`,`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `motion_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int NOT NULL,
	`motionType` varchar(255) NOT NULL,
	`requestedRelief` text NOT NULL,
	`selectedEvidenceIds` text NOT NULL,
	`sourceTable` text NOT NULL,
	`unresolvedWarnings` text NOT NULL,
	`authorityPlaceholders` text NOT NULL,
	`bodyMarkdown` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `motion_drafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`status` enum('inactive','active','past_due','canceled') NOT NULL DEFAULT 'inactive',
	`currentPeriodEnd` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_entitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_entitlements_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `subscription_entitlement_subscription_idx` UNIQUE(`stripeSubscriptionId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
CREATE INDEX `acquisition_items_owner_case_idx` ON `acquisition_items` (`userId`,`caseId`);--> statement-breakpoint
CREATE INDEX `chronology_events_owner_case_idx` ON `chronology_events` (`userId`,`caseId`);--> statement-breakpoint
CREATE INDEX `evidence_rows_owner_case_idx` ON `evidence_rows` (`userId`,`caseId`);--> statement-breakpoint
CREATE INDEX `legal_cases_owner_idx` ON `legal_cases` (`userId`);--> statement-breakpoint
CREATE INDEX `motion_drafts_owner_case_idx` ON `motion_drafts` (`userId`,`caseId`);