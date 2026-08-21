# Hà Giang Loop — Trip Companion App

Web app kế hoạch + trợ lý cho chuyến Hà Giang Loop 4 ngày 3 đêm (04–07/11/2026),
3 người, xe số tự lái. Ban đầu là trang kế hoạch tĩnh, sau bổ sung một lớp app
tương tác dùng chung cho cả nhóm trong lúc đi.

Dùng file này làm ngữ cảnh khi nhờ Claude sửa/thêm tính năng — dán kèm câu hỏi
mới hoặc upload file này trong lần chat sau.

## Mục đích ban đầu của người dùng (giữ nguyên để không lạc hướng)

- Lịch trình 4N3Đ Hà Giang Loop chi tiết theo giờ/địa điểm, tách rõ "đoạn nên
  dừng chụp ảnh" và "đoạn nên tập trung chạy xe".
- Gợi ý chỗ ở, chi phí dự trù, bản đồ tương tác theo từng ngày.
- Nội dung được chắt lọc từ nguồn tiếng Việt cập nhật (VOZ, Facebook group,
  TikTok, các cẩm nang du lịch 2025–2026), không chỉ dịch nguồn tiếng Anh.
- Sau đó bổ sung: chat nhóm có AI soạn đề xuất đổi lịch trình + voting duyệt,
  theo dõi GPS/thời tiết trực tiếp, nhắc check-in chỗ ở theo geofence, sổ chi
  phí tự tính chia tiền, bảng cảnh báo cộng đồng.

## File trong repo

```
index.html          toàn bộ trang: kế hoạch tĩnh + app tương tác (1 file, không build step)
manifest.json        PWA manifest (để "Thêm vào Màn hình chính")
service-worker.js    cache offline cơ bản + relay hiển thị local notification
CONTEXT.md            (file này)
```

Không có build step, không có `package.json`, không có server riêng — đây là
static site thuần, deploy bằng cách kéo cả 3 file kia vào Netlify Drop (hoặc
GitHub Pages / bất kỳ static host nào, miễn là 3 file nằm cùng thư mục gốc).

## Tech stack

- Vanilla HTML/CSS/JS, không framework, không bundler.
- Font: Be Vietnam Pro (chữ chính, hỗ trợ đầy đủ dấu tiếng Việt) + JetBrains
  Mono (số liệu/giờ/giá) — load qua Google Fonts CDN.
- Bản đồ lịch trình: Leaflet.js + OpenStreetMap tiles (miễn phí, không cần key).
- Dữ liệu dùng chung nhóm: Firebase Firestore, SDK compat v10.13.0 load qua
  CDN (`firebase-app-compat.js`, `firebase-firestore-compat.js`).
- AI soạn đề xuất: gọi thẳng Anthropic Messages API từ trình duyệt (model
  `claude-sonnet-5`), dùng header `anthropic-dangerous-direct-browser-access`
  để vượt CORS — **không có server riêng**, key nằm trong `localStorage` trên
  máy người dùng.
- Thời tiết: Open-Meteo API (`api.open-meteo.com`), miễn phí, không cần đăng ký.
- GPS: `navigator.geolocation.watchPosition`, tính khoảng cách bằng công thức
  Haversine (thuần JS, không thư viện).

## Bảng màu / design system

CSS variables khai báo ở `:root` trong `index.html`:
- `--stone` / `--stone-deep`: nền tông xanh rêu nhạt (đổi từ be/kem ban đầu
  theo yêu cầu "xanh và mướt" gợi núi rừng Hà Giang)
- `--indigo`: chàm (văn hoá nhuộm chàm H'Mông)
- `--terracotta`: đất nung/đường đất đỏ
- `--moss` / `--moss-deep` / `--moss-soft`: xanh rêu núi
- `--gold`: vàng ochre
- Có lớp trang trí "dãy núi" SVG ở hero + đường viền núi lặp lại ở đầu mỗi
  section (`section:not(.hero)::before`) để xuyên suốt cảm giác "bị núi bao
  quanh".

## Cấu trúc dữ liệu Firestore

Tất cả nằm dưới `trips/{TRIP_ID}/...`, với `TRIP_ID` hardcode là
`'ha-giang-04-07-11-2026'` trong `<script>` cuối `index.html` (đổi hằng số
này nếu muốn tái dùng app cho chuyến khác).

| Collection | Trường chính | Ghi chú |
|---|---|---|
| `messages` | `text, author, type, timestamp` | `type` = `'chat'` hoặc `'system'` (thông báo hệ thống) |
| `proposals` | `title, day, summary, details, status, votes{name:'yes'|'no'}, createdBy, createdAt` | `status` tự chuyển `'approved'` khi ≥2/3 vote `'yes'` |
| `accommodations` | `day, name, lat, lng, note, addedBy, createdAt` | dùng để tính khoảng cách geofence |
| `expenses` | `payer, amount, note, createdAt` | chia đều tự động theo số người distinct đã từng trả |
| `alerts` | `text, sev('info'|'warn'|'danger'), author, createdAt` | bảng cảnh báo do người dùng tự đăng |

Firestore đang ở **test mode** (ai có `firebaseConfig` cũng đọc/ghi được) —
chấp nhận được vì nhóm 3 người riêng tư, **không phù hợp nếu public rộng**.

## Cấu hình runtime (không hardcode trong code)

Lưu trong `localStorage` của từng trình duyệt, nhập qua drawer cài đặt (icon
⚙️ góc trên bên phải):

| Key | Nội dung |
|---|---|
| `hgl_name` | Tên hiển thị của người dùng |
| `hgl_firebase_cfg` | JSON `firebaseConfig` (apiKey, authDomain, projectId...) |
| `hgl_anthropic_key` | Anthropic API key cá nhân, dùng gọi thẳng từ browser |

Mỗi người trong nhóm tự nhập cấu hình này trên máy mình — không có nơi lưu
tập trung, không có tài khoản/đăng nhập thật.

## Quyết định thiết kế có chủ đích (đọc trước khi "sửa lại cho đúng")

- **Không có backend riêng** — mọi gọi API (Anthropic, Firestore, Open-Meteo)
  đều chạy thẳng từ trình duyệt. Đây là lựa chọn có chủ đích để giữ deploy
  đơn giản (static host), không phải thiếu sót.
- **Push notification chỉ ở mức "local notification"** qua Service Worker —
  hoạt động khi app đang mở hoặc mới chuyển nền, **KHÔNG đánh thức được máy
  khi tắt hẳn app/khoá màn hình lâu**. Muốn push thật 100% cần nâng cấp lên
  Firebase Cloud Messaging + Cloud Function (yêu cầu gói Firebase Blaze, xem
  mục Roadmap).
- **Không tự động đọc Facebook/Instagram** để lấy cảnh báo sạt lở — không có
  công cụ hợp pháp nào làm việc này từ một website. Thay bằng bảng cảnh báo
  crowd-sourced để nhóm tự đăng tin.
- **Pace-tracking (đang nhanh/chậm lịch trình) là heuristic ước lượng** — so
  khoảng cách Haversine tới waypoint gần nhất trong ngày + giờ kế hoạch
  hardcode sẵn, KHÔNG phải định tuyến đường bộ chính xác.
- **AI dùng gọi trực tiếp từ browser bằng API key cá nhân** — không có proxy
  server để giấu key. Chấp nhận được cho công cụ dùng nội bộ nhóm nhỏ.

## Giới hạn đã biết

- Toạ độ waypoint/địa điểm trong `WAYPOINTS` (JS) và các điểm trên bản đồ
  Leaflet là ước lượng gần đúng, không phải đo GPS thực tế tại chỗ.
- Icon PWA trong `manifest.json` là SVG placeholder đơn giản (dãy núi cách
  điệu), chưa có icon thiết kế riêng.
- Chưa có chức năng sửa/xoá tin nhắn, đề xuất, chi phí, cảnh báo đã đăng.
- Chưa test thực tế trên iOS Safari (đặc biệt phần Notification — iOS chỉ hỗ
  trợ push khi đã cài PWA qua "Thêm vào Màn hình chính", iOS ≥16.4).

## Roadmap / có thể làm tiếp

- [ ] Push notification thật (Tier 2): Firebase Cloud Messaging + Cloud
      Function, cần nâng gói Firebase lên Blaze.
- [ ] Firestore security rules chặt hơn thay vì test mode.
- [ ] Cho sửa/xoá các mục đã đăng (tin nhắn, đề xuất, chi phí, cảnh báo).
- [ ] Icon PWA thiết kế riêng thay placeholder.
- [ ] Đổi `TRIP_ID` thành cấu hình được thay vì hardcode, để tái dùng app
      cho chuyến đi khác không cần sửa code.
- [ ] Định tuyến đường bộ thật (OSRM/Google Directions) thay vì heuristic
      khoảng cách thẳng cho phần pace-tracking.

## Lịch sử thay đổi

- **v1** — trang tĩnh kế hoạch 4N3Đ: hero, tổng quan, lịch trình từng ngày,
  bản đồ Leaflet, chi phí dự kiến, lưu ý an toàn.
- **v2** — bổ sung mục "Thực tế 2026" tổng hợp từ VOZ, group Facebook, TikTok,
  cẩm nang du lịch cập nhật tháng 5/2026 (đông khách, giá tăng, an toàn thực
  tế, điểm nên/không nên đi).
- **v3** — đổi bảng màu nền từ be/kem sang tông xanh rêu núi rừng theo yêu
  cầu "xanh và mướt".
- **v4** — thêm lớp trang trí núi (SVG hero + viền núi lặp ở đầu mỗi section)
  và gradient xanh cho nền/card để tăng cảm giác "mướt".
- **v5** — bổ sung Trợ Lý Chuyến Đi: chat nhóm + AI soạn đề xuất (Anthropic
  API) + voting duyệt 2/3, theo dõi GPS/thời tiết trực tiếp (Open-Meteo) với
  cảnh báo pace, sổ chỗ ở đã đặt + nhắc check-in geofence, sổ chi phí tự tính
  chia tiền, bảng cảnh báo cộng đồng. Thêm `manifest.json` +
  `service-worker.js` để cài như PWA.

## Deploy

Kéo **cả 3 file** (`index.html`, `manifest.json`, `service-worker.js`) cùng
lúc vào https://app.netlify.com/drop — không kéo riêng lẻ, vì service worker
và manifest cần nằm cùng thư mục gốc với `index.html` để trình duyệt tìm
thấy đường dẫn tương đối (`./manifest.json`, `./service-worker.js`).

Nếu deploy qua GitHub Pages/Vercel/Firebase Hosting thay vì Netlify: chỉ cần
đảm bảo 3 file nằm ở thư mục gốc (root) được serve, không cần cấu hình build
gì thêm.
