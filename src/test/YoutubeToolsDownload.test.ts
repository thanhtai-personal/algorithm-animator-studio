import { describe, expect, it } from "vitest";
import { startYoutubeDownloadJob, listYoutubeToolsJobs } from "../../server/services/YoutubeToolsJobService";
import {
  buildYtDlpRuntimeArgs,
  isYtDlpAuthenticationRequiredError,
  isYtDlpBrowserCookieAccessError,
  stripYtDlpBrowserCookieArgs,
} from "../../server/services/YoutubeToolsRuntimeOptions";
import { buildYoutubeDownloadSectionArgs } from "../../server/utils/youtubeDownloadSection";
import { normalizeYoutubeUrl } from "../../server/utils/youtubeUrl";

describe("YouTube tools download safeguards", () => {
  it("retries can remove browser-cookie arguments without touching other yt-dlp options", () => {
    const args = buildYtDlpRuntimeArgs({
      YOUTUBE_JS_RUNTIME: "node",
      YOUTUBE_REMOTE_COMPONENTS: "ejs:github",
      YOUTUBE_COOKIES_FROM_BROWSER: "chrome",
    });

    expect(args).toContain("--cookies-from-browser");
    expect(stripYtDlpBrowserCookieArgs(args)).toEqual([
      "--js-runtimes",
      "node",
      "--remote-components",
      "ejs:github",
    ]);
  });

  it("recognizes the locked Chrome cookie database error reported by yt-dlp", () => {
    expect(isYtDlpBrowserCookieAccessError(
      "ERROR: Could not copy Chrome cookie database. See yt-dlp issue 7271 for more info",
    )).toBe(true);
    expect(isYtDlpBrowserCookieAccessError("ERROR: Requested format is not available")).toBe(false);
    expect(isYtDlpAuthenticationRequiredError("Sign in to confirm you’re not a bot")).toBe(true);
  });

  it("accepts YouTube URLs and rejects non-YouTube sources before a background job is queued", () => {
    expect(normalizeYoutubeUrl("https://youtu.be/abc123")).toBe("https://youtu.be/abc123");

    const jobCountBefore = listYoutubeToolsJobs().length;
    expect(() => startYoutubeDownloadJob({
      url: "https://www.manutd.com/en/mutv/videos/detail/example",
      mode: "video",
    })).toThrow("Chỉ hỗ trợ link YouTube/youtu.be.");
    expect(listYoutubeToolsJobs()).toHaveLength(jobCountBefore);
  });

  it("limits preset background downloads to the requested short video section", () => {
    expect(buildYoutubeDownloadSectionArgs("video", 20, 32)).toEqual([
      "--download-sections",
      "*20-32",
      "--force-keyframes-at-cuts",
    ]);
    expect(buildYoutubeDownloadSectionArgs("audio", 20, 32)).toEqual([]);
    expect(() => buildYoutubeDownloadSectionArgs("video", 0, 21)).toThrow("0.5 đến 20 giây");
  });

});
