# Hà Giang Loop — Trip Companion App

Web app kế hoạch + trợ lý cho chuyến Hà Giang **04–08/11/2026** (4 ngày chạy xe
+ 4 đêm ở Hà Giang, ngày thứ 5 là ngày ngồi xe khách về sân bay), 3 người, xe
số tự lái. Ban đầu là trang kế hoạch tĩnh, sau bổ sung một lớp app tương tác
dùng chung cho cả nhóm trong lúc đi.

**Khung chuyến (v11):** 03/11 hạ cánh Hà Nội, chơi 1 ngày, tối lên xe khách →
04/11 Hà Giang → Quản Bạ → Yên Minh → **Đồng Văn** → 05/11 vòng quanh Đồng Văn
(Sà Phìn – Lũng Cú – Lô Lô Chải – Ma Lé – Đồn Cao), **ngủ Đồng Văn đêm thứ 2**
→ 06/11 Mã Pí Lèng – thuyền hẻm Tu Sản – ăn trưa Anh Quân Camping – Cafe Mí
Pó, **ngủ Mèo Vạc** → 07/11 Mèo Vạc → Mậu Duệ → Yên Minh → Quản Bạ → **TP Hà
Giang** (trả xe, ngủ lại) → 08/11 sáng ở TP Hà Giang, ~10:00 lên xe khách chạy
thẳng ra **sảnh sân bay Nội Bài**, bay HAN–SGN 21:55.

Dùng file này làm ngữ cảnh khi nhờ Claude sửa/thêm tính năng — dán kèm câu hỏi
mới hoặc upload file này trong lần chat sau.

## Mục đích ban đầu của người dùng (giữ nguyên để không lạc hướng)

- Lịch trình Hà Giang Loop chi tiết theo giờ/địa điểm, tách rõ "đoạn nên
  dừng chụp ảnh" và "đoạn nên tập trung chạy xe". (Ban đầu là 4N3Đ; từ v11
  đổi thành 4 ngày chạy xe / 4 đêm + 1 ngày về sân bay — xem Lịch sử thay đổi.)
- Gợi ý chỗ ở, chi phí dự trù, bản đồ tương tác theo từng ngày.
- Nội dung được chắt lọc từ nguồn tiếng Việt cập nhật (VOZ, Facebook group,
  TikTok, các cẩm nang du lịch 2025–2026), không chỉ dịch nguồn tiếng Anh.
- Sau đó bổ sung: chat nhóm có AI soạn đề xuất đổi lịch trình + voting duyệt,
  theo dõi GPS/thời tiết trực tiếp, nhắc check-in chỗ ở theo geofence, sổ chi
  phí tự tính chia tiền, bảng cảnh báo cộng đồng.

## File trong repo

```
index.html                          toàn bộ trang: kế hoạch tĩnh + app tương tác (1 file, không build step)
manifest.json                       PWA manifest (để "Thêm vào Màn hình chính")
service-worker.js                   cache offline cơ bản + relay hiển thị local notification
netlify.toml                        cấu hình build Netlify (publish dir + functions dir)
netlify/functions/community-news.js Netlify Function kéo tin thật (Google News RSS, lọc 7 ngày) cho tab Cảnh báo
netlify/functions/ai-draft.js       Netlify Function gọi Anthropic API server-side (key dùng chung qua env var)
CONTEXT.md                          (file này)
```

**Quan trọng:** vì có Netlify Function, từ v6 trở đi **phải deploy qua
"Import from Git"** (kết nối repo GitHub) — kéo-thả (Netlify Drop) sẽ KHÔNG
chạy được function, tab "Cảnh báo cộng đồng" sẽ trống (vẫn không lỗi, chỉ là
list tin rỗng, có link nguồn chính thức thay thế).

## Tech stack

- Vanilla HTML/CSS/JS, không framework, không bundler cho frontend.
- Font: Be Vietnam Pro (chữ chính, hỗ trợ đầy đủ dấu tiếng Việt) + JetBrains
  Mono (số liệu/giờ/giá) — load qua Google Fonts CDN.
- Bản đồ lịch trình: Leaflet.js + OpenStreetMap tiles (miễn phí, không cần key).
- Dữ liệu dùng chung nhóm: Firebase Firestore, SDK compat v10.13.0 load qua
  CDN (`firebase-app-compat.js`, `firebase-firestore-compat.js`). **Từ v6,
  config Firebase được bake thẳng vào code** (hằng số `FIREBASE_CONFIG` đầu
  script trong `index.html`) thay vì mỗi người tự nhập — xem mục "Cấu hình
  dùng chung" bên dưới.
- AI soạn đề xuất: **v7 trở đi gọi qua Netlify Function**
  (`netlify/functions/ai-draft.js`) thay vì gọi thẳng từ trình duyệt — key
  Anthropic nằm ở biến môi trường Netlify, dùng chung cho cả nhóm, không lộ
  trong code hay network tab của trình duyệt. Model dùng: `claude-sonnet-5`.
- Thời tiết: Open-Meteo API (`api.open-meteo.com`), miễn phí, không cần đăng ký.
- Tin tức cộng đồng: Netlify Function (`netlify/functions/community-news.js`,
  Node, không cần npm dependency) fetch Google News RSS với toán tử
  `when:7d` lọc theo khoá liên quan Hà Giang, **lọc lại lần 2 phía server
  theo `pubDate` (loại tin quá 7 ngày)** để chắc chắn không lọt tin cũ, parse
  XML bằng regex thuần, trả JSON cho frontend poll mỗi 15 phút. Chạy
  server-side để tránh CORS (RSS không cho phép fetch thẳng từ trình duyệt).
- GPS: `navigator.geolocation.watchPosition`, tính khoảng cách bằng công thức
  Haversine (thuần JS, không thư viện).

## Cấu hình dùng chung (bake vào code hoặc env var, KHÔNG còn nhập qua UI)

Từ v6, Firebase config **không còn nhập qua drawer cài đặt** — người tổ chức
chuyến đi điền trực tiếp vào hằng số `FIREBASE_CONFIG` ở đầu khối
`<script>` cuối `index.html` (tìm comment "CẤU HÌNH DÙNG CHUNG CHO CẢ
NHÓM"), commit vào code, rồi deploy. Bất kỳ ai mở link đã deploy sẽ tự động
kết nối cùng một Firestore — không cần tự cấu hình gì để **xem** chat/chỗ
ở/chi phí.

Lý do đổi cách này: Firebase client config (apiKey, projectId...) **không
phải bí mật** — an toàn khi để lộ trong code công khai, vì bảo mật thật sự
nằm ở Firestore Security Rules chứ không phải ở việc giấu config. Bake sẵn
giúp UX đơn giản hơn nhiều so với việc từng người phải copy-paste JSON.

**Từ v7, Anthropic API key CŨNG chuyển sang dùng chung — nhưng khác cách
với Firebase.** Key Anthropic **KHÔNG bake vào code** (vì đó là bí mật thật
sự, lộ ra là ai cũng xài ké/rút tiền được), mà đặt làm **biến môi trường
trên Netlify** (`ANTHROPIC_API_KEY`), chỉ Netlify Function
`netlify/functions/ai-draft.js` đọc được, không nằm trong HTML/JS gửi về
trình duyệt. Cách cấu hình (làm 1 lần, người tổ chức chuyến đi):

1. Netlify dashboard → chọn site → **Site configuration → Environment
   variables → Add a variable**
2. Key: `ANTHROPIC_API_KEY`, Value: `sk-ant-...` (key thật từ
   console.anthropic.com) → Save
3. **Deploys → Trigger deploy** (bắt buộc, để function đọc được biến mới —
   biến môi trường chỉ được nạp lúc build/deploy, không tự áp dụng ngay)

Sau bước này, **ai trong nhóm bấm "Nhờ AI soạn đề xuất" cũng dùng chung 1
key** mà không ai nhìn thấy key đó — kể cả người tổ chức cũng không cần dán
key vào máy cá nhân sau bước cấu hình ban đầu.

Riêng mục sau **vẫn lưu trong `localStorage`, riêng từng máy** (đúng vì mỗi
người khác nhau):

| Key | Nội dung |
|---|---|
| `hgl_name` | Tên hiển thị của người dùng (dùng cho chat/vote) |

## Cấu trúc dữ liệu Firestore

Tất cả nằm dưới `trips/{TRIP_ID}/...`, với `TRIP_ID` hardcode là
`'ha-giang-04-07-11-2026'` trong `<script>` cuối `index.html` (đổi hằng số
này nếu muốn tái dùng app cho chuyến khác).

| Collection | Trường chính | Ghi chú |
|---|---|---|
| `messages` | `text, author, type, timestamp` | `type` = `'chat'` hoặc `'system'` (thông báo hệ thống) |
| `proposals` | `title, day, summary, details, status, votes{name:'yes'|'no'}, createdBy, createdAt` | `status` tự chuyển `'approved'` khi ≥2/3 vote `'yes'` |
| `accommodations` | `day, name, lat, lng, note, addedBy, createdAt` | dùng để tính khoảng cách geofence |
| `expenses` | `payer, amount, note, createdAt` | public, có sort (mới nhất/số tiền/theo người), tự tính tổng + chia tiền |

**Đã bỏ** collection `alerts` (v5) — thay bằng tin tức tự động (không lưu
Firestore, gọi trực tiếp Netlify Function mỗi lần tải tab, không có lịch sử
lưu trữ).

Firestore đang ở **test mode** (ai có `firebaseConfig` cũng đọc/ghi được) —
chấp nhận được vì nhóm nhỏ riêng tư, **không phù hợp nếu public rộng**.

## Tab "Cảnh báo cộng đồng" — đổi từ v5 sang v6

- **v5 (cũ):** form để nhóm tự đăng cảnh báo, lưu Firestore collection `alerts`.
- **v6 (hiện tại):** **tự động kéo tin** từ Google News RSS (lọc "Hà Giang" +
  sạt lở/mưa lũ/giao thông/thời tiết) qua Netlify Function, hiển thị dạng
  card link ra bài báo gốc, tự refresh mỗi 15 phút. Không còn form đăng thủ
  công. Kèm link tới 2 nguồn chính thức của Trung tâm Dự báo KTTV Quốc gia:
  - `kttv.gov.vn` — trang "Thời tiết nguy hiểm" (bão, mưa lớn, thiên tai)
  - `luquetsatlo.nchmf.gov.vn` — hệ thống cảnh báo lũ quét/sạt lở thời gian
    thực, cập nhật mỗi 1 giờ, chi tiết đến cấp xã
- Không tự động đọc được Facebook/Instagram — không có công cụ hợp pháp nào
  cho một website làm việc này. Google News là nguồn tổng hợp báo chí công
  khai, ổn định, không cần API key, gần nhất với yêu cầu "pull tin từ cộng
  đồng" mà không phải tự đăng thủ công.

## Tab "Chi phí" — public thật, có sort (v6)

- Không cần cấu hình gì để xem — dùng chung `FIREBASE_CONFIG` bake sẵn.
- Form nhập chi phí không gắn với identity (`cfg.name`) — ai cũng gõ tên
  trực tiếp vào ô "Ai trả", không cần đặt tên trong ⚙️ trước.
- Có 4 nút sort: Mới nhất / Số tiền cao→thấp / Số tiền thấp→cao / Theo
  người (A→Z) — sort client-side trên dữ liệu đã tải, không query lại
  Firestore.
- Tự tính: tổng chi phí, số tiền từng người đã trả, và gợi ý "ai cần chuyển
  bao nhiêu cho ai" (thuật toán greedy settlement đơn giản, giả định chia
  đều theo số người đã từng trả ít nhất 1 khoản).

## Quyết định thiết kế có chủ đích (đọc trước khi "sửa lại cho đúng")

- **Không có backend riêng cho phần app** (ngoại trừ 1 Netlify Function nhỏ
  cho tin tức) — mọi gọi API khác (Anthropic, Firestore, Open-Meteo) đều
  chạy thẳng từ trình duyệt. Có chủ đích để giữ deploy đơn giản.
- **Push notification chỉ ở mức "local notification"** qua Service Worker —
  hoạt động khi app đang mở hoặc mới chuyển nền, **KHÔNG đánh thức được máy
  khi tắt hẳn app/khoá màn hình lâu**. Muốn push thật 100% cần nâng cấp lên
  Firebase Cloud Messaging + Cloud Function (yêu cầu gói Firebase Blaze, xem
  mục Roadmap).
- **Tin tức cộng đồng là pull, không phải push từ nhóm** — đây là thay đổi
  có chủ đích theo yêu cầu người dùng, khác với thiết kế v5 ban đầu.
- **Link bản đồ ưu tiên TOẠ ĐỘ hơn tên địa danh** (từ v12) — có chủ đích, đổi
  ngược lại quyết định của v10. Tên đẹp hơn khi hiển thị nhưng có thể khớp nhầm
  sang tỉnh khác (xem v12 trong lịch sử thay đổi); toạ độ sai lệch tối đa 1–2km
  trên đúng con đường đó, tức hỏng nhẹ thay vì hỏng nặng. Đừng "sửa lại cho
  đẹp" bằng cách đổi ngược về tên.
- **Link bản đồ dùng "universal link" của Google Maps
  (`https://www.google.com/maps/...?api=1&...`), không dùng URL scheme riêng
  (`comgooglemaps://`, `geo:`)** — có chủ đích: universal link tự mở app
  Google Maps trên Android/iOS nếu đã cài, và fallback sang web nếu chưa,
  trong khi scheme riêng sẽ báo lỗi trắng trang khi máy không có app. Link
  "Chỉ đường" cố tình **bỏ trống tham số `origin`** để Google Maps lấy vị trí
  hiện tại của điện thoại làm điểm xuất phát.
- **Pace-tracking (đang nhanh/chậm lịch trình) là heuristic ước lượng** — so
  khoảng cách Haversine tới waypoint gần nhất trong ngày + giờ kế hoạch
  hardcode sẵn, KHÔNG phải định tuyến đường bộ chính xác.
- **AI dùng gọi trực tiếp từ browser bằng API key cá nhân** — không có proxy
  server để giấu key. Chấp nhận được cho công cụ dùng nội bộ nhóm nhỏ.

## Giới hạn đã biết

- Toạ độ waypoint/địa điểm trong `WAYPOINTS` (JS) và các điểm trên bản đồ
  Leaflet là ước lượng gần đúng, không phải đo GPS thực tế tại chỗ. **Từ v10,
  các link Google Maps KHÔNG dùng toạ độ này** mà dùng trường `q` (tên địa
  danh) trong mảng `stops`, để Google tự resolve đúng POI thật — toạ độ chỉ
  còn dùng để vẽ marker/polyline trên Leaflet và tính geofence.
- Thời gian di chuyển từng chặng trong lịch trình v10 được ước lượng theo tốc
  độ trung bình 25–32 km/h (xe số, đường đèo, có chở đồ) chứ không phải lấy từ
  API định tuyến — nên coi là ước lượng thận trọng, không phải con số đo được.
- Giờ mặt trời mọc/lặn 04–08/11/2026 hiển thị trong khung `.daylight` là **giá
  trị tính sẵn và hardcode vào HTML** (thuật toán NOAA, theo toạ độ từng điểm
  nghỉ), không gọi API. Nếu đổi ngày đi thì phải tính lại thủ công.
- **Hai thông tin trong v11 chưa xác minh được, đã ghi cảnh báo ngay trong UI:**
  (1) *thời gian đi bộ lên Cafe Mí Pó* — không nguồn nào ghi rõ, trang đang để
  ước lượng 30 phút/chiều và yêu cầu nhóm gọi hotline quán (0961 152 555) hỏi
  trước; (2) *khung giờ chiều Hà Giang → Hà Nội của nhà xe Bằng Phấn* — mỗi
  trang tổng hợp vé ghi một bảng giờ khác nhau (09:00/09:30/11:30/13:30/16:00
  ở nguồn này, 11:30/14:00/22:00 ở nguồn kia), nên trang chỉ khẳng định phần
  chắc chắn (toàn tuyến Hà Giang → Nội Bài chạy 06:30–22:30, có trả khách tận
  sảnh sân bay) và yêu cầu gọi hotline xác nhận.
- Toạ độ Anh Quân Camping, Coffee Mí Pó, Lô Lô Chải, Ma Lé, Đồn Cao trong
  `stops`/`WAYPOINTS` là **ước lượng để vẽ marker**, không phải toạ độ đo
  thật — link Google Maps của các điểm này dùng trường `q` (tên địa danh).
- Icon PWA trong `manifest.json` là SVG placeholder đơn giản (dãy núi cách
  điệu), chưa có icon thiết kế riêng.
- Chưa có chức năng sửa/xoá tin nhắn, đề xuất, chi phí đã đăng.
- Netlify Function `community-news.js` phụ thuộc Google News RSS còn hoạt
  động đúng cấu trúc XML hiện tại — nếu Google đổi format, parser regex
  thuần có thể cần cập nhật (không có test tự động cho việc này).
- Danh sách "Cứu hộ xe máy dọc đường" (24 số điện thoại) lấy từ một bài
  đăng Facebook do người dùng cung cấp, **chưa được xác minh độc lập** —
  không có cách nào kiểm tra hàng loạt số điện thoại còn hoạt động hay
  đúng hay không. Nếu về sau phát hiện số nào sai/đã đổi chủ, nên sửa/xoá
  trực tiếp trong `index.html` (tìm section `id="luuy"`, khối
  `.rescue-grid`).
- Chưa test thực tế trên iOS Safari (đặc biệt phần Notification — iOS chỉ hỗ
  trợ push khi đã cài PWA qua "Thêm vào Màn hình chính", iOS ≥16.4).

## Roadmap / có thể làm tiếp

- [ ] Push notification thật (Tier 2): Firebase Cloud Messaging + Cloud
      Function, cần nâng gói Firebase lên Blaze.
- [ ] Firestore security rules chặt hơn thay vì test mode.
- [ ] Cho sửa/xoá các mục đã đăng (tin nhắn, đề xuất, chi phí).
- [ ] Icon PWA thiết kế riêng thay placeholder.
- [ ] Đổi `TRIP_ID` thành cấu hình được thay vì hardcode, để tái dùng app
      cho chuyến đi khác không cần sửa code.
- [ ] Định tuyến đường bộ thật (OSRM/Google Directions) thay vì heuristic
      khoảng cách thẳng cho phần pace-tracking.
- [ ] Thêm nguồn tin thứ 2 cho Netlify Function (VD: RSS chính thức của
      kttv.gov.vn nếu tìm được endpoint máy-đọc-được ổn định) để đỡ phụ
      thuộc hoàn toàn vào Google News.
- [ ] Rate-limit hoặc giới hạn số lần gọi `ai-draft` mỗi ngày/mỗi người để
      tránh spam vô tình đội chi phí Anthropic (hiện chưa có giới hạn nào
      ngoài việc key chỉ ai trong nhóm biết link mới gọi được).

## Lịch sử thay đổi

- **v1** — trang tĩnh kế hoạch 4N3Đ: hero, tổng quan, lịch trình từng ngày,
  bản đồ Leaflet, chi phí dự kiến, lưu ý an toàn.
- **v2** — bổ sung mục "Thực tế 2026" tổng hợp từ VOZ, group Facebook, TikTok,
  cẩm nang du lịch cập nhật tháng 5/2026.
- **v3** — đổi bảng màu nền từ be/kem sang tông xanh rêu núi rừng.
- **v4** — thêm lớp trang trí núi (SVG hero + viền núi lặp ở đầu mỗi section)
  và gradient xanh cho nền/card.
- **v5** — bổ sung Trợ Lý Chuyến Đi: chat + AI soạn đề xuất (Anthropic API) +
  voting 2/3, GPS/thời tiết trực tiếp, sổ chỗ ở + geofence, sổ chi phí, bảng
  cảnh báo tự đăng thủ công. Thêm `manifest.json` + `service-worker.js`.
- **v6** — Firebase config bake sẵn vào code (bỏ yêu cầu mỗi
  người tự cấu hình, chi phí giờ public thật); thêm sort cho sổ chi phí;
  thay bảng cảnh báo tự đăng bằng tin tức tự động kéo từ Google News RSS
  qua Netlify Function + link nguồn chính thức KTTV; thêm `netlify.toml` +
  `netlify/functions/community-news.js`.
- **v7** — Đổi Anthropic API key sang biến môi trường Netlify
  dùng chung cho cả nhóm (không bake vào code như Firebase, vì đây là bí
  mật thật sự) qua Netlify Function mới `netlify/functions/ai-draft.js`; bỏ
  hẳn ô nhập API key trong drawer cài đặt — giờ chỉ còn "Tên của bạn". Tin
  tức cộng đồng lọc chỉ còn 7 ngày gần nhất (`when:7d` + lọc lại theo
  `pubDate` phía server). Review lại toàn bộ bảng chi phí: nâng lên mức
  thoải mái hơn (mỗi người 1 xe riêng, ăn/ở theo giá 2026, thêm 2 ngày Hà
  Nội) — từ ≈3,0–3,5tr/người (chỉ phần loop) lên ≈4,7–5,5tr/người (trọn
  chuyến 6 ngày), có ghi chú phương án tiết kiệm hơn (chia 2 xe) trong box
  riêng.
- **v8** — Thêm side-card "Quán ăn & điểm dừng chân" cho cả 4
  ngày, với tên quán/địa chỉ/món cụ thể (Bánh cuốn Bà Hà, Quán Bà Tú Lan,
  Nhà Hàng Thắng Cố A Páo, Hạ Thành Quán, Cafe A Páo, Heaven Gate Coffee,
  Café Núi Cấm, Cá Sông Lô, Nhà hàng Phúc Cái...) tổng hợp từ nhiều nguồn
  review 2025–2026. Ghi chú đặc biệt về Mã Pí Lèng Panorama đang bị yêu cầu
  tháo dỡ phần ban công nhô ra sông (vi phạm xây dựng cũ) — vẫn mở cửa như
  điểm ngắm cảnh nhưng diện mạo khác ảnh cũ, không còn dịch vụ lưu trú.
  Thêm tip-card tổng hợp 7 đặc sản nên thử trong mục Lưu ý.
- **v9** (hiện tại) — Thêm section "Cứu hộ xe máy dọc đường": 24 số điện
  thoại tiệm sửa xe theo 5 huyện (Quản Bạ, Yên Minh, Đồng Văn, Lũng Cú, Mèo
  Vạc), dùng link `tel:` để bấm gọi trực tiếp trên điện thoại. Nguồn: người
  dùng cung cấp từ một bài đăng Facebook — **chưa được trang tự xác minh
  từng số còn hoạt động hay chính xác**, có ghi chú rõ trong UI và khuyến
  nghị phương án dự phòng (gọi homestay gần nhất, 113/115).

- **v10** — **Rà soát lại toàn bộ giờ giấc lịch trình theo yêu cầu
  "đảm bảo hợp lý, có thời gian chụp ảnh/ăn/nghỉ, nhận phòng trước trời tối".**
  Sửa 5 lỗi thực địa của v9: (1) chặng TP Hà Giang → Cổng Trời Quản Bạ ghi 45
  phút cho 43km đường đèo → sửa thành 1h30; (2) Cán Tỷ bị xếp sau Yên Minh
  trong khi nằm ở Quản Bạ, trước Yên Minh trên QL4C → đảo lại thứ tự (cả
  timeline, `stops`, `routes`, `WAYPOINTS`); (3) ngày 2 chỉ chừa 15 phút cho
  đoạn Panorama → bến thuyền Tà Làng (thực tế 30 phút dốc bê tông hẹp), khiến
  nhận phòng Mèo Vạc rơi vào 17:00 = đúng giờ mặt trời lặn → dời ăn trưa lên
  10:55 tại Đồng Văn và nhận phòng 15:50; (4) ngày 3 xếp Khâu Vai rồi nối
  thẳng sang cung Mậu Duệ, nhưng từ Mèo Vạc đó là hai hướng ngược nhau, phải
  quay đầu 22km → bỏ Khâu Vai khỏi lịch chính, chuyển thành side-card "tuỳ
  chọn" có ghi rõ cái giá (+45km, +2h15); (5) ngày 4 ghi 95km/3h30 trong khi
  cung Du Già – Minh Ngọc – TP Hà Giang chỉ ~73km → về tới nơi 11:00 thay vì
  13:00. Bổ sung dốc Thẩm Mã (điểm nổi tiếng nằm ngay trên đường mà v9 bỏ
  sót). Mỗi mốc dừng nay ghi rõ **dừng bao lâu và làm gì trong khoảng đó**.
  Thêm khung `.daylight` đầu mỗi ngày (giờ mặt trời lặn, giờ tối hẳn, giờ
  nhận phòng theo kế hoạch, quỹ dự phòng còn lại) và tip-card "Quy tắc giờ
  giấc" với 3 mốc cứng 15:00 / 16:30 / 17:00.
  **Deep link Google Maps:** popup Leaflet có 2 nút "Mở Google Maps" / "Chỉ
  đường", mỗi mốc lịch trình có nút "📍 Mở Google Maps", và mỗi ngày có nút
  "🧭 Chỉ đường cả ngày" (multi-waypoint) — tất cả mở thẳng app trên điện
  thoại. Cập nhật giá vé thuyền sông Nho Quế 2026 (≈120.000đ/người trọn gói,
  không phải 150–250k) → tổng chi phí giảm còn ≈13,8tr/3 người. Thêm 3 tip-card
  "Thực tế 2026": rà soát giờ giấc, mùa sương mù tháng 11–2, tin sạt lở QL4C
  8/2026 + siết quản lý tour xe máy 4/2026.

- **v11** (hiện tại) — **Đổi cấu trúc chuyến theo yêu cầu của nhóm** (tin nhắn
  của bạn cùng đi): (a) ở **Đồng Văn 2 đêm** để có nguyên một ngày đi các điểm
  quanh Đồng Văn; (b) tách riêng một ngày cho **Mã Pí Lèng – thuyền hẻm Tu Sản
  – ăn trưa Anh Quân Camping – Cafe Mí Pó** (quán trên đỉnh núi phải đi bộ lên,
  bạn trong nhóm chỉ đích danh muốn đi); (c) **ngày cuối không quay về Hà Nội
  chơi nữa** — ngủ lại TP Hà Giang đêm 07/11, sáng 08/11 mới bắt xe khách về
  thẳng sảnh sân bay Nội Bài.

  **Ràng buộc buộc phải cắt gì đó:** Hà Giang chỉ có 4 đêm (04→07/11), thêm 2
  chỗ nghỉ mới thì phải bỏ 1 → **bỏ hẳn Du Già** (cả đêm nghỉ lẫn thác Du Già).
  Ngày 4 vì vậy đi **DT176 + QL4C** (Mèo Vạc → Mậu Duệ → Yên Minh → Quản Bạ →
  TP Hà Giang, 156km, ~6h05 chạy, đường tốt) thay cho cung Du Già – Minh Ngọc
  (153km nhưng ~7h chạy vì 55km đường xấu). Phương án đi xuyên Du Già vẫn được
  giữ lại dưới dạng side-card "tuỳ chọn" có ghi rõ cái giá, giống cách v10 xử
  lý Khâu Vai. (Ghi chú: "đi xuyên Du Già trong một ngày" khác hẳn "ngủ lại Du
  Già một đêm + đi thác buổi chiều" của v10 — nên khuyến nghị là bỏ hẳn.)

  **Thay đổi kỹ thuật:** thêm hẳn `section#ngay5` (ngày ngồi xe khách) + mục
  nav thứ 5, dùng màu `--pink` cho ngày 5; viết lại toàn bộ `stops`, `routes`,
  `dayRoutes`, `WAYPOINTS` (ngày 2 giờ là **vòng tròn khép kín** Đồng Văn →
  Sà Phìn → Lũng Cú → Lô Lô Chải → Ma Lé → Đồng Văn, ngày 3 có nhánh đi–về
  bằng thuyền tới Anh Quân Camping); thêm điểm mới **Lô Lô Chải, Ma Lé, Đồn
  Cao, Anh Quân Camping, Coffee Mí Pó**; bản đồ vẫn chỉ vẽ 4 ngày chạy xe
  (ngày 5 không có cung đường xe máy). `CACHE_NAME` trong `service-worker.js`
  nâng lên `hgloop-v11` để máy đã cài PWA không kẹt bản cũ. Prompt hệ thống
  trong `netlify/functions/ai-draft.js` được cập nhật để AI biết lịch trình mới.

  **Trả lời câu hỏi "kiểm tra vị trí mấy nhà trọ so với điểm tham quan":** đã
  thêm note-box đo khoảng cách trong side-card chỗ ở của cả 3 nơi — Đồng Văn
  (4 lựa chọn đều trong phố cổ, chênh nhau vài trăm mét, nên chọn theo giá chứ
  không theo vị trí), Mèo Vạc (Pả Vi cách trung tâm ~4km về phía Mã Pí Lèng —
  tới sớm hơn ~10 phút nhưng tối phải chạy xe ra thị trấn ăn; khuyến nghị ở
  trung tâm vì ngày 3 về khá sát giờ) và TP Hà Giang (ưu tiên khu Nguyễn Trãi
  / Trần Phú / Quang Trung vì đó là các phố nhà xe đi Nội Bài đón tận nơi).

  **Chi phí:** tăng từ ≈13,8tr lên **≈16,1tr/3 người** (≈5,2–6,0tr/người) —
  +900k thêm 1 đêm phòng, +450k bữa trưa camping, +420k thêm nửa ngày ăn ở Hà
  Giang, +300k cà phê Mí Pó/Lô Lô Chải, +270k vé và dự phòng. Bảng chi phí có
  ghi rõ từng khoản chênh lệch.

- **v12** (hiện tại) — **Sửa lỗi dẫn đường Google Maps nghiêm trọng.** Waypoint
  `'Làng cổ Ma Lé'` của ngày 2 bị Google geocoder khớp nhầm sang **"Khu di tích
  Láng Le Bàu Cò", Bình Chánh, TP.HCM** → tuyến ngày 2 vẽ vòng về Sài Gòn, 66
  giờ lái. Nguyên nhân: địa danh nhỏ không có POI khớp gần tuyến nên Google
  fallback sang khớp mờ toàn quốc. **Quy tắc mới (bắt buộc giữ khi sửa sau
  này):** chỉ dùng TÊN cho địa danh lớn Google chắc chắn resolve đúng (thị
  trấn, cột cờ, dinh thự, đèo nổi tiếng) và **luôn kèm ", Tuyên Quang"**; mọi
  điểm nhỏ/mơ hồ (bến thuyền, quán cà phê, làng, dốc, camping) dùng **TOẠ ĐỘ**
  vì toạ độ không bao giờ khớp nhầm sang tỉnh khác. Các hằng số tên nằm trong
  object `GEO` đầu khối script bản đồ. Thêm hàm `checkCoords()` chạy lúc tải
  trang, cảnh báo console nếu có toạ độ rơi ngoài khung bao Hà Giang
  (22.6–23.5N, 104.7–105.7E) để lỗi kiểu này không tái diễn âm thầm.
  **Header:** `.navrow` trước đây `justify-content:space-between` mà
  `.brandmark` không `nowrap`, nên với 11 mục nav thì brandmark xuống 2 dòng và
  nút ⚙️ đè lên nav ở ~1365px. Sửa: brandmark `white-space:nowrap; flex:0 0
  auto`, nav `flex:1 1 auto; min-width:0` + tự cuộn ngang có mask mờ, thêm
  breakpoint 1180px/1024px, rút nhãn "Thực tế 2026"→"Thực tế" và "Trợ Lý Chuyến
  Đi"→"Trợ lý".
  **Nội dung:** ngày 3 quỹ dự phòng từ 50 phút → 1h20 (cắt Panorama 30→15 phút,
  dồn cả chuỗi sớm 30 phút, giữ nguyên 1h40 ở Mí Pó); thêm số nhà thuyền bến Tà
  Làng (nút thắt thật sự của ngày 3, bản trước thiếu); cảnh báo giờ xe chiều VỀ
  của Bằng Phấn (11:30/14:00/22:00 — không có chuyến 10:00 như lịch giả định);
  thêm side-card vé phổ thông/check-in online/hành lý cho ngày 5; Lô Lô Chải
  được UN Tourism vinh danh 17/10/2025.

- **v14** (hiện tại) — **Đo lại quãng đường bằng Google Maps: các bản trước ghi
  thiếu 15–35%.** Người dùng phát hiện tuyến Google vẽ dài hơn lịch trình nhiều.
  Kiểm chứng cho thấy **hai lỗi cùng tồn tại**, không phải một:
  1. *Toạ độ sai*: Cán Tỷ lệch **13,3 km**, Yên Minh **11,2 km**, Sủng Là
     **8,4 km** so với vị trí thật (người dùng lấy bằng chuột phải trên Google
     Maps). Toạ độ lệch khỏi QL4C khiến Google vẽ vòng, phồng thêm quãng đường.
  2. *Quãng đường trong lịch trình vốn đã ghi thiếu*: sau khi loại hết waypoint
     hỏng, số thật vẫn là ngày 1 **~180 km** (ghi 150), ngày 2 **~80 km** (ghi
     58), ngày 4 **~175 km** (ghi 156). Nguyên nhân gốc: **hệ số ngoằn ngoèo
     của QL4C là 2,17×** (đường bộ / đường chim bay), cao hơn hẳn mức 1,4–1,8×
     của đường đèo thông thường — mọi ước tính theo cảm quan đều thấp.
     *Bài học: đừng dùng 1,4–1,8× cho vùng này.*
  Ngày 1 đã dựng lại giờ giấc theo 180 km: chạy 6h15 (cũ 4h45), tới Đồng Văn
  15:35 thay vì 15:10, dự phòng còn 1h45. Ngày 4 giữ nguyên giờ vì quỹ thời
  gian cũ (6h05) vốn đã rộng hơn số Google đo (4h54).
  **Dẫn đường:** dùng toạ độ ĐÃ XÁC MINH cho 3 điểm hay hỏng, tên cho các địa
  danh đã chứng minh resolve đúng, và **bỏ hẳn waypoint không cần thiết** —
  ngày 3 trước đó thêm "Pải Lủng" làm Google snap sang "Mã Lủ" và phồng lên
  98,5 km, trong khi Đồng Văn → Mèo Vạc chỉ có độc nhất QL4C qua Mã Pí Lèng
  nên không cần waypoint nào.
- **v15** (hiện tại) — Người dùng đo thêm 3 toạ độ: Cổng Trời Quản Bạ
  `23.049602,104.992615`, Phố cổ Đồng Văn `23.280154,105.359912`, chợ TT Mèo
  Vạc `23.163830,105.408983`. **Tổng cộng 6 điểm mốc nay đã đo thật.** Dốc
  Thẩm Mã được **nội suy** ở 55% đoạn Yên Minh → Sủng Là (`23.187570,105.188652`)
  vì giá trị cũ `23.1897,105.2872` nằm phía đông Sủng Là, tức sai thứ tự trên
  tuyến — gần như chắc chắn là lỗi kinh độ; đã ghi rõ đây là số nội suy, chưa đo.
  **Kiểm chéo quan trọng:** tính quãng đường ngày 1 từ 6 toạ độ thật cho ra
  **178 km**, Google đo thẳng được **180 km** — lệch dưới 1%, xác nhận con số
  180 km dùng để lập kế hoạch là đúng, và hệ số ngoằn ngoèo QL4C là **2,22×**.
  Kinh độ dọc tuyến giờ tăng đơn điệu từ Hà Giang (104,9784) tới Đồng Văn
  (105,3599) — thứ tự địa lý đã nhất quán, trước đây thì không.
  **Toạ độ vẫn chưa đo:** TP Hà Giang, Mậu Duệ, Sà Phìn, Lũng Cú, Lô Lô Chải,
  Ma Lé, Đồn Cao, Mã Pí Lèng, bến thuyền Tà Làng, Anh Quân Camping, Mí Pó, dốc
  chữ M, Minh Ngọc — nguồn gốc từng toạ độ đã ghi thành comment ngay trên mảng
  `stops` trong `index.html`.

- **v16** (hiện tại) — **Tách bạch hai việc trước đây bị lẫn: ghim điểm đến và
  waypoint dẫn đường.** Hai việc này cần dữ liệu khác nhau:
  - *Waypoint dẫn đường* chỉ cần ghim đúng **con đường** → toạ độ đã đo là tốt nhất.
  - *Ghim điểm đến* phải rơi đúng **địa điểm** → tên POI của Google là tốt nhất,
    vì toạ độ đo được thường chỉ là một điểm trên mặt đường gần đó.
  Sửa 5 ghim từng dẫn sai chỗ: **Nhà của Pao** (toạ độ cũ rơi vào "Trụ sở thôn
  Sủng Là dưới", nay trỏ "Làng văn hóa du lịch Lũng Cẩm"); **Mã Pì Lèng
  Panorama** (trước trỏ vào cả con đèo dài 20km); **bến thuyền Nho Quế** (nay
  dùng đúng tên POI "Lối xuống bến thuyền đi sông Nho Quế"); **Hẻm Tu Sản**
  (nằm giữa sông, không chạy xe tới được → trỏ về bến); **Dốc Thẩm Mã** (bỏ
  huyện vì POI nằm giáp ranh Yên Minh/Đồng Văn).
  Thêm section `#kiemtra`: danh sách **25 điểm đến** kèm link Maps, nhãn độ tin
  cậy (đã thấy là POI trên ảnh Maps của người dùng / toạ độ đã đo / cần kiểm),
  checkbox lưu `localStorage` key `hgl_verified` và thanh tiến độ. Lý do tồn
  tại: **trang này không tự kiểm chứng được link bản đồ** — mọi geocoder
  (Nominatim, Photon, Overpass, Wikidata, GeoNames) đều bị chặn bởi network
  policy, nên cách duy nhất để chắc chắn là người dùng bấm thử một lượt trên
  điện thoại sẽ mang đi.
  *Lưu ý cho lần sửa sau:* Dốc Thẩm Mã trong `stops` vẫn là toạ độ **nội suy**
  dùng để vẽ đường; ghim điểm đến của nó đã chuyển sang tên POI nên không ảnh
  hưởng việc dẫn đường.

- **v17** (hiện tại) — **Ba phương án A/B/C cho nhóm chọn, trên cùng một trang.**
  | | Tên | Bốn đêm | Đặc trưng |
  |---|---|---|---|
  | A | Thong thả | Đồng Văn ×2 · Mèo Vạc · TP Hà Giang | Bản cũ. Có ngày nghỉ, thuyền + camping + Mí Pó. Bỏ Du Già |
  | B | Trọn vòng | Đồng Văn · Mèo Vạc · Du Già · TP Hà Giang | Có Du Già. Ngày 2 dồn Lũng Cú + Mã Pí Lèng + thuyền |
  | C | Trọn vòng + Hà Nội | Đồng Văn · Mèo Vạc · Du Già · xe khách đêm | Cung y hệt B, tối T7 lên xe, CN chơi Hà Nội |

  **Cơ chế `data-plan` — đọc kỹ trước khi sửa:** thuộc tính `data-plan="A B C"`
  (danh sách, cách nhau bởi dấu cách) gắn được lên **bất kỳ phần tử nào**, không
  riêng `<section>`. Hàm `applyPlan()` ẩn/hiện bằng thuộc tính `hidden`. Chính nhờ
  vậy mà ngày 4 của B và C **dùng chung** toàn bộ phần chạy xe, chỉ tách 4 mốc
  buổi tối — không nhân bản nội dung. Tương tự: `#ngay1` dùng chung cho cả 3
  phương án, `#ngay5` dùng chung cho A và B, nhãn trong SVG hero cũng đổi theo
  plan. **Đừng tách thành nhiều file HTML** — đó là phương án đã cân nhắc và loại
  vì phải copy Lưu ý / Cứu hộ / Thực tế 2026 ra 3 nơi.
  Lựa chọn lưu ở `localStorage` key `hgl_plan`, đồng bộ với tham số `?plan=` trên
  URL (ưu tiên URL → localStorage → mặc định A) nên gửi link là người khác mở
  đúng phương án. Sự kiện `planchange` được phát ra để bản đồ và danh sách kiểm
  tra tự nạp lại.
  Bản đồ: `PLAN_A` / `PLAN_B` với `PLANS.C = PLAN_B` (cùng cung). Nút `.map-btn`
  sinh động từ `PLANS[currentPlan].labels`. Danh sách kiểm tra lọc theo plan,
  tổng số đếm theo hàng đang hiện (`#vfTotal`), tiêu đề nhóm ngày tự ẩn khi
  không còn hàng nào.
  **CẢNH BÁO:** quãng đường ngày 2–3–4 của B/C **chưa được đo**, đang gắn nhãn
  `.unmeasured` trên giao diện. Hệ số 2,22× của QL4C **không dùng được** cho cung
  Mậu Duệ – Du Già vì khác loại đường. Phải bấm nút "Chỉ đường cả ngày" đo lại
  rồi mới bỏ nhãn.

- **v18** (hiện tại) — **Sửa 4 lỗi nhất quán của v17, cộng 2 lỗi cấu trúc HTML
  đã âm thầm tồn tại từ v12.**

  *Lỗi nội dung do dùng chung section:*
  1. `#ngay1` (`data-plan="A B C"`) khẳng định **"đặt 2 đêm"** ở 4 chỗ, trong khi
     B/C chỉ ngủ Đồng Văn 1 đêm — ai chọn B/C mà làm theo sẽ đặt thừa một đêm
     phòng. Cùng loại lỗi còn ở **hero subtitle** và mục **ĐẶT CHỖ** trong
     `#luuy`. Đã tách bằng `<span data-plan="...">`.
  2. Phương án C không thấy 2 thẻ **đúng với cả ba** (check-in online, checklist
     trước khi rời Hà Giang) vì chúng kẹt trong `#ngay5` (`A B`). Đã chuyển
     thành `tip-card` trong `#luuy`. *Không đặt ở "Ngày 4" như ý ban đầu vì Ngày
     4 là **hai section tách rời** (`#ngay4` cho A, `#bc-ngay4` cho B/C) nên sẽ
     phải nhân bản.* Ba thẻ giờ xe sáng Chủ Nhật giữ nguyên ở `#ngay5` vì thật
     sự chỉ đúng với A/B.
  3. Hàng "Nhà hàng Phúc Cái" trong `#kiemtra` gắn `A` nhưng quán được nhắc ở
     `#ngay1` dùng chung → sửa thành `A B C`.
  4. Các con số lỗi thời: "58km" cho ngày 2 (đã đo lại là ~80km) ở 4 chỗ, và 6
     chuỗi "v11" vô nghĩa với người đọc.

  *Lỗi cấu trúc HTML (nghiêm trọng hơn, đã ship từ trước):*
  - `bc-ngay3` sinh ra thẻ `<section alt id=...>` thay vì `class="alt"` — lỗi ở
    hàm sinh HTML dùng `(cls + ' ')` thay vì `('class="%s" ' % cls)`.
  - Ở v17, regex thay hộp "bỏ Du Già" khớp nhầm vào thẻ **"Nghỉ đêm — Du Già"**
    của `bc-ngay3` (vì `<h5>` cũng chứa chữ "Du Già") và **phá hỏng thẻ chỗ ở
    đó**, để lại một `</div>` thừa. Đã dựng lại.
  - Từ **v12**, hai thẻ "Kiểm chứng giờ xe" và "Vé phổ thông" bị **lồng bên
    trong** thẻ Checklist thay vì ngang hàng, do chèn vào ngay sau `<div
    class="side-card">` mà trước `<h5>`. HTML vẫn cân bằng nên trình phân tích
    không báo.

  **Bài học, ghi lại để khỏi lặp:**
  - Mỗi lần gắn `data-plan` dùng chung cho nhiều phương án, phải **đọc lại toàn
    bộ nội dung bên trong** xem có câu nào chỉ đúng với một phương án không.
  - **Đừng dùng regex lỏng để thay khối HTML.** Dùng neo chính xác, hoặc đếm cặp
    thẻ `<div>`/`</div>` để cắt đúng phạm vi.
  - Thêm 2 phép kiểm thường trực: **cân bằng `<div>` theo từng section** (bắt
    được cả 2 lỗi trên), và **quét text đang hiện của từng phương án** để chặn
    câu chỉ đúng với một phương án lọt sang phương án khác
    (`scratchpad/regress.js`).
  - Khi test điều hướng có cuộn mượt, phải chờ **~2,5s**; chờ 500ms cho báo động
    giả.

## Deploy

**Từ v6, bắt buộc deploy qua Netlify "Import from an existing project" →
GitHub** (không dùng Netlify Drop kéo-thả nữa, vì cần chạy Netlify
Function):

1. Push repo lên GitHub.
2. Vào app.netlify.com → "Add new site" → "Import an existing project" →
   chọn GitHub → chọn đúng repo.
3. Build settings: để trống "Build command", Publish directory = `.`
   (Netlify sẽ tự đọc `netlify.toml` cho phần functions).
4. Deploy — từ lần sau, mỗi lần `git push` lên `main` sẽ tự động deploy lại.
5. **Trước khi deploy lần đầu:** nhớ điền `FIREBASE_CONFIG` thật vào
   `index.html` (xem mục "Cấu hình dùng chung" ở trên) — nếu chưa điền, app
   vẫn chạy nhưng chat/chỗ ở/chi phí sẽ không lưu được, và drawer cài đặt sẽ
   báo "chưa cấu hình".
6. **Sau khi deploy lần đầu (v7):** vào Site configuration → Environment
   variables → thêm `ANTHROPIC_API_KEY` → **Trigger deploy lại** — nếu bỏ
   qua bước "Trigger deploy lại", function sẽ không thấy biến môi trường
   mới và nút "Nhờ AI soạn đề xuất" sẽ báo lỗi "Chưa cấu hình
   ANTHROPIC_API_KEY".

