# Free sprite nguồn mở cho Maze Pathfinding / Car Race

Mục tiêu: dùng asset đẹp hơn cho map mê cung và xe đua nhưng vẫn an toàn khi publish YouTube/Facebook.

## Ưu tiên 1 — Kenney Racing Pack

- Nguồn: https://www.kenney.nl/assets/racing-pack
- License hiển thị trên trang: Creative Commons CC0.
- Phù hợp: top-down vehicle, road tile, racing obstacle, sprite sheet.
- Gợi ý dùng trong app:
  - tải pack thủ công;
  - copy PNG xe vào `src/assets/maze-race/vehicles/`;
  - copy road/tile vào `src/assets/maze-race/tiles/`;
  - giữ file license/README đi kèm trong cùng thư mục asset.

## Ưu tiên 2 — itch.io CC0 top-down assets

- Nguồn tìm kiếm: https://itch.io/game-assets/assets-cc0/tag-top-down
- Chỉ chọn pack ghi rõ CC0 hoặc Public Domain.
- Tránh asset có license `NC`/`ND` nếu muốn kiếm tiền.

## Ưu tiên 3 — OpenGameArt

- Nguồn: https://opengameart.org/
- Lưu ý: OpenGameArt có nhiều license khác nhau, không phải asset nào cũng CC0.
- Nếu dùng asset yêu cầu attribution, thêm tên tác giả + link nguồn vào mô tả video hoặc file `ASSET_CREDITS.md`.

## Tạm thời trong patch này

Patch hiện chưa nhúng trực tiếp asset ngoài để tránh rủi ro license. Thay vào đó app được nâng cấp bằng sprite/vector procedural trong Canvas/Phaser:

- nền đường asphalt có texture;
- vạch lane;
- cổng start/finish dạng checkered;
- tường/barrier có bóng và gradient;
- xe có nhiều kiểu thân hơn: sport, formula, rally, truck, buggy, kart, van, drone.

Khi đã chốt pack tải về, nên thêm một bước import asset thật vào renderer sau.
