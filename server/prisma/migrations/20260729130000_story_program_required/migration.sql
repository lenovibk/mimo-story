BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Story] DROP CONSTRAINT [Story_programId_fkey];

-- DropIndex (must drop before ALTER COLUMN, SQL Server disallows altering a column with a dependent index)
DROP INDEX [Story_programId_idx] ON [dbo].[Story];

-- AlterTable
ALTER TABLE [dbo].[Story] ALTER COLUMN [programId] NVARCHAR(1000) NOT NULL;

-- RecreateIndex
CREATE NONCLUSTERED INDEX [Story_programId_idx] ON [dbo].[Story]([programId]);

-- AddForeignKey
ALTER TABLE [dbo].[Story] ADD CONSTRAINT [Story_programId_fkey] FOREIGN KEY ([programId]) REFERENCES [dbo].[Program]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

