BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[VocabItem] (
    [id] NVARCHAR(1000) NOT NULL,
    [storyId] NVARCHAR(1000) NOT NULL,
    [cueStart] FLOAT(53),
    [cueText] NVARCHAR(4000),
    [word] NVARCHAR(1000) NOT NULL,
    [phonetic] NVARCHAR(1000),
    [partOfSpeech] NVARCHAR(1000),
    [meaningVi] NVARCHAR(4000) NOT NULL,
    [exampleEn] NVARCHAR(4000) NOT NULL,
    [exampleVi] NVARCHAR(4000) NOT NULL,
    [imageUrl] NVARCHAR(1000),
    [order] INT NOT NULL CONSTRAINT [VocabItem_order_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [VocabItem_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [VocabItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[GrammarPoint] (
    [id] NVARCHAR(1000) NOT NULL,
    [storyId] NVARCHAR(1000) NOT NULL,
    [cueStart] FLOAT(53),
    [cueText] NVARCHAR(4000),
    [title] NVARCHAR(1000) NOT NULL,
    [structure] NVARCHAR(1000),
    [explanationVi] NVARCHAR(4000) NOT NULL,
    [exampleEn] NVARCHAR(4000) NOT NULL,
    [exampleVi] NVARCHAR(4000) NOT NULL,
    [order] INT NOT NULL CONSTRAINT [GrammarPoint_order_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [GrammarPoint_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [GrammarPoint_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[VocabProgress] (
    [id] NVARCHAR(1000) NOT NULL,
    [childId] NVARCHAR(1000) NOT NULL,
    [vocabId] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [VocabProgress_status_df] DEFAULT 'new',
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [VocabProgress_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [VocabProgress_childId_vocabId_key] UNIQUE NONCLUSTERED ([childId],[vocabId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VocabItem_storyId_idx] ON [dbo].[VocabItem]([storyId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GrammarPoint_storyId_idx] ON [dbo].[GrammarPoint]([storyId]);

-- AddForeignKey
ALTER TABLE [dbo].[VocabItem] ADD CONSTRAINT [VocabItem_storyId_fkey] FOREIGN KEY ([storyId]) REFERENCES [dbo].[Story]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[GrammarPoint] ADD CONSTRAINT [GrammarPoint_storyId_fkey] FOREIGN KEY ([storyId]) REFERENCES [dbo].[Story]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[VocabProgress] ADD CONSTRAINT [VocabProgress_childId_fkey] FOREIGN KEY ([childId]) REFERENCES [dbo].[Child]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[VocabProgress] ADD CONSTRAINT [VocabProgress_vocabId_fkey] FOREIGN KEY ([vocabId]) REFERENCES [dbo].[VocabItem]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
