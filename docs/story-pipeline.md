# Thêm truyện mới vào MimoKids

Hướng dẫn này tóm tắt lại quy trình đã dùng để biến 68 video trong
`example/stories/` thành các truyện hiển thị trong app (`app/public/stories/`
+ `app/src/data/stories.ts`). Dùng lại đúng quy trình này mỗi khi có video mới.

## Input đầu vào

Mỗi truyện nguồn là một cặp file cùng tên trong `example/stories/`:

```
example/stories/
  lv01-069_Ten Little Fingers.mp4
  lv01-069_Ten Little Fingers.srt
```

File `.srt` là dạng phụ đề karaoke kiểu Little Fox: mỗi câu bị lặp lại nhiều
lần, mỗi lần tô vàng một từ khác nhau (`<font color="#ffff00">word</font>`).
Đây **không phải** phụ đề dùng thẳng được — phải gộp lại thành 1 dòng/câu
trước khi đưa vào app.

## Output cần có

Mỗi truyện trong app là một thư mục 4 file tại `app/public/stories/storyNNN/`:

```
app/public/stories/story070/
  video.webm        (VP9/Opus — không phải mp4 gốc)
  cover.webp        (không phải jpg gốc)
  subtitle_en.srt   (đã gộp câu, không còn karaoke lặp)
  subtitle_vi.srt   (dịch tiếng Việt, cùng mốc thời gian với bản EN)
```

Định dạng mặc định là **webp/webm**, không phải jpg/mp4 — dung lượng nhỏ hơn
đáng kể (xem bước 4 và 5). Lưu ý `video.webm` không phát được trên iOS/Safari
(xem [Lưu ý / giới hạn đã biết](#lưu-ý--giới-hạn-đã-biết)); nếu cần hỗ trợ
Safari, tự chuyển thêm bản mp4 và cập nhật lại `Player.tsx`.

...và một entry tương ứng trong `app/src/data/stories.ts`.

## Công cụ cần có

- **Node.js** (đã có sẵn, không cần cài thêm gói nào — script chỉ dùng `fs`/`path`).
- **ffmpeg** (build có `libvpx-vp9`, `libopus`, `libwebp`) trong PATH — dùng để
  tách ảnh bìa và chuyển mã video sang webp/webm.

## Script hỗ trợ (`scripts/stories/`)

| File | Vai trò |
|---|---|
| `merge_srt.js` | Hàm lõi: parse `.srt`, gộp các block karaoke trùng chữ thành 1 câu. |
| `prep_story.js` | Chạy `merge_srt` trên 1 file `.srt`, xuất `subtitle_en.srt` + `sentences.json` (để điền bản dịch). |
| `write_vi_srt.js` | Đọc `sentences.json` (đã có field `"vi"`), xuất `subtitle_vi.srt` cùng mốc thời gian. |

## Quy trình từng bước (cho mỗi truyện mới)

Giả sử truyện mới có basename `lv01-069_Ten Little Fingers`, và số truyện kế
tiếp trong `stories.ts` là `story070`.

### 1. Gộp phụ đề karaoke thành câu hoàn chỉnh

```bash
node scripts/stories/prep_story.js \
  "example/stories/lv01-069_Ten Little Fingers.srt" \
  "app/public/stories/story070"
```

Lệnh này tạo `app/public/stories/story070/subtitle_en.srt` (đã gộp câu) và
`sentences.json` (mảng `{start, end, text}` — dùng để dịch ở bước sau).

### 2. Dịch sang tiếng Việt

Mở `app/public/stories/story070/sentences.json`, thêm field `"vi"` vào từng
phần tử (ngay sau `"text"`), giữ nguyên `start`/`end`/`text`. Bản dịch nên:

- Đơn giản, tự nhiên, phù hợp trẻ 3–6 tuổi.
- Dùng **"mình"** cho "I / my / me" xuyên suốt để giọng kể nhất quán giữa
  các truyện (ví dụ: "I can run." → "Mình có thể chạy.").
- Với câu chỉ là tiếng động/thán từ (ví dụ "Splat!", "Buzz!") thì dịch sang
  từ tượng thanh tương ứng ("Bộp!", "Vo ve!") thay vì dịch nghĩa đen.

### 3. Sinh `subtitle_vi.srt`

```bash
node scripts/stories/write_vi_srt.js \
  "app/public/stories/story070/sentences.json" \
  "app/public/stories/story070"
```

Script sẽ báo lỗi và dừng nếu còn câu nào thiếu `"vi"`.

### 4. Tách ảnh bìa (cover.webp)

Lệnh dưới đây lấy khung hình ở giây thứ 2 (thường là title-card của video),
ghép vào khung dọc 600×800 với nền mờ (letterbox), và xuất thẳng ra webp
(quality 80 — nhỏ hơn jpg ~5-10 lần ở cùng độ nét) — đã kiểm chứng cho toàn bộ
68 video, khung hình title-card luôn nằm ổn định quanh giây 1–3:

```bash
ffmpeg -y -ss 2 -i "example/stories/lv01-069_Ten Little Fingers.mp4" \
  -frames:v 1 \
  -filter_complex "[0:v]scale=600:800:force_original_aspect_ratio=increase,crop=600:800,gblur=sigma=25[bg];[0:v]scale=600:-1[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[out]" \
  -map "[out]" \
  -c:v libwebp -quality 80 \
  "app/public/stories/story070/cover.webp" \
  -loglevel error
```

Nếu ảnh ra không đẹp (title card lệch giờ khác), thử đổi `-ss 2` sang giá trị
khác (1, 3, 5s...) rồi chạy lại.

### 5. Chuyển mã video sang webm và dọn file tạm

Chuyển thẳng sang VP9/Opus (không copy mp4 gốc vào app) — `-crf 34 -b:v 0` cho
kích thước chỉ bằng ~40-60% mp4 gốc ở cùng độ phân giải, `-cpu-used 4` đánh đổi
một chút chất lượng nén để encode nhanh hơn (hợp lý cho video hoạt hình đơn
giản, ít chi tiết):

```bash
ffmpeg -y -i "example/stories/lv01-069_Ten Little Fingers.mp4" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -cpu-used 4 -deadline good -row-mt 1 \
  -c:a libopus -b:a 96k \
  "app/public/stories/story070/video.webm" \
  -loglevel error
rm "app/public/stories/story070/sentences.json"
```

Video hoạt hình 15fps ~80s thường ra dưới 6MB. Nếu video có nhiều chuyển động
nhanh và ảnh ra bị mờ/vỡ khối, hạ `-crf` xuống (ví dụ 28-30) để tăng chất
lượng, đổi lại file nặng hơn.

### 6. Kiểm tra đủ 4 file

```bash
ls app/public/stories/story070/
# phải thấy đúng: cover.webp  subtitle_en.srt  subtitle_vi.srt  video.webm
```

### 7. Thêm entry vào `app/src/data/stories.ts`

Thêm một object mới vào mảng `stories`, theo đúng format các entry hiện có:

```ts
{
  id: "story070",
  title: "Ten Little Fingers",
  episodeLabel: "Tập 70",
  cover: "/stories/story070/cover.webp",
  video: "/stories/story070/video.webm",
  subtitleEn: "/stories/story070/subtitle_en.srt",
  subtitleVi: "/stories/story070/subtitle_vi.srt",
  accent: "primary", // xoay vòng: primary / yellow / pink / green
},
```

`title` lấy từ tên file gốc sau dấu `_`, khôi phục lại dấu nháy đơn nếu tên
file dùng `_` thay cho `'` (ví dụ `Grandpa_s Farm` → `"Grandpa's Farm"`).

### 8. Kiểm tra thực tế

```bash
cd app && npm run dev
```

Mở app, kiểm tra:

- Truyện mới xuất hiện trong danh sách ở Home (cuộn ngang tới cuối).
- Bấm vào mở đúng Player, video chạy, phụ đề EN có hiệu ứng karaoke (do
  `useSubtitles`/Player tự tô màu theo từ, không cần làm gì thêm ở bước này),
  phụ đề VI hiển thị đúng bên dưới và khớp thời gian.

## Xử lý hàng loạt nhiều truyện cùng lúc

Khi có nhiều video mới cùng lúc (như đợt import 68 truyện đầu tiên), quy
trình trên có thể lặp cho từng truyện. Với số lượng lớn, cách đã làm là giao
mỗi lô ~10–12 truyện cho một agent chạy song song (dùng Claude Code với
Agent/Task), mỗi agent tự chạy đủ bước 1–6 cho các truyện được giao, sau đó
gộp toàn bộ entry vào `stories.ts` một lần.

## Lưu ý / giới hạn đã biết

- Merge phụ đề karaoke dựa trên so sánh **văn bản giống hệt nhau ở các block
  liên tiếp**. Nếu Little Fox đổi định dạng `.srt` (không còn lặp câu y hệt
  theo từng từ), `merge_srt.js` cần được xem lại.
- Bản dịch tiếng Việt hiện là dịch thủ công (bởi người/LLM), không có bước tự
  động — cần rà lại nghĩa cho phù hợp ngữ cảnh từng truyện.
- Ảnh bìa tách từ khung hình `-ss 2`; video không có title-card ổn định ở
  giây đó (hiếm) sẽ cho ảnh bìa xấu, cần chỉnh tay mốc thời gian.
- `video.webm` (VP9/Opus) **không phát được trên Safari/iOS**. App hiện không
  giữ bản mp4 dự phòng (đã xoá để giảm dung lượng) — đây là đánh đổi đã chọn
  để tối ưu dung lượng lưu trữ/băng thông; nếu cần hỗ trợ Safari/iOS, phải tự
  chuyển thêm `video.mp4` cho từng truyện và thêm lại `<source>` mp4 trong
  `Player.tsx`.
