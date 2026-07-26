# MimoKids — Mô tả chức năng hệ thống (hiện trạng)

Tài liệu này mô tả **những gì app đã thực sự cài đặt trong code**, không phải
bản PRD lý thuyết ban đầu. Dùng khi cần biết "app hiện làm được gì và làm như
thế nào". Các mục tiêu/triết lý sản phẩm ban đầu vẫn còn giá trị định hướng —
xem phần "So với ý tưởng ban đầu" ở mục 23 để biết đâu là chỗ code đã đi
lệch hoặc vượt ra ngoài bản thiết kế gốc.

Cập nhật lần cuối: 2026-07-26.

---

## 1. Tổng quan

MimoKids là app học tiếng Anh qua video truyện song ngữ (Anh–Việt) cho trẻ
3–6 tuổi, thao tác gần như hoàn toàn bằng chạm/tap, không cần đọc chữ, không
đăng nhập, không tài khoản. Codebase là một ứng dụng **React 19 + TypeScript
+ Vite**, đóng gói đa nền tảng qua **Capacitor** (Android/iOS) và chạy trực
tiếp trên **Web**. Toàn bộ nội dung (video, phụ đề, ảnh bìa) là file tĩnh
trong `app/public/stories/`, không có backend/API.

Thư mục mã nguồn chính: `app/src/`.

## 2. Công nghệ sử dụng thực tế

Theo `app/package.json`:

| Nhóm | Thư viện |
|---|---|
| Framework | React 19, TypeScript, Vite 8 |
| Routing | `react-router-dom` v7 (`HashRouter`) |
| State | `zustand` v5 (kèm middleware `persist`) |
| Animation | `framer-motion` v12 |
| Styling | Tailwind CSS v4 (cấu hình dạng CSS `@theme`, không có file `tailwind.config.js`) |
| Đa nền tảng | Capacitor 8 (`@capacitor/core`, `android`, `ios`) |
| Nhận diện giọng nói native | `@capacitor-community/speech-recognition` |
| Ghi âm native | `capacitor-voice-recorder` |
| Lint | `oxlint` |

Lưu ý khác biệt so với PRD ban đầu:
- **Không dùng** Lottie, React Player — dùng thẻ `<video>` HTML5 thuần, không qua thư viện video nào.
- `@capacitor/camera` và `@capacitor/filesystem` có trong `package.json` nhưng **không được import/sử dụng ở đâu trong `src/`** — coi như dependency dự phòng cho tương lai. Camera shadowing dùng thẳng `navigator.mediaDevices.getUserMedia` (Web API chuẩn), không qua plugin Capacitor Camera.
- Icon là SVG tự vẽ tay (`components/Icon/Icon.tsx`), không dùng thư viện icon ngoài.
- Âm thanh hiệu ứng được **tổng hợp bằng Web Audio API** lúc chạy (oscillator/noise buffer), không có file âm thanh nào trong assets.

## 3. Điều hướng & màn hình

Routing khai báo tại `app/src/App.tsx`, dùng `HashRouter` (phù hợp build
tĩnh/Capacitor, không cần server xử lý routing):

```
/            → Splash
/home        → Home
/story/:id   → Player
*            → redirect về "/"
```

Đúng như PRD: chỉ 3 màn hình, không bottom nav, không drawer, không menu.

## 4. Splash (`pages/Splash/Splash.tsx`)

- Hiện nền trời (`SkyBackground`, xem mục 19) + logo bật lên bằng animation `framer-motion` (scale/opacity, easing "backOut"), logo có hiệu ứng bồng bềnh (float) liên tục.
- Dòng chữ "Học mà chơi - Chơi mà học!".
- Sau **2000ms** (`SPLASH_DURATION_MS`) tự động điều hướng sang `/home` (`replace: true`, không lưu vào history).

## 5. Home (`pages/Home/Home.tsx`)

Màn hình chọn truyện, đã mở rộng khá nhiều so với PRD gốc:

- **Nền**: `SkyBackground` (trời + mây trôi + sao lấp lánh, vẽ bằng emoji + CSS keyframes, không phải ảnh) phía trên, một dải xanh lá bo tròn giả lập "đồi cỏ" ở đáy màn hình.
- **Header**: Logo, tiêu đề "Chọn truyện để bắt đầu" (kèm 2 icon sao), số sao đã thu thập (`stars` từ store, hiển thị dạng pill), nút Settings (icon bánh răng) mở dialog nhỏ hiển thị phiên bản app + tổng số sao + nút Đóng — không có cài đặt nào khác (không toggle âm thanh chung, không đổi ngôn ngữ giao diện, không hồ sơ phụ huynh).
- **Bộ lọc danh mục** (chip cuộn ngang — **PRD gốc ghi rõ "No categories/No filters" nhưng thực tế đã bổ sung**): 10 danh mục cố định trong `data/stories.ts` (`storyCategories`): Động vật, Cảm xúc & Kỹ năng sống, Cơ thể & Sức khỏe, Gia đình & Bạn bè, Thời tiết & Mùa, Lễ hội & Tiệc vui, Trường học & Học tập, Trò chơi & Hoạt động, Ăn uống, Thế giới xung quanh — cộng thêm chip "Tất cả". Chọn 1 chip lọc danh sách truyện theo `story.category`. Chip đang chọn có hiệu ứng "viên thuốc" trượt theo (`layoutId` của framer-motion). Rìa trái/phải của dải chip tự mờ dần (mask gradient) nếu còn nội dung để cuộn tiếp. Không có ô tìm kiếm dạng chữ.
- **Dải truyện (rail)** cuộn ngang, snap từng thẻ (`snap-x`):
  - Thẻ đang ở giữa màn hình được tính là "active" bằng cách so khoảng cách tâm mỗi thẻ với tâm rail mỗi lần cuộn (`updateFromScroll`, dùng `requestAnimationFrame`), phát tiếng "tick" nhẹ khi đổi thẻ active.
  - Nút mũi tên trái/phải (chỉ hiện trên thiết bị có chuột thật — custom Tailwind variant `can-hover`) để nhảy sang thẻ trước/sau, kèm tiếng "whoosh".
  - Hỗ trợ kéo bằng chuột trên desktop (pointer events, ngưỡng kéo 10px trước khi coi là "đang kéo" để không nuốt mất cú click thường); trên di động dùng cuộn chạm gốc của trình duyệt.
  - Cuộn bằng lăn chuột dọc cũng đẩy được rail ngang.
  - **Không có "Continue Watching"** (khác PRD gốc): không theo dõi tiến độ xem theo từng truyện, không lưu vị trí xem dở.
- **Footer**: khẩu hiệu "Học mà chơi - Chơi mà học - Bé vui mỗi ngày!" (ẩn ở màn hình ngang thấp).

### Story Card (`components/StoryCard/StoryCard.tsx`)

- Ảnh bìa (`story.cover`, tự động fallback sang `/stories/default-cover.png` nếu ảnh lỗi/thiếu), tiêu đề, nhãn tập + thời lượng định dạng `m:ss`.
- Badge "Mới" (`tags: ["new"]`) và/hoặc "Đặc sắc" (`tags: ["featured"]`) ở góc trên phải.
- Thẻ active có viền vàng nổi bật + scale lớn hơn thẻ không active (0.9 → 1, mờ dần opacity).
- Animation: nghiêng nhẹ qua lại khi hover (desktop), scale + nghiêng khi tap.

## 6. Story Player (`pages/Player/Player.tsx`)

Toàn màn hình, video nền đen, `object-contain` (không crop). Video dùng thẻ
`<video>` gốc HTML, `playsInline`, `autoPlay`, `disablePictureInPicture`,
chặn menu chuột phải (`onContextMenu` preventDefault) — không hiện điều
khiển native của trình duyệt.

- **Thanh trên cùng** (tự ẩn — xem bên dưới): nút Back tròn, khối tiêu đề + progress bar (chỉ hiện ở màn hình ≥ `sm`) hiển thị `title - episodeLabel`, thanh tiến trình có thể **kéo để tua** (`ProgressBar`, xem mục riêng), thời gian dạng `m:ss / m:ss`, nút "Home" dạng pill.
- **Tự ẩn/hiện điều khiển**: mọi control (thanh trên + floating buttons) tự ẩn sau 3s (`CONTROLS_HIDE_DELAY_MS`) không tương tác, trừ khi video đang pause. Tap vào vùng trống của màn hình sẽ ẩn ngay hoặc hiện lại; tap vào nút thật thì chỉ đẩy lùi thời điểm tự ẩn. Đây là hành vi **không có trong PRD gốc**.
- **ProgressBar** (`components/ProgressBar/ProgressBar.tsx`): kéo/tap để tua video (`onSeek`) — **PRD gốc yêu cầu ẩn hẳn seek bar**, nhưng thực tế đã bổ sung để tiện dùng; khi bắt đầu kéo sẽ tự pause video và tiếp tục phát lại đúng trạng thái trước đó khi thả tay; bị vô hiệu hoá trong lúc đang luyện nói (`phase !== "idle"`).
- **Kết thúc video**: nếu còn truyện kế tiếp trong danh sách và `autoPlayNext` bật → tự chuyển sang truyện sau (video swap tại chỗ qua `navigate(..., {replace:true})`, không unmount hoàn toàn Player); nếu tắt autoplay → hiện `StoryEndDialog`; nếu không còn truyện kế tiếp → quay về Home.

## 7. Floating Buttons (`components/FloatingButtons/FloatingButtons.tsx`)

Cột nút tròn/pill nổi bên phải màn hình player, đúng tinh thần PRD (icon lớn,
dễ bấm), gồm 5 nút:

1. **EN** — bật/tắt phụ đề tiếng Anh (`subtitleEnOn`).
2. **VI** — bật/tắt phụ đề tiếng Việt (`subtitleViOn`).
3. **Shadowing** — bật/tắt camera tự quay (`shadowingOn`), hiện nhãn phụ ON/OFF.
4. **Pause/Play** — icon đổi theo trạng thái, đổi màu tối ("night", tím than — màu riêng thêm ngoài bảng màu PRD gốc).
5. **Practice Speaking** — nút dạng pill đặc (solid), màu hồng, bị vô hiệu hoá khi đang trong luồng luyện nói hoặc phụ đề chưa tải xong (`practiceDisabled`).

Cả 3 toggle đầu (EN/VI/Shadowing) được lưu bền vững qua Zustand `persist`
(mục 18), áp dụng chung cho mọi truyện, không phải theo từng truyện riêng.

## 8. Phụ đề song ngữ & hiệu ứng karaoke (`components/Subtitle/Subtitle.tsx`)

- Phụ đề được parse từ file `.srt` (mục 16), câu hiện tại được tìm theo
  `currentTime` của video (`findActiveCue`).
- Khung phụ đề: tiếng Anh ở trên (chữ lớn, đậm), tiếng Việt ở dưới (chữ nhỏ
  hơn) — đúng bố cục PRD. Có thể tắt riêng từng thứ tiếng.
- **Karaoke**: chữ đang được đọc đổi màu vàng (`#FFD54A`) + scale nhẹ. Cách
  tính: **không** dựa vào timestamp từng từ thực tế (phụ đề không có mốc
  thời gian cấp từ) mà **chia đều thời lượng của cả câu cho số từ** — từ đang
  "active" = `floor(tiến độ_thời_gian_trong_câu × số_từ)`. Đây là phép xấp xỉ
  tuyến tính, không đồng bộ hoàn hảo với tốc độ nói thật (câu có nhịp đọc
  không đều sẽ lệch).
- Chuyển câu có animation fade/slide (`AnimatePresence mode="wait"`).

## 9. Camera Shadowing (`components/CameraPreview/CameraPreview.tsx`)

- Khi bật, hiện khung camera nhỏ hình chữ nhật bo tròn, góc dưới phải, lấy
  luồng từ camera trước (`getUserMedia({video:{facingMode:"user"}, audio:false})`),
  video được lật gương (`scale-x-[-1]`) để trẻ thấy mình như soi gương.
  Video ở đây **chỉ hiển thị, không ghi lại, không audio** — mục đích thuần
  là "bé tự nhìn mình nói" theo đúng PRD.
- **Có thể kéo thả** trong phạm vi khung Player (`framer-motion drag`,
  `dragConstraints` theo `containerRef` của Player).
- Nếu xin quyền camera thất bại, component tự ẩn (không báo lỗi cho trẻ).
- Camera preview tự ẩn trong lúc đang hiện `RewardPopup` (phase `"reward"`).

## 10. Luyện nói — Practice Speaking (luồng chính, `pages/Player/Player.tsx`)

Đây là tính năng lõi của app. Toàn bộ điều phối bằng một state machine đơn
giản `Phase = "idle" | "countdown" | "listening" | "reward"`.

1. **Bấm nút Practice Speaking** (`startPractice`) — chỉ hoạt động khi
   `phase === "idle"`. Lấy câu phụ đề tiếng Anh đang active (hoặc câu gần
   nhất nếu đang giữa 2 câu, `findNearestCue`) làm `practiceTarget`. "Mở
   khoá" AudioContext dùng chung (`primeAudio`, bắt buộc phải gọi trong lúc
   xử lý sự kiện tap — quy định của trình duyệt di động), pause video,
   chuyển `phase` sang `"countdown"`.
2. **Countdown** (`components/Speech/Countdown.tsx`) — đếm to 3→2→1 (mỗi số
   hiện 800ms, animation phóng to/co lại), xong gọi `onComplete`.
3. **`handleCountdownComplete`** — chuyển `phase` sang `"listening"`, phát
   tiếng "ting" báo bắt đầu (`playReadyChime`), rồi khởi động **song song
   hai luồng độc lập**:
   - `SpeechProvider.start("en-US")` — bắt đầu nhận diện giọng nói (mục 11).
   - `AudioRecorder.start()` — ghi âm thô để phát lại sau này (mục 12).
   - Một **timer dự phòng** tự động gọi `finishListening()` sau một khoảng
     thời gian được tính theo độ dài câu (`getListenDuration`): công thức
     `2200ms + 650ms × số_từ + 900ms đệm`, giới hạn trong khoảng **4–12
     giây**. Mục đích: câu dài không bị cắt ngang, câu ngắn không phải chờ
     vô ích, và dù mic/API bị treo (không quyền, mất mạng) trẻ cũng không
     bao giờ bị kẹt mãi ở màn hình "Listening...".
4. **`MicIndicator`** (`components/Speech/MicIndicator.tsx`) hiển thị: câu
   cần đọc, icon mic có vòng sóng lan toả (pulsing), `SoundVisualizer` (5
   thanh cột nhảy theo âm lượng mic thật qua `AnalyserNode`, hoặc dao động
   giả lập nếu không lấy được stream thật — ví dụ trên native/Capacitor),
   dòng chữ "Listening...", và **nút tick xanh để chủ động báo "nói xong"**
   — đây là cách dừng chính; timer ở bước 3 chỉ là lưới an toàn.
5. **`finishListening`** — dừng đồng thời `provider.stop()` +
   `recorder.stop()`, chấm điểm bằng `provider.score(practiceTarget, speechResult)`
   (mục 13), phát âm thanh cheer (đạt) hoặc "thử lại nhẹ nhàng" (chưa đạt),
   cộng 10 sao nếu đạt (`addStars(10)`), chuyển `phase` sang `"reward"`. Có
   cờ `finishingRef` chống gọi trùng nếu người dùng bấm nút đúng lúc timer
   cũng vừa bắn.
6. **`RewardPopup`** hiện kết quả (mục 14). Bấm "Continue"/"Try Again"/"Skip"
   sẽ điều hướng lại `phase` và (nếu tiếp tục) phát video trở lại.

Khi rời Player (unmount) hoặc đổi truyện, mọi timer đang chạy bị huỷ,
`SpeechProvider.cancel()` + `AudioRecorder.cancel()` được gọi, và blob URL
ghi âm cũ được `URL.revokeObjectURL` để tránh rò rỉ bộ nhớ.

> Xem thêm lịch sử các bug đã gặp/đã sửa quanh luồng ghi âm này ở
> [`docs/speech-recording.md`](../docs/speech-recording.md) — bao gồm lý do
> vì sao timer là theo độ dài câu thay vì cố định, và vì sao
> `WebSpeechProvider` cần tự restart khi Chrome ngắt phiên giữa chừng.

## 11. Nhận diện giọng nói — `SpeechProvider` (`services/Speech/`)

Interface trừu tượng (`types.ts`) cho phép đổi engine STT mà không đụng vào
UI, đúng như PRD yêu cầu:

```ts
interface SpeechProvider {
  isSupported: boolean;
  start(lang: string): Promise<void>;
  stop(): Promise<SpeechRecognitionResult>;
  cancel(): Promise<void>;
  score(expectedText: string, result): PronunciationResult;
}
```

- **`WebSpeechProvider`** (web + fallback): dùng Web Speech API trình duyệt
  (`SpeechRecognition`/`webkitSpeechRecognition`), `continuous: true`,
  `interimResults: true`. Tự động **restart** khi trình duyệt (Chrome) tự
  ngắt phiên do im lặng ngắn, gộp transcript giữa các lần restart qua
  `baseTranscript` để không mất từ đã nhận trước đó. `stop()` có timeout dự
  phòng 1500ms phòng khi `onend` không bắn.
- **`CapacitorSpeechProvider`** (native Android/iOS): dùng
  `@capacitor-community/speech-recognition`, tự xin quyền mic nếu chưa có,
  lắng nghe `partialResults`. **Chưa được kiểm thử thực tế** trên thiết bị
  thật với các bản vá gần đây (ghi chú rủi ro trong `speech-recording.md`).
- Factory `getSpeechProvider()` (`services/Speech/index.ts`) chọn provider
  theo `Capacitor.isNativePlatform()`, cache 1 instance dùng chung.
- **Chưa có** provider nào cho Azure/Google/OpenAI Speech (nằm trong "Future"
  của PRD, kiến trúc đã sẵn sàng để thêm nhưng chưa cài đặt).

## 12. Ghi âm để nghe lại — `AudioRecorder` (`services/Recording/`)

Tách biệt hoàn toàn khỏi `SpeechProvider` (nhận diện) vì đây là 2 nhu cầu
khác nhau — ghi âm chỉ để phát lại cho trẻ nghe giọng mình, không liên quan
đến chấm điểm:

- **`WebAudioRecorder`**: `MediaRecorder` trên web, expose thêm
  `getStream()` để `SoundVisualizer` vẽ mức âm lượng thật.
- **`CapacitorAudioRecorder`**: `capacitor-voice-recorder` trên native, trả
  về audio dạng `data:` base64 URI (không có `getStream()` — visualizer native
  dùng animation giả lập).
- Factory `getAudioRecorder()` tương tự cơ chế chọn theo platform ở mục 11.

## 13. Chấm điểm phát âm (`services/Speech/scoring.ts`)

Hàm `scorePronunciation(expectedText, transcript)`:

- Tách cả 2 chuỗi thành từ, chuẩn hoá (lowercase, bỏ dấu, bỏ ký tự không phải
  chữ/số).
- So khớp **không theo thứ tự** — với mỗi từ trong câu gốc, tìm từ trùng
  khớp tuyệt đối trong transcript; nếu không có, thử khớp gần đúng
  (`isCloseMatch`) bằng khoảng cách Levenshtein, ngưỡng sai lệch cho phép
  tăng theo độ dài từ (từ ngắn <3 ký tự: không cho sai; ≤4 ký tự: cho sai 1;
  dài hơn: cho sai ~30% độ dài). Mục đích: STT trẻ em rất hay nghe nhầm 1 âm
  ("cat" → "cap"), coi đó là trượt hoàn toàn sẽ quá khắt khe.
- Tỷ lệ khớp → số sao: **≥85% = 5★, ≥60% = 4★, ≥35% = 3★, ≥15% = 2★, còn lại
  = 1★**. `passed = stars >= 2`.
- Kết quả trả về gồm cả `words: WordMatch[]` (từng từ gốc kèm cờ đã khớp hay
  chưa) để UI tô màu.
- **Không** đánh giá ngữ pháp, thứ tự từ hay ngữ điệu, và **không hiển thị
  % chính xác/độ tin cậy** ra UI — đúng như PRD.

## 14. Reward Popup (`components/RewardPopup/RewardPopup.tsx`)

- Nếu đạt (`passed`): confetti rơi (26 mảnh màu, rơi + xoay ngẫu nhiên, tự
  viết bằng Framer Motion, không dùng thư viện confetti riêng), 5 icon sao
  (đầy dần theo `stars`), một câu khen ngẫu nhiên trong
  `["Excellent!", "Amazing!", "Great Job!", "Awesome!", "Let's Go!"]`, dòng
  "+10 ⭐ Stars", nút **Continue** (màu xanh lá) để tiếp tục video, và một
  nút phụ **Try Again** (chữ nhỏ, không nổi bật) nếu trẻ vẫn muốn luyện lại.
- Nếu chưa đạt: **không** hiện chữ tiêu cực (Wrong/Incorrect/Failed) — chỉ
  hiện "Let's try again!" cùng nút **Try Again** nổi bật (màu hồng) và nút
  phụ **Skip** để bỏ qua, tiếp tục xem video.
- Danh sách từ trong câu gốc được hiện dưới dạng chip: chip xanh nếu khớp,
  chip xám gạch ngang nếu không khớp — cho trẻ (và phụ huynh) thấy trực quan
  phần nào đã nói đúng.
- Nếu có bản ghi âm hợp lệ (`audioUrl`): nút **"Hear yourself"** phát lại
  chính giọng trẻ vừa ghi.

## 15. Kết thúc truyện (`components/StoryEndDialog/StoryEndDialog.tsx`)

Tính năng **không có trong PRD gốc**. Khi video kết thúc và còn truyện kế
tiếp trong danh sách, nếu chưa bật autoplay sẽ hiện dialog:

- Tên truyện tiếp theo.
- Nút **"Truyện tiếp theo"** (phát ngay) và **"Về danh sách"** (quay Home).
- Checkbox **"Tự động phát truyện tiếp theo"** — bật thì lần kết thúc sau sẽ
  tự chuyển truyện, không hiện dialog này nữa (trạng thái lưu bền vững qua
  Zustand, mục 18).

## 16. Mô hình dữ liệu (`src/types/index.ts`)

```ts
interface SubtitleItem { start: number; end: number; text: string; }

type StoryCategory = "animals" | "emotions" | "body" | "family" | "weather"
  | "holidays" | "school" | "activities" | "food" | "world";
type StoryTag = "new" | "featured";

interface Story {
  id: string;
  title: string;
  episodeLabel?: string;
  cover: string;          // .webp
  video: string;          // .webm (VP9/Opus)
  duration?: number;       // giây
  subtitleEn: string;      // .srt
  subtitleVi: string;      // .srt
  category: StoryCategory;
  tags?: StoryTag[];
  accent?: "primary" | "yellow" | "pink" | "green" | "night";
}

type StarRating = 1 | 2 | 3 | 4 | 5;
interface WordMatch { word: string; matched: boolean; }
interface PronunciationResult {
  transcript: string;
  stars: StarRating;
  passed: boolean;
  words: WordMatch[];
  audioUrl?: string;
}
```

So với PRD gốc, `Story` đã bổ sung thêm `episodeLabel`, `duration`,
`category`, `tags`, `accent` — không có trong bản thiết kế ban đầu, phục vụ
cho bộ lọc danh mục và badge Mới/Đặc sắc trên Home. Ngược lại, không còn
`audio.mp3` riêng như PRD gốc mô tả (âm thanh đã nhúng sẵn trong `video.webm`).

Parser SRT: `services/Subtitle/srtParser.ts` (`parseSrt`/`loadSrt`) — chịu
được xuống dòng kiểu Windows, bỏ qua thẻ HTML (`<font>...`) còn sót trong
phụ đề, sắp xếp theo `start`. Được nạp qua hook `hooks/useSubtitles.ts`, tải
song song 2 file (EN + VI) mỗi khi đổi truyện.

## 17. Thư viện truyện hiện có

`src/data/stories.ts` khai báo **69 truyện** (`story001`–`story069`), mỗi
truyện trỏ tới `app/public/stories/storyNNN/` gồm 4 file: `cover.webp`,
`video.webm`, `subtitle_en.srt`, `subtitle_vi.srt`. Không có backend — toàn
bộ là asset tĩnh, phục vụ trực tiếp qua Vite/webserver. Thư mục
`app/public/stories/` có thêm 1 ảnh dùng chung: `default-cover.png` (fallback
khi `cover.webp` của một truyện lỗi/thiếu).

Quy trình tạo truyện mới (chuyển từ video gốc + phụ đề karaoke Little Fox
sang 4 file trên, dịch tiếng Việt, nén webm/webp) được mô tả chi tiết ở
[`docs/story-pipeline.md`](../docs/story-pipeline.md), có script hỗ trợ ở
`scripts/stories/`.

**Giới hạn đã biết**: `video.webm` (VP9/Opus) **không phát được trên
Safari/iOS** — hiện không giữ bản `.mp4` dự phòng (đã bỏ để giảm dung
lượng). Đây là rủi ro thực tế cho mục tiêu "single codebase — Android/iOS/
Web" của PRD; muốn hỗ trợ Safari/iOS phải tự chuyển thêm `video.mp4` cho
từng truyện và thêm `<source>` mp4 trong `Player.tsx`.

## 18. Quản lý trạng thái (`store/useAppStore.ts`)

Một store Zustand duy nhất, có `persist` (lưu vào `localStorage`, key
`mimokids-app`):

| State | Ý nghĩa |
|---|---|
| `stars` / `addStars()` | Tổng số sao đã thu thập, cộng dồn toàn app (không tách theo truyện/trẻ) |
| `subtitleEnOn`, `subtitleViOn` | Bật/tắt phụ đề, mặc định cả hai đều `true` |
| `shadowingOn` | Bật/tắt camera shadowing, mặc định `false` |
| `autoPlayNext` | Tự động phát truyện kế tiếp, mặc định `false` |

Đây là toàn bộ "cài đặt" hiện có của app — không có hồ sơ nhiều trẻ, không
đăng nhập, không đồng bộ đám mây, không theo dõi tiến độ theo từng truyện,
đúng tinh thần PRD "No login, no account, no progress management" (ngoại
trừ bộ đếm sao và các toggle trên, vốn không gắn với danh tính người dùng
cụ thể nào). Mọi state khác trong app (thời gian video, phase luyện nói, kết
quả chấm điểm, hiện/ẩn control...) chỉ là `useState` cục bộ trong
`Player.tsx`/`Home.tsx`, không đi qua store.

## 19. Giao diện & theme

Cấu hình tại `app/src/index.css` (Tailwind v4 kiểu CSS-first, không có file
`tailwind.config.js`):

- **Font**: `--font-heading: "Baloo 2", "Fredoka"`, `--font-body: "Nunito", "Fredoka"` (nạp từ Google Fonts qua thẻ `<link>` trong `index.html`) — đúng PRD (không dùng Roboto).
- **Màu**: `--color-bg: #F7FBFF`, `--color-primary: #5CC8FF`, `--color-yellow: #FFD54A`, `--color-pink: #FF92C2`, `--color-green: #8EE28E` — khớp bảng màu PRD. Ngoài ra có thêm màu "night" (`#5B4B9A`, tím đậm) dùng cho nút Pause để tương phản tốt trên nền video, không có trong PRD gốc.
- **Animation dùng chung**: `float`, `float-slow`, `twinkle` (sao lấp lánh), `pop-in`, `drift` (mây trôi) — khai báo bằng `@keyframes`/`--animate-*`, dùng lại ở nhiều nơi (Splash, Home, SkyBackground).
- **Custom Tailwind variants**:
  - `landscape-compact` — kích hoạt khi màn hình ngang và thấp (điện thoại xoay ngang), thu gọn padding/kích thước để không bị tràn.
  - `can-hover` — chỉ khớp thiết bị có chuột/con trỏ thật (`hover: hover` + `pointer: fine`), dùng để ẩn các nút mũi tên điều hướng trên di động (nơi chúng chỉ là vùng chết không bấm được).
- **An toàn vùng viền (safe area)**: biến `--safe-t/-b/-l/-r` lấy từ `env(safe-area-inset-*)`, cộng thêm cơ chế `--app-height` (đo bằng JS qua `utils/viewportHeight.ts`) để vá lỗi iOS báo sai `100dvh` ngay sau khi xoay màn hình.
- Toàn bộ trang bị khoá cuộn ở cấp `html body #root` (`overflow: hidden`) để tránh hiệu ứng bounce/rubber-band của iOS khi vuốt quá đà — mỗi màn hình tự quản lý phần cuộn riêng của nó (ví dụ rail truyện ở Home).

## 20. Âm thanh hiệu ứng

Không dùng file âm thanh nào — mọi tiếng đều **tổng hợp bằng Web Audio API**
lúc chạy:

- `utils/sound.ts`: tiếng "tick" khi đổi thẻ active trên Home, tiếng
  "whoosh" khi bấm nút điều hướng trái/phải.
- `services/Sound/feedbackSounds.ts`: tiếng chuông "ting" khi mic bắt đầu
  nghe (`playReadyChime`), tràng vỗ tay + giai điệu đi lên khi đạt
  (`playSuccessCheer`), 2 nốt trầm nhẹ khi chưa đạt (`playTryAgainCue`).
- `services/Sound/audioContext.ts`: một `AudioContext` dùng chung cho phần
  luyện nói, phải được "mở khoá" (`primeSharedAudioContext`) từ trong một
  thao tác chạm thật của người dùng — nếu không trình duyệt di động (đặc
  biệt iOS Safari) sẽ tự treo (`suspended`) và làm câm cả âm thanh lẫn bộ
  phân tích tần số của `SoundVisualizer`.
  - Lưu ý kỹ thuật nhỏ: `utils/sound.ts` (âm thanh điều hướng ở Home) tự
    quản lý một `AudioContext` singleton **riêng** của nó, tách biệt khỏi
    context dùng chung trong `services/Sound/audioContext.ts` — 2 context
    độc lập cùng tồn tại thay vì dùng chung 1 instance.

Không có tiếng nào "gắt" — đúng yêu cầu PRD "No harsh sounds".

## 21. PWA & Capacitor

- **Web/PWA**: `app/public/manifest.webmanifest` + `app/public/sw.js` được
  đăng ký best-effort trong `main.tsx` (`serviceWorker.register`, lỗi bị
  nuốt lặng lẽ — khả năng cài đặt PWA là điểm cộng, không phải yêu cầu bắt
  buộc để chạy app).
- **Capacitor** (`app/capacitor.config.ts`): `appId: com.mimokids.app`,
  `webDir: dist`, `androidScheme: https`. Plugin cấu hình riêng:
  `SpeechRecognition` (không auto-prompt xin quyền trên iOS — app tự gọi
  `requestPermissions()` trước khi bắt đầu nghe, xem mục 11). Không cấu
  hình gì riêng cho Camera/Filesystem/VoiceRecorder (dùng mặc định) — nhất
  quán với việc 2 plugin Camera/Filesystem chưa thực sự được dùng (mục 2).
- **Android**: `AndroidManifest.xml` khai permission `INTERNET`,
  `RECORD_AUDIO`, `CAMERA` (kèm `uses-feature` đánh dấu `required=false`,
  cho phép cài trên thiết bị không có camera/mic), có `FileProvider` (phục
  vụ voice-recorder lưu file tạm). `MainActivity` dùng
  `launchMode="singleTask"` và tự xử lý mọi `configChanges` (orientation,
  keyboard, screenSize...) để tránh Activity bị Android tái tạo khi xoay
  màn hình — quan trọng vì Player đang giữ state video/mic phức tạp giữa
  chừng.
- Script build: `npm run cap:sync` (build web rồi `cap sync`),
  `npm run cap:android` / `cap:ios` (sync rồi mở IDE native tương ứng).

## 22. Cấu trúc thư mục mã nguồn thực tế (`app/src/`)

```
components/
  Button/            CircleButton, PillButton, SolidPillButton
  CameraPreview/      camera tự quay (shadowing)
  FloatingButtons/    cột nút nổi trong Player
  Icon/               icon SVG tự vẽ
  Logo/
  ProgressBar/        thanh tua video
  RewardPopup/        kết quả luyện nói + confetti
  SkyBackground/      nền trời dùng chung Splash/Home
  Speech/             Countdown, MicIndicator, SoundVisualizer
  StoryCard/
  StoryEndDialog/
  Subtitle/           phụ đề song ngữ + karaoke
data/
  stories.ts          danh sách 69 truyện + danh mục
hooks/
  useSubtitles.ts     tải + truy vấn cue phụ đề theo thời gian
pages/
  Splash/ Home/ Player/
services/
  Recording/          AudioRecorder (Web + Capacitor)
  Sound/              AudioContext dùng chung + hiệu ứng luyện nói
  Speech/             SpeechProvider (Web + Capacitor) + scoring
  Subtitle/           parser .srt
store/
  useAppStore.ts      Zustand + persist
types/
  index.ts, speech.d.ts
utils/
  sound.ts, time.ts, viewportHeight.ts
```

Khác với cây thư mục trong PRD gốc: không có thư mục con riêng theo
component-kind (`Button/`, `Subtitle/`... nằm phẳng dưới `components/` đúng
như liệt kê, không lồng thêm cấp), không có `assets/stories`/
`assets/animations`/`assets/sounds` (nội dung truyện nằm ở `public/stories/`,
âm thanh tổng hợp runtime nên không cần asset), không có `hooks/` nào khác
ngoài `useSubtitles`.

## 23. So với ý tưởng/PRD ban đầu — khác biệt & tính năng chưa cài đặt

Những mục PRD gốc có nhắc tới nhưng **chưa thấy trong code**:

- "Continue Watching" trên Home — chưa có theo dõi tiến độ xem theo từng truyện.
- Provider Azure/Google/OpenAI Speech — kiến trúc `SpeechProvider` đã trừu tượng hoá sẵn nhưng chưa có implementation nào khác ngoài Web Speech API và Capacitor.
- File `audio.mp3` riêng cho mỗi truyện — âm thanh nay nhúng sẵn trong `video.webm`.
- Toàn bộ mục "Future Features" (Favorites, Offline downloads, Daily recommended story, AI conversation mode, Vocabulary games, Mini quizzes, Parent dashboard, Cloud sync, Achievements, Sticker collection, Voice cloning, Character AI) — chưa có gì được cài đặt.
- Lottie, React Player, `@capacitor/filesystem`, `@capacitor/camera` — có trong tech stack PRD nhưng không dùng thực tế (2 plugin Capacitor vẫn còn trong dependencies, coi như "để dành").

Những gì **đã vượt** ra ngoài PRD gốc (bổ sung thêm trong quá trình phát triển):

- Bộ lọc theo 10 danh mục truyện trên Home (PRD gốc yêu cầu "No categories/No filters").
- Thanh tua video có thể kéo (`ProgressBar`) — PRD gốc yêu cầu ẩn hẳn seek bar.
- Dialog kết thúc truyện với tuỳ chọn tự động phát truyện tiếp theo.
- Nút "Skip" khi luyện nói chưa đạt, và nút phát lại giọng nói của chính trẻ ("Hear yourself").
- Dialog Settings đơn giản (phiên bản app + tổng sao).
- Cơ chế tự ẩn/hiện toàn bộ control trong Player sau vài giây không tương tác.
- Badge "Mới"/"Đặc sắc" trên story card, dựa trên field `tags` không có trong PRD gốc.

## 24. Tài liệu liên quan

| File | Nội dung |
|---|---|
| [speech-recording.md](../docs/speech-recording.md) | Chi tiết luồng ghi âm/nhận diện/chấm điểm, các bug đã gặp và đã sửa, rủi ro còn tồn tại. |
| [story-pipeline.md](../docs/story-pipeline.md) | Quy trình biến video gốc thành truyện trong app. |
