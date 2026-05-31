import { describe, expect, it } from "vitest";
import { normalizeVietnameseText } from "@/features/mu-news/muNewsUtils";

describe("normalizeVietnameseText", () => {
  it("normalizes decomposed Vietnamese marks to composed Unicode", () => {
    const text = "Anh em Quỷ Đỏ thân mến";

    expect(normalizeVietnameseText(text)).toBe("Anh em Quỷ Đỏ thân mến");
  });

  it("converts pasted ASCII tone markers inside Vietnamese syllables", () => {
    const text = "tin đô` n Rafael Leao, danh sách tiê` n đạo mới";

    expect(normalizeVietnameseText(text)).toBe("tin đồn Rafael Leao, danh sách tiền đạo mới");
  });
});
