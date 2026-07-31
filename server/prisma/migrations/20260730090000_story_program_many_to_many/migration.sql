BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[StoryProgramLink] (
    [id] NVARCHAR(1000) NOT NULL,
    [storyId] NVARCHAR(1000) NOT NULL,
    [programId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [StoryProgramLink_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [StoryProgramLink_storyId_programId_key] UNIQUE NONCLUSTERED ([storyId],[programId])
);

-- Backfill: carry each story's existing single programId over as its first program link
-- before the old column/FK are dropped below, so no existing story loses its program.
INSERT INTO [dbo].[StoryProgramLink] ([id], [storyId], [programId])
SELECT LOWER(CONVERT(NVARCHAR(36), NEWID())), [id], [programId]
FROM [dbo].[Story]
WHERE [programId] IS NOT NULL;

-- DropForeignKey (must go before adding the new FKs below - otherwise SQL Server sees
-- two cascade paths from Program to StoryProgramLink: direct, and via this old FK + Story's own cascade)
ALTER TABLE [dbo].[Story] DROP CONSTRAINT [Story_programId_fkey];

-- DropIndex (must drop before dropping the column, SQL Server disallows dropping a column with a dependent index)
DROP INDEX [Story_programId_idx] ON [dbo].[Story];

-- AlterTable
ALTER TABLE [dbo].[Story] DROP COLUMN [programId];

-- AddForeignKey
ALTER TABLE [dbo].[StoryProgramLink] ADD CONSTRAINT [StoryProgramLink_storyId_fkey] FOREIGN KEY ([storyId]) REFERENCES [dbo].[Story]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StoryProgramLink] ADD CONSTRAINT [StoryProgramLink_programId_fkey] FOREIGN KEY ([programId]) REFERENCES [dbo].[Program]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
