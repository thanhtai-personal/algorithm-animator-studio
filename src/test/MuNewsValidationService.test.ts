import { describe, expect, it } from "vitest";
import { extractPublishedDate } from "../../server/services/MuNewsValidationService";

describe("extractPublishedDate", () => {
  it("reads published date from JSON-LD objects", () => {
    const html = `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": "Manchester United update",
          "datePublished": "2026-05-31T09:15:00+01:00"
        }
      </script>
    `;

    expect(extractPublishedDate(html)).toBe("2026-05-31T08:15:00.000Z");
  });

  it("reads visible published labels when metadata is missing", () => {
    const html = `
      <article>
        <span>Published: May 31, 2026 5:20 PM GMT</span>
        <p>Manchester United article body.</p>
      </article>
    `;

    expect(extractPublishedDate(html)).toBe("2026-05-31T17:20:00.000Z");
  });
});
