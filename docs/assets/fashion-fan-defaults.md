# Fashion Fan — default image sources

KAI STUDIO can fetch a small, pinned set of reusable demo assets on first use of the `fashion-claw` preset.
The assets are normalized to PNG, placed in `SERVER_DATA_DIR/generated-videos/preset-clips/fashion-claw/defaults/`, and reused offline afterwards. They are **not yet committed as binary files** to this repository.

| Asset | Source | Creator | License |
| --- | --- | --- | --- |
| `fashion-default-1.png` | [Female Model Posing](https://commons.wikimedia.org/wiki/File:Female_Model_Posing.jpg) | Petr Kratochvil | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `fashion-default-2.png` | [Fashion model portrait](https://commons.wikimedia.org/wiki/File:Fashion_model_portrait.jpg) | Petr Kratochvil | CC0 1.0 |
| `fashion-default-3.png` | [Fashion runway1](https://commons.wikimedia.org/wiki/File:Fashion_runway1.jpg) | Kwaku Berko | CC0 1.0 |
| `fashion-default-fan.png` | [Fan](https://openclipart.org/detail/5174/fan) | biswajyotim / Openclipart | [CC0 1.0](https://openclipart.org/faq) |

Sources and licenses were checked 2026-10-19.

## Notes for editors

- The first launch needs network access. Missing or inaccessible sources fall back to KAI STUDIO's built-in vector model/fan; the video remains renderable.
- The stock portraits are **different photos** and do not guarantee a consistent model, pose, or overhead perspective. They demonstrate editable outfit order, not authentic virtual try-on.
- A white-background cutout is attempted for the first two photos; white or pale clothing may partially disappear. The third runway photo retains its photographic backdrop.
- Commercial copyright use is supported by the listed CC0 declarations, but CC0 by itself does not waive a depicted person's privacy, likeness or publicity rights. Avoid implying the people endorse any business or clothing product.
- Using real shop/catalog photos with confirmed model rights and transparent backgrounds will look significantly more realistic.
- The downloaded fan is an Openclipart illustration, not a photorealistic ceiling fan. The original procedural metallic fan remains as an offline fallback.
- No untrusted URL from user input is downloaded by this loader. Redirects are restricted to the two Wikimedia hosts and Openclipart, with a bounded image size and timeout.
