BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Parent] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [plan] NVARCHAR(1000) NOT NULL CONSTRAINT [Parent_plan_df] DEFAULT 'free',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Parent_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Parent_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Parent_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[VerificationCode] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [codeHash] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [consumedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [VerificationCode_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [VerificationCode_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Child] (
    [id] NVARCHAR(1000) NOT NULL,
    [parentId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [gender] NVARCHAR(1000) NOT NULL,
    [age] INT NOT NULL,
    [avatarKey] NVARCHAR(1000) NOT NULL,
    [stars] INT NOT NULL CONSTRAINT [Child_stars_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Child_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Child_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ChildInterest] (
    [id] NVARCHAR(1000) NOT NULL,
    [childId] NVARCHAR(1000) NOT NULL,
    [interest] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [ChildInterest_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ChildInterest_childId_interest_key] UNIQUE NONCLUSTERED ([childId],[interest])
);

-- CreateTable
CREATE TABLE [dbo].[Favorite] (
    [id] NVARCHAR(1000) NOT NULL,
    [childId] NVARCHAR(1000) NOT NULL,
    [storyId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Favorite_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Favorite_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Favorite_childId_storyId_key] UNIQUE NONCLUSTERED ([childId],[storyId])
);

-- CreateTable
CREATE TABLE [dbo].[StoryProgress] (
    [id] NVARCHAR(1000) NOT NULL,
    [childId] NVARCHAR(1000) NOT NULL,
    [storyId] NVARCHAR(1000) NOT NULL,
    [ratio] FLOAT(53) NOT NULL,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [StoryProgress_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [StoryProgress_childId_storyId_key] UNIQUE NONCLUSTERED ([childId],[storyId])
);

-- CreateTable
CREATE TABLE [dbo].[DailyActivity] (
    [id] NVARCHAR(1000) NOT NULL,
    [childId] NVARCHAR(1000) NOT NULL,
    [date] DATE NOT NULL,
    [watchedSeconds] INT NOT NULL CONSTRAINT [DailyActivity_watchedSeconds_df] DEFAULT 0,
    CONSTRAINT [DailyActivity_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [DailyActivity_childId_date_key] UNIQUE NONCLUSTERED ([childId],[date])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [VerificationCode_email_idx] ON [dbo].[VerificationCode]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Child_parentId_idx] ON [dbo].[Child]([parentId]);

-- AddForeignKey
ALTER TABLE [dbo].[Child] ADD CONSTRAINT [Child_parentId_fkey] FOREIGN KEY ([parentId]) REFERENCES [dbo].[Parent]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChildInterest] ADD CONSTRAINT [ChildInterest_childId_fkey] FOREIGN KEY ([childId]) REFERENCES [dbo].[Child]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Favorite] ADD CONSTRAINT [Favorite_childId_fkey] FOREIGN KEY ([childId]) REFERENCES [dbo].[Child]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StoryProgress] ADD CONSTRAINT [StoryProgress_childId_fkey] FOREIGN KEY ([childId]) REFERENCES [dbo].[Child]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DailyActivity] ADD CONSTRAINT [DailyActivity_childId_fkey] FOREIGN KEY ([childId]) REFERENCES [dbo].[Child]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
