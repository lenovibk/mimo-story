BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ConversionJob] (
    [id] NVARCHAR(1000) NOT NULL,
    [kind] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ConversionJob_status_df] DEFAULT 'QUEUED',
    [sourceName] NVARCHAR(1000) NOT NULL,
    [sourceBytes] INT NOT NULL,
    [outputBytes] INT,
    [outputUrl] NVARCHAR(1000),
    [progress] FLOAT(53) NOT NULL CONSTRAINT [ConversionJob_progress_df] DEFAULT 0,
    [error] NVARCHAR(4000),
    [storyId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ConversionJob_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [startedAt] DATETIME2,
    [finishedAt] DATETIME2,
    CONSTRAINT [ConversionJob_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ConversionJob_storyId_idx] ON [dbo].[ConversionJob]([storyId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ConversionJob_status_idx] ON [dbo].[ConversionJob]([status]);

-- AddForeignKey
ALTER TABLE [dbo].[ConversionJob] ADD CONSTRAINT [ConversionJob_storyId_fkey] FOREIGN KEY ([storyId]) REFERENCES [dbo].[Story]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
