export type YoutubeUploadBody = {
  title?: string;
  description?: string;
  tags?: string;
  categoryId?: string;
  privacyStatus?: string;
  madeForKids?: string;
  notifySubscribers?: string;
  containsSyntheticMedia?: string;
  publishAt?: string;
  playlistId?: string;
  refreshToken?: string;
  musicLicenseText?: string;
  channelId?: string;
  channelTitle?: string;
};

export type YoutubeUploadGeneratedBody = YoutubeUploadBody & {
  videoRelativePath?: string;
};
