# Social Auto Publishing Tasks

## Goal

Build an admin-only workflow that can publish exported videos to Facebook, YouTube, and TikTok. Guest users can keep using the public studio preview features, but only logged-in admin users can open and configure auto-publishing tools.

## Platform Notes

- YouTube upload should use YouTube Data API `videos.insert`.
- TikTok upload should use TikTok Content Posting API.
- Facebook/Meta support should target Page video/Reels publishing through Graph/Video API. Do not support posting to personal Facebook profiles.
- API keys alone are usually not enough for uploads. Plan for OAuth/access tokens, scopes, app review, and refresh handling where each platform requires it.

References:

- YouTube: https://developers.google.com/youtube/v3/docs/videos/insert
- TikTok: https://developers.tiktok.com/doc/content-posting-api-reference-upload-video
- Meta Video API: https://developers.facebook.com/docs/video-api/guides/publishing/

## Tasks

1. Add admin-only Social Publishing menu
   - Show the menu only when the current user is logged in as `owner_admin`.
   - Hide the menu for guests and non-admin users.
   - Route the menu to a Social Publishing page or panel.

2. Build channel configuration UI
   - Add platform sections for Facebook, YouTube, and TikTok.
   - Show status per platform: `Not configured`, `Configured`, `Token expired`, `Upload failed`.
   - Add a test connection action for each platform.
   - Required config fields:
     - Facebook: Page ID and token/OAuth setup.
     - YouTube: OAuth client setup and channel authorization.
     - TikTok: OAuth client setup and Content Posting API authorization.

3. Store secrets safely
   - Do not store API keys, client secrets, or access tokens in frontend localStorage.
   - Add backend endpoints for credential save/read/delete.
   - Store credentials encrypted server-side.
   - Mask secrets in the UI.
   - Add delete/revoke actions.

4. Implement OAuth and token lifecycle
   - Add platform-specific OAuth start/callback endpoints where needed.
   - Store access and refresh tokens where supported.
   - Refresh expired tokens automatically where supported.
   - Surface missing permission, app review, quota, and expired token errors clearly.

5. Add export-to-publish handoff
   - After video export, let admins choose:
     - Download only
     - Publish to Facebook
     - Publish to YouTube
     - Publish to TikTok
     - Publish to multiple platforms
   - Reuse the exported video Blob/file.
   - Validate platform-specific file format and size before upload.

6. Add post metadata form
   - Common fields: title, description/caption, tags/hashtags, privacy, scheduled publish time when supported.
   - YouTube fields: category, made for kids, privacy status.
   - TikTok fields: privacy level, allow comments, allow duet, allow stitch when supported.
   - Facebook fields: Page ID, caption, publish as Page.

7. Create upload service abstraction
   - Define shared methods:
     - `validateConfig(platform)`
     - `uploadVideo(platform, file, metadata)`
     - `getUploadStatus(platform, jobId)`
   - Implement adapters:
     - `facebookPublisher`
     - `youtubePublisher`
     - `tiktokPublisher`

8. Add upload progress and history
   - Show per-platform upload progress.
   - Support retry for failed uploads.
   - Save upload history with platform, status, video title, created time, published URL, and error message.
   - Prefer backend jobs for large video uploads.

9. Add error handling
   - Missing configuration.
   - Token expired.
   - Missing permission/scope.
   - Platform quota/rate limit.
   - Invalid video format or size.
   - Platform app not approved for publishing.

## Acceptance Criteria

- Guest users can open Studio and use allowed preview actions, but cannot see Social Publishing.
- Logged-in `owner_admin` users can see Social Publishing.
- Admin users can configure each platform and test connection.
- Admin users can publish an exported video to at least one configured platform.
- API errors show actionable messages and do not crash the app.
- Secrets are not exposed in DOM, localStorage, or client logs.
