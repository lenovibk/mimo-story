BEGIN TRY

BEGIN TRAN;

-- SQL Server's plain UNIQUE CONSTRAINT allows only one NULL, but Parent.email
-- is now nullable (guest parents have no email yet) and there can be many
-- guests at once. Replace it with a filtered unique index that only enforces
-- uniqueness among non-null emails.
ALTER TABLE [dbo].[Parent] DROP CONSTRAINT [Parent_email_key];

CREATE UNIQUE NONCLUSTERED INDEX [Parent_email_key] ON [dbo].[Parent]([email]) WHERE [email] IS NOT NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
