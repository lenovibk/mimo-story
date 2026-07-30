BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Story] ALTER COLUMN [videoUrl] NVARCHAR(1000) NULL;
ALTER TABLE [dbo].[Story] ALTER COLUMN [subtitleEnUrl] NVARCHAR(1000) NULL;
ALTER TABLE [dbo].[Story] ALTER COLUMN [subtitleViUrl] NVARCHAR(1000) NULL;
ALTER TABLE [dbo].[Story] ADD [audioUrl] NVARCHAR(1000),
[mediaType] NVARCHAR(1000) NOT NULL CONSTRAINT [Story_mediaType_df] DEFAULT 'VIDEO',
[programId] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[Program] (
    [id] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [label] NVARCHAR(1000) NOT NULL,
    [icon] NVARCHAR(1000) NOT NULL,
    [color] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL CONSTRAINT [Program_order_df] DEFAULT 0,
    [published] BIT NOT NULL CONSTRAINT [Program_published_df] DEFAULT 1,
    CONSTRAINT [Program_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Program_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[ProgramAgeLink] (
    [id] NVARCHAR(1000) NOT NULL,
    [programId] NVARCHAR(1000) NOT NULL,
    [age] INT NOT NULL,
    CONSTRAINT [ProgramAgeLink_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProgramAgeLink_programId_age_key] UNIQUE NONCLUSTERED ([programId],[age])
);

-- CreateTable
CREATE TABLE [dbo].[ProgramCategoryLink] (
    [id] NVARCHAR(1000) NOT NULL,
    [programId] NVARCHAR(1000) NOT NULL,
    [categoryId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [ProgramCategoryLink_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ProgramCategoryLink_programId_categoryId_key] UNIQUE NONCLUSTERED ([programId],[categoryId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Story_programId_idx] ON [dbo].[Story]([programId]);

-- AddForeignKey
ALTER TABLE [dbo].[ProgramAgeLink] ADD CONSTRAINT [ProgramAgeLink_programId_fkey] FOREIGN KEY ([programId]) REFERENCES [dbo].[Program]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProgramCategoryLink] ADD CONSTRAINT [ProgramCategoryLink_programId_fkey] FOREIGN KEY ([programId]) REFERENCES [dbo].[Program]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ProgramCategoryLink] ADD CONSTRAINT [ProgramCategoryLink_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Story] ADD CONSTRAINT [Story_programId_fkey] FOREIGN KEY ([programId]) REFERENCES [dbo].[Program]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

