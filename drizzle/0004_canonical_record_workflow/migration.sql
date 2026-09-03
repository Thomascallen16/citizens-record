CREATE TABLE `record_metadata` (
  `id` int AUTO_INCREMENT NOT NULL,
  `caseId` int NOT NULL,
  `userId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `originalQuestion` text NOT NULL,
  `status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `visibility` enum('PRIVATE') NOT NULL DEFAULT 'PRIVATE',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `record_metadata_case_unique` UNIQUE(`caseId`),
  CONSTRAINT `record_metadata_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE CASCADE
);
CREATE INDEX `record_metadata_owner_idx` ON `record_metadata` (`userId`);

CREATE TABLE `canonical_source_metadata` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sourceRecordId` int NOT NULL,
  `caseId` int NOT NULL,
  `userId` int NOT NULL,
  `retrievalAt` timestamp,
  `designation` enum('PRIMARY','SECONDARY','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `citationText` text NOT NULL,
  `notes` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `canonical_source_metadata_source_unique` UNIQUE(`sourceRecordId`),
  CONSTRAINT `canonical_source_metadata_source_fk` FOREIGN KEY (`sourceRecordId`) REFERENCES `source_records`(`id`) ON DELETE CASCADE,
  CONSTRAINT `canonical_source_metadata_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE CASCADE
);
CREATE INDEX `canonical_source_metadata_owner_case_idx` ON `canonical_source_metadata` (`userId`,`caseId`);

CREATE TABLE `canonical_evidence_metadata` (
  `id` int AUTO_INCREMENT NOT NULL,
  `evidenceId` int NOT NULL,
  `caseId` int NOT NULL,
  `userId` int NOT NULL,
  `notes` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `canonical_evidence_metadata_evidence_unique` UNIQUE(`evidenceId`),
  CONSTRAINT `canonical_evidence_metadata_evidence_fk` FOREIGN KEY (`evidenceId`) REFERENCES `source_excerpts`(`id`) ON DELETE CASCADE,
  CONSTRAINT `canonical_evidence_metadata_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE CASCADE
);
CREATE INDEX `canonical_evidence_metadata_owner_case_idx` ON `canonical_evidence_metadata` (`userId`,`caseId`);

CREATE TABLE `canonical_claims` (
  `id` int AUTO_INCREMENT NOT NULL,
  `caseId` int NOT NULL,
  `userId` int NOT NULL,
  `claimText` text NOT NULL,
  `claimant` varchar(255),
  `claimDate` varchar(160),
  `claimType` varchar(120) NOT NULL,
  `epistemicCategory` enum('FACT','AUTHORITY','CLAIM','INFERENCE','CONTRADICTION','QUESTION','UNKNOWN') NOT NULL DEFAULT 'CLAIM',
  `notes` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `canonical_claims_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE CASCADE
);
CREATE INDEX `canonical_claims_owner_case_idx` ON `canonical_claims` (`userId`,`caseId`);

CREATE TABLE `canonical_findings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `caseId` int NOT NULL,
  `userId` int NOT NULL,
  `findingText` text NOT NULL,
  `epistemicCategory` enum('FACT','AUTHORITY','CLAIM','INFERENCE','CONTRADICTION','QUESTION','UNKNOWN') NOT NULL,
  `rationale` text NOT NULL,
  `confidenceExplanation` text NOT NULL,
  `alternativeExplanation` text NOT NULL,
  `missingEvidence` text NOT NULL,
  `whatWouldChangeConclusion` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `canonical_findings_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE CASCADE
);
CREATE INDEX `canonical_findings_owner_case_idx` ON `canonical_findings` (`userId`,`caseId`);

CREATE TABLE `canonical_unknowns` (
  `id` int AUTO_INCREMENT NOT NULL,
  `caseId` int NOT NULL,
  `userId` int NOT NULL,
  `description` text NOT NULL,
  `whyItMatters` text NOT NULL,
  `relatedClaimId` int,
  `relatedFindingId` int,
  `relatedSourceRecordId` int,
  `relatedChronologyEventId` int,
  `status` enum('OPEN','PARTIALLY_RESOLVED','RESOLVED') NOT NULL DEFAULT 'OPEN',
  `resolutionNotes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `canonical_unknowns_owner_case_fk` FOREIGN KEY (`userId`,`caseId`) REFERENCES `legal_cases`(`userId`,`id`) ON DELETE CASCADE
);
CREATE INDEX `canonical_unknowns_owner_case_idx` ON `canonical_unknowns` (`userId`,`caseId`);

CREATE TABLE `claim_evidence_links` (
  `id` int AUTO_INCREMENT NOT NULL,
  `claimId` int NOT NULL,
  `evidenceId` int NOT NULL,
  `relationship` enum('SUPPORTING','CONTRARY') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `claim_evidence_links_unique` UNIQUE(`claimId`,`evidenceId`,`relationship`),
  CONSTRAINT `claim_evidence_links_claim_fk` FOREIGN KEY (`claimId`) REFERENCES `canonical_claims`(`id`) ON DELETE CASCADE,
  CONSTRAINT `claim_evidence_links_evidence_fk` FOREIGN KEY (`evidenceId`) REFERENCES `source_excerpts`(`id`) ON DELETE CASCADE
);

CREATE TABLE `claim_source_links` (
  `id` int AUTO_INCREMENT NOT NULL,
  `claimId` int NOT NULL,
  `sourceRecordId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `claim_source_links_unique` UNIQUE(`claimId`,`sourceRecordId`),
  CONSTRAINT `claim_source_links_claim_fk` FOREIGN KEY (`claimId`) REFERENCES `canonical_claims`(`id`) ON DELETE CASCADE,
  CONSTRAINT `claim_source_links_source_fk` FOREIGN KEY (`sourceRecordId`) REFERENCES `source_records`(`id`) ON DELETE CASCADE
);

CREATE TABLE `finding_evidence_links` (
  `id` int AUTO_INCREMENT NOT NULL,
  `findingId` int NOT NULL,
  `evidenceId` int NOT NULL,
  `relationship` enum('SUPPORTING','CONTRARY') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `finding_evidence_links_unique` UNIQUE(`findingId`,`evidenceId`,`relationship`),
  CONSTRAINT `finding_evidence_links_finding_fk` FOREIGN KEY (`findingId`) REFERENCES `canonical_findings`(`id`) ON DELETE CASCADE,
  CONSTRAINT `finding_evidence_links_evidence_fk` FOREIGN KEY (`evidenceId`) REFERENCES `source_excerpts`(`id`) ON DELETE CASCADE
);

CREATE TABLE `finding_claim_links` (
  `id` int AUTO_INCREMENT NOT NULL,
  `findingId` int NOT NULL,
  `claimId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `finding_claim_links_unique` UNIQUE(`findingId`,`claimId`),
  CONSTRAINT `finding_claim_links_finding_fk` FOREIGN KEY (`findingId`) REFERENCES `canonical_findings`(`id`) ON DELETE CASCADE,
  CONSTRAINT `finding_claim_links_claim_fk` FOREIGN KEY (`claimId`) REFERENCES `canonical_claims`(`id`) ON DELETE CASCADE
);
