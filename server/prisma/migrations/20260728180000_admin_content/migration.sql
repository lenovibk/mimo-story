BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[AdminUser] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [AdminUser_role_df] DEFAULT 'admin',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [AdminUser_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [AdminUser_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [AdminUser_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Category] (
    [id] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [label] NVARCHAR(1000) NOT NULL,
    [icon] NVARCHAR(1000) NOT NULL,
    [color] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL CONSTRAINT [Category_order_df] DEFAULT 0,
    CONSTRAINT [Category_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Category_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[Story] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [episodeLabel] NVARCHAR(1000),
    [coverUrl] NVARCHAR(1000) NOT NULL,
    [videoUrl] NVARCHAR(1000) NOT NULL,
    [subtitleEnUrl] NVARCHAR(1000) NOT NULL,
    [subtitleViUrl] NVARCHAR(1000) NOT NULL,
    [duration] INT,
    [accent] NVARCHAR(1000),
    [minAge] INT,
    [maxAge] INT,
    [published] BIT NOT NULL CONSTRAINT [Story_published_df] DEFAULT 1,
    [categoryId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Story_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Story_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[StoryTagLink] (
    [id] NVARCHAR(1000) NOT NULL,
    [storyId] NVARCHAR(1000) NOT NULL,
    [tag] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [StoryTagLink_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [StoryTagLink_storyId_tag_key] UNIQUE NONCLUSTERED ([storyId],[tag])
);

-- CreateTable
CREATE TABLE [dbo].[Ad] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [imageUrl] NVARCHAR(1000) NOT NULL,
    [linkUrl] NVARCHAR(1000),
    [placement] NVARCHAR(1000) NOT NULL CONSTRAINT [Ad_placement_df] DEFAULT 'home_banner',
    [minAge] INT,
    [maxAge] INT,
    [active] BIT NOT NULL CONSTRAINT [Ad_active_df] DEFAULT 1,
    [startAt] DATETIME2,
    [endAt] DATETIME2,
    [priority] INT NOT NULL CONSTRAINT [Ad_priority_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Ad_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Ad_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Story_categoryId_idx] ON [dbo].[Story]([categoryId]);

-- AddForeignKey
ALTER TABLE [dbo].[Story] ADD CONSTRAINT [Story_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[Category]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StoryTagLink] ADD CONSTRAINT [StoryTagLink_storyId_fkey] FOREIGN KEY ([storyId]) REFERENCES [dbo].[Story]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
