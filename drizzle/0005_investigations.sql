CREATE TABLE `investigations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `caseId` int NOT NULL,
  `userId` int NOT NULL,
  `question` text NOT NULL,
  `status` enum('QUEUED','ANALYZING','COMPLETED','FAILED') NOT NULL DEFAULT 'QUEUED',
  `requestedBy` int NOT NULL,
  `retrievedEvidenceIds` text NOT NULL,
  `model` varchar(160),
  `resultJson` text,
  `validationStatus` enum('VALID','UNKNOWN','CONTRADICTION','FAILED'),
  `errorMessage` text,
  `completedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `investigations_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases` (`userId`,`id`) ON DELETE CASCADE,
  CONSTRAINT `investigations_requester_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
CREATE INDEX `investigations_owner_case_idx` ON `investigations` (`userId`,`caseId`,`createdAt`);

-- Apply this migration with the deployment's normal Drizzle migration process.
-- DATABASE_URL is intentionally not embedded in source control.
