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
  video.mp4
  cover.jpg
  subtitle_en.srt   (đã gộp câu, không còn karaoke lặp)
  subtitle_vi.srt   (dịch tiếng Việt, cùng mốc thời gian với bản EN)
```

...và một entry tương ứng trong `app/src/data/stories.ts`.

## Công cụ cần có

- **Node.js** (đã có sẵn, không cần cài thêm gói nào — script chỉ dùng `fs`/`path`).
- **ffmpeg** trong PATH — dùng để tách ảnh bìa từ video.

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

### 4. Tách ảnh bìa (cover.jpg)

Lệnh dưới đây lấy khung hình ở giây thứ 2 (thường là title-card của video) và
ghép vào khung dọc 600×800 với nền mờ (letterbox) — đã kiểm chứng cho toàn bộ
68 video, khung hình title-card luôn nằm ổn định quanh giây 1–3:

```bash
ffmpeg -y -ss 2 -i "example/stories/lv01-069_Ten Little Fingers.mp4" \
  -frames:v 1 \
  -filter_complex "[0:v]scale=600:800:force_original_aspect_ratio=increase,crop=600:800,gblur=sigma=25[bg];[0:v]scale=600:-1[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[out]" \
  -map "[out]" \
  "app/public/stories/story070/cover.jpg" \
  -loglevel error
```

Nếu ảnh ra không đẹp (title card lệch giờ khác), thử đổi `-ss 2` sang giá trị
khác (1, 3, 5s...) rồi chạy lại.

### 5. Copy video và dọn file tạm

```bash
cp "example/stories/lv01-069_Ten Little Fingers.mp4" "app/public/stories/story070/video.mp4"
rm "app/public/stories/story070/sentences.json"
```

### 6. Kiểm tra đủ 4 file

```bash
ls app/public/stories/story070/
# phải thấy đúng: cover.jpg  subtitle_en.srt  subtitle_vi.srt  video.mp4
```

### 7. Thêm entry vào `app/src/data/stories.ts`

Thêm một object mới vào mảng `stories`, theo đúng format các entry hiện có:

```ts
{
  id: "story070",
  title: "Ten Little Fingers",
  episodeLabel: "Tập 70",
  cover: "/stories/story070/cover.jpg",
  video: "/stories/story070/video.mp4",
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
