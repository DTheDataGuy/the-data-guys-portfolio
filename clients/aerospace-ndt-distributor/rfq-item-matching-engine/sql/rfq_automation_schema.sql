/*
Distributor RFQ Automation - SQL Schema Recommendation
Target: SQL Server / SQL Server Express
Purpose: Support RFQ archive, attachments, matcher output, audit trail, and configurable matcher rules.

Notes:
- The quote_* prefix keeps RFQ automation tables separate from the existing IMS catalog/domain.
- The archive tables preserve what arrived.
- The matches table preserves how the system interpreted each RFQ line item.
- Configuration tables allow the operations lead to tune matching behavior without code deployments.
- Adjust dbo schema/name conventions to match Distributor IMS standards if needed.
*/

------------------------------------------------------------
-- 1. CONFIGURATION TABLES
------------------------------------------------------------

CREATE TABLE dbo.quote_cross_references (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_cross_references PRIMARY KEY,
    CompetitorName NVARCHAR(100) NULL,
    CompetitorPartNumber NVARCHAR(100) NOT NULL,
    CompetitorPartNumberNormalized NVARCHAR(100) NOT NULL,
    DistributorPartNumber NVARCHAR(100) NOT NULL,
    DistributorItemId INT NULL,
    ConfidenceLevel NVARCHAR(30) NOT NULL CONSTRAINT DF_quote_cross_references_Confidence DEFAULT ('High'),
    Notes NVARCHAR(1000) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_quote_cross_references_IsActive DEFAULT (1),
    CreatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_quote_cross_references_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CreatedBy NVARCHAR(100) NULL,
    UpdatedAtUtc DATETIME2(0) NULL,
    UpdatedBy NVARCHAR(100) NULL
);

CREATE UNIQUE INDEX UX_quote_cross_references_CompetitorPartNumberNormalized
ON dbo.quote_cross_references (CompetitorPartNumberNormalized)
WHERE IsActive = 1;

CREATE INDEX IX_quote_cross_references_DistributorPartNumber
ON dbo.quote_cross_references (DistributorPartNumber);

CREATE TABLE dbo.quote_extraction_noise_terms (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_extraction_noise_terms PRIMARY KEY,
    Term NVARCHAR(100) NOT NULL,
    TermNormalized NVARCHAR(100) NOT NULL,
    Category NVARCHAR(50) NULL,
    Notes NVARCHAR(500) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_quote_noise_IsActive DEFAULT (1),
    CreatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_quote_noise_CreatedAt DEFAULT (SYSUTCDATETIME())
);

CREATE UNIQUE INDEX UX_quote_noise_TermNormalized
ON dbo.quote_extraction_noise_terms (TermNormalized)
WHERE IsActive = 1;

CREATE TABLE dbo.quote_extraction_junk_patterns (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_extraction_junk_patterns PRIMARY KEY,
    RegexPattern NVARCHAR(500) NOT NULL,
    Description NVARCHAR(500) NULL,
    ExampleToken NVARCHAR(100) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_quote_junk_IsActive DEFAULT (1),
    CreatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_quote_junk_CreatedAt DEFAULT (SYSUTCDATETIME())
);

CREATE TABLE dbo.quote_out_of_scope_prefixes (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_out_of_scope_prefixes PRIMARY KEY,
    Prefix NVARCHAR(50) NOT NULL,
    Reason NVARCHAR(500) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_quote_oos_IsActive DEFAULT (1),
    CreatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_quote_oos_CreatedAt DEFAULT (SYSUTCDATETIME())
);

CREATE UNIQUE INDEX UX_quote_out_of_scope_prefixes_Prefix
ON dbo.quote_out_of_scope_prefixes (Prefix)
WHERE IsActive = 1;

CREATE TABLE dbo.quote_description_keywords (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_description_keywords PRIMARY KEY,
    Keyword NVARCHAR(150) NOT NULL,
    KeywordNormalized NVARCHAR(150) NOT NULL,
    Weight INT NOT NULL CONSTRAINT DF_quote_description_keywords_Weight DEFAULT (1),
    Notes NVARCHAR(500) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_quote_desc_IsActive DEFAULT (1),
    CreatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_quote_desc_CreatedAt DEFAULT (SYSUTCDATETIME())
);

CREATE UNIQUE INDEX UX_quote_description_keywords_KeywordNormalized
ON dbo.quote_description_keywords (KeywordNormalized)
WHERE IsActive = 1;

CREATE TABLE dbo.quote_config (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_config PRIMARY KEY,
    ConfigKey NVARCHAR(100) NOT NULL,
    ConfigValue NVARCHAR(500) NOT NULL,
    ValueType NVARCHAR(30) NOT NULL CONSTRAINT DF_quote_config_ValueType DEFAULT ('String'),
    Description NVARCHAR(1000) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_quote_config_IsActive DEFAULT (1),
    UpdatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_quote_config_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedBy NVARCHAR(100) NULL
);

CREATE UNIQUE INDEX UX_quote_config_ConfigKey
ON dbo.quote_config (ConfigKey)
WHERE IsActive = 1;

------------------------------------------------------------
-- 2. OPERATIONAL TABLES
------------------------------------------------------------

CREATE TABLE dbo.quote_rfq_archive (
    Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_rfq_archive PRIMARY KEY,
    SourceSystem NVARCHAR(50) NOT NULL CONSTRAINT DF_quote_rfq_archive_SourceSystem DEFAULT ('Mailbox'),
    GraphMessageId NVARCHAR(255) NULL,
    ConversationId NVARCHAR(255) NULL,
    InternetMessageId NVARCHAR(500) NULL,
    OriginalSenderEmail NVARCHAR(255) NULL,
    OriginalSenderName NVARCHAR(255) NULL,
    ForwardedByEmail NVARCHAR(255) NULL,
    Subject NVARCHAR(500) NULL,
    ReceivedAtUtc DATETIME2(0) NULL,
    ProcessedAtUtc DATETIME2(0) NULL,
    BodyText NVARCHAR(MAX) NULL,
    BodyHtml NVARCHAR(MAX) NULL,
    RawMessagePathOrBlobReference NVARCHAR(1000) NULL,
    ProcessingStatus NVARCHAR(50) NOT NULL CONSTRAINT DF_quote_rfq_archive_Status DEFAULT ('New'),
    ProcessingError NVARCHAR(MAX) NULL,
    RerunCount INT NOT NULL CONSTRAINT DF_quote_rfq_archive_RerunCount DEFAULT (0),
    CreatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_quote_rfq_archive_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CreatedBy NVARCHAR(100) NULL,
    UpdatedAtUtc DATETIME2(0) NULL,
    UpdatedBy NVARCHAR(100) NULL
);

CREATE UNIQUE INDEX UX_quote_rfq_archive_GraphMessageId
ON dbo.quote_rfq_archive (GraphMessageId)
WHERE GraphMessageId IS NOT NULL;

CREATE INDEX IX_quote_rfq_archive_ReceivedAtUtc
ON dbo.quote_rfq_archive (ReceivedAtUtc DESC);

CREATE INDEX IX_quote_rfq_archive_ProcessingStatus
ON dbo.quote_rfq_archive (ProcessingStatus);

CREATE INDEX IX_quote_rfq_archive_OriginalSenderEmail
ON dbo.quote_rfq_archive (OriginalSenderEmail);

CREATE TABLE dbo.quote_rfq_attachments (
    Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_rfq_attachments PRIMARY KEY,
    RfqArchiveId BIGINT NOT NULL,
    GraphAttachmentId NVARCHAR(255) NULL,
    FileName NVARCHAR(500) NOT NULL,
    FileExtension NVARCHAR(20) NULL,
    MimeType NVARCHAR(150) NULL,
    FileSizeBytes BIGINT NULL,
    FileHashSha256 NVARCHAR(128) NULL,
    StoragePathOrBlobReference NVARCHAR(1000) NULL,
    ExtractedText NVARCHAR(MAX) NULL,
    ExtractionStatus NVARCHAR(50) NOT NULL CONSTRAINT DF_quote_rfq_attachments_Status DEFAULT ('Pending'),
    ExtractionError NVARCHAR(MAX) NULL,
    CreatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_quote_rfq_attachments_CreatedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_quote_rfq_attachments_archive
        FOREIGN KEY (RfqArchiveId) REFERENCES dbo.quote_rfq_archive(Id)
        ON DELETE CASCADE
);

CREATE INDEX IX_quote_rfq_attachments_RfqArchiveId
ON dbo.quote_rfq_attachments (RfqArchiveId);

CREATE INDEX IX_quote_rfq_attachments_FileHashSha256
ON dbo.quote_rfq_attachments (FileHashSha256);

CREATE TABLE dbo.quote_rfq_matches (
    Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_rfq_matches PRIMARY KEY,
    RfqArchiveId BIGINT NOT NULL,
    AttachmentId BIGINT NULL,
    RunId UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_quote_rfq_matches_RunId DEFAULT (NEWID()),
    LineNumber INT NULL,
    RawLineText NVARCHAR(2000) NULL,
    ParsedPartNumber NVARCHAR(150) NULL,
    ParsedPartNumberNormalized NVARCHAR(150) NULL,
    ParsedQuantity DECIMAL(18,4) NULL,
    ParsedDescription NVARCHAR(2000) NULL,
    CustomerReference NVARCHAR(255) NULL,
    MatchCategory NVARCHAR(50) NOT NULL,
    MatchedDistributorPartNumber NVARCHAR(150) NULL,
    MatchedItemId INT NULL,
    MatchScore DECIMAL(5,2) NULL,
    ConfidenceLevel NVARCHAR(30) NULL,
    CandidateJson NVARCHAR(MAX) NULL,
    RequiresReview BIT NOT NULL CONSTRAINT DF_quote_rfq_matches_RequiresReview DEFAULT (1),
    OperatorDecision NVARCHAR(50) NULL,
    OperatorCorrectedPartNumber NVARCHAR(150) NULL,
    OperatorCorrectedItemId INT NULL,
    OperatorNotes NVARCHAR(2000) NULL,
    ReviewedBy NVARCHAR(100) NULL,
    ReviewedAtUtc DATETIME2(0) NULL,
    CreatedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_quote_rfq_matches_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAtUtc DATETIME2(0) NULL,

    CONSTRAINT FK_quote_rfq_matches_archive
        FOREIGN KEY (RfqArchiveId) REFERENCES dbo.quote_rfq_archive(Id)
        ON DELETE CASCADE,

    CONSTRAINT FK_quote_rfq_matches_attachment
        FOREIGN KEY (AttachmentId) REFERENCES dbo.quote_rfq_attachments(Id)
        ON DELETE NO ACTION
);

CREATE INDEX IX_quote_rfq_matches_RfqArchiveId
ON dbo.quote_rfq_matches (RfqArchiveId);

CREATE INDEX IX_quote_rfq_matches_AttachmentId
ON dbo.quote_rfq_matches (AttachmentId);

CREATE INDEX IX_quote_rfq_matches_MatchCategory
ON dbo.quote_rfq_matches (MatchCategory);

CREATE INDEX IX_quote_rfq_matches_RequiresReview
ON dbo.quote_rfq_matches (RequiresReview);

CREATE INDEX IX_quote_rfq_matches_MatchedDistributorPartNumber
ON dbo.quote_rfq_matches (MatchedDistributorPartNumber);

CREATE INDEX IX_quote_rfq_matches_ParsedPartNumberNormalized
ON dbo.quote_rfq_matches (ParsedPartNumberNormalized);

CREATE INDEX IX_quote_rfq_matches_RunId
ON dbo.quote_rfq_matches (RunId);

CREATE TABLE dbo.quote_audit_log (
    Id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_quote_audit_log PRIMARY KEY,
    RfqArchiveId BIGINT NULL,
    MatchId BIGINT NULL,
    ActionType NVARCHAR(100) NOT NULL,
    ActionDetail NVARCHAR(MAX) NULL,
    OldValueJson NVARCHAR(MAX) NULL,
    NewValueJson NVARCHAR(MAX) NULL,
    PerformedBy NVARCHAR(100) NULL,
    PerformedAtUtc DATETIME2(0) NOT NULL CONSTRAINT DF_quote_audit_log_PerformedAt DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT FK_quote_audit_log_archive
        FOREIGN KEY (RfqArchiveId) REFERENCES dbo.quote_rfq_archive(Id)
        ON DELETE NO ACTION,

    CONSTRAINT FK_quote_audit_log_match
        FOREIGN KEY (MatchId) REFERENCES dbo.quote_rfq_matches(Id)
        ON DELETE NO ACTION
);

CREATE INDEX IX_quote_audit_log_RfqArchiveId
ON dbo.quote_audit_log (RfqArchiveId);

CREATE INDEX IX_quote_audit_log_MatchId
ON dbo.quote_audit_log (MatchId);

CREATE INDEX IX_quote_audit_log_ActionType
ON dbo.quote_audit_log (ActionType);

CREATE INDEX IX_quote_audit_log_PerformedAtUtc
ON dbo.quote_audit_log (PerformedAtUtc DESC);

------------------------------------------------------------
-- 3. SEED VALUES FOR CONFIGURATION
------------------------------------------------------------

INSERT INTO dbo.quote_config (ConfigKey, ConfigValue, ValueType, Description)
VALUES
('PartialMatchCutoffScore', '60', 'Integer', 'Equivalent to Python difflib cutoff=0.6; used by FuzzySharp or equivalent C# fuzzy matching.'),
('PartialMatchCandidateLimit', '2', 'Integer', 'Maximum candidate matches returned for partial/fuzzy match review.'),
('DescriptionMatchCandidateLimit', '3', 'Integer', 'Maximum description-match candidates returned for review.'),
('AutoApproveExactMatch', 'false', 'Boolean', 'Whether exact matches can bypass operator review. Recommended false or monitored initially.'),
('ArchiveRetentionYears', '7', 'Integer', 'Recommended retention horizon for original RFQ archive records. Confirm with Distributor policy.');

INSERT INTO dbo.quote_out_of_scope_prefixes (Prefix, Reason)
VALUES
('RT-', 'X-Ray / radiation-related item outside current Distributor NDT scope.'),
('RS-', 'Radiation sign / X-Ray-related item outside current Distributor NDT scope.');

INSERT INTO dbo.quote_cross_references (CompetitorName, CompetitorPartNumber, CompetitorPartNumberNormalized, DistributorPartNumber, ConfidenceLevel, Notes)
VALUES
('OEM', 'OEM9087L', 'OEM9087L', 'DST-0615L', 'High', 'Known OEM to DST mapping from validated prototype.'),
('OEM', 'OEM9087R', 'OEM9087R', 'DST-0615R', 'High', 'Known OEM to DST mapping from validated prototype.'),
('OEM', 'OEM9110L', 'OEM9110L', 'DST-0616L', 'High', 'Known OEM to DST mapping from validated prototype.'),
('OEM', 'OEM9110R', 'OEM9110R', 'DST-0616R', 'High', 'Known OEM to DST mapping from validated prototype.');

INSERT INTO dbo.quote_description_keywords (Keyword, KeywordNormalized, Weight, Notes)
VALUES
('probe', 'PROBE', 1, 'Description fallback keyword.'),
('probet', 'PROBET', 1, 'Prototype spelling variant observed in RFQ text.'),
('transducer', 'TRANSDUCER', 1, 'Description fallback keyword.'),
('kit', 'KIT', 1, 'Description fallback keyword.'),
('reference standard', 'REFERENCESTANDARD', 2, 'Higher signal phrase.'),
('calibration block', 'CALIBRATIONBLOCK', 2, 'Higher signal phrase.'),
('step', 'STEP', 1, 'Description fallback keyword.'),
('cable', 'CABLE', 1, 'Description fallback keyword.'),
('rototest', 'ROTOTEST', 2, 'Higher signal product phrase.'),
('eddy current', 'EDDYCURRENT', 2, 'Higher signal product phrase.'),
('ultrasonic', 'ULTRASONIC', 2, 'Higher signal product phrase.'),
('surface wave', 'SURFACEWAVE', 2, 'Higher signal product phrase.'),
('shear wave', 'SHEARWAVE', 2, 'Higher signal product phrase.');

------------------------------------------------------------
-- 4. OPTIONAL VIEW FOR REVIEW QUEUE
------------------------------------------------------------

CREATE VIEW dbo.v_quote_rfq_review_queue
AS
SELECT
    a.Id AS RfqArchiveId,
    a.Subject,
    a.OriginalSenderEmail,
    a.OriginalSenderName,
    a.ReceivedAtUtc,
    a.ProcessingStatus,
    m.Id AS MatchId,
    m.LineNumber,
    m.RawLineText,
    m.ParsedPartNumber,
    m.ParsedQuantity,
    m.MatchCategory,
    m.MatchedDistributorPartNumber,
    m.MatchScore,
    m.ConfidenceLevel,
    m.RequiresReview,
    m.OperatorDecision,
    m.ReviewedBy,
    m.ReviewedAtUtc
FROM dbo.quote_rfq_archive a
INNER JOIN dbo.quote_rfq_matches m
    ON a.Id = m.RfqArchiveId
WHERE m.RequiresReview = 1
   OR m.OperatorDecision IS NULL;
