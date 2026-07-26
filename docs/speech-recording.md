# Ghi âm & chấm điểm phát âm (Practice Speaking)

Tài liệu này mô tả cách tính năng "Practice Speaking" trong `Player` hoạt
động: ghi âm trẻ đọc theo phụ đề, nhận diện giọng nói, so khớp với câu gốc và
chấm sao. Dùng khi cần tìm hiểu bug liên quan đến ghi âm/nhận diện/chấm điểm.

## Luồng hoạt động

Toàn bộ được điều phối trong
[`app/src/pages/Player/Player.tsx`](../app/src/pages/Player/Player.tsx):

1. Bấm nút "Practice Speaking" → `startPractice()` — dừng video, lấy câu
   phụ đề EN hiện tại làm `practiceTarget`, chuyển `phase` sang `"countdown"`.
2. `Countdown` đếm 3→0, xong gọi `handleCountdownComplete()`.
3. `handleCountdownComplete()` (Player.tsx:211) — chuyển `phase` sang
   `"listening"`, phát chime, rồi khởi động **song song**:
   - `SpeechProvider.start()` — bắt đầu nhận diện giọng nói (STT).
   - `AudioRecorder.start()` — ghi âm thô để phát lại ("Hear yourself").
   - Một timer dự phòng (`getListenDuration`, Player.tsx:44) sẽ tự gọi
     `finishListening()` nếu người dùng không chủ động dừng.
4. Người dùng bấm nút tick xanh trong `MicIndicator` (component
   [`MicIndicator.tsx`](../app/src/components/Speech/MicIndicator.tsx)) khi
   nói xong → gọi thẳng `finishListening()`. Đây là cách dừng **chính**;
   timer ở bước 3 chỉ là lưới an toàn phòng khi người dùng quên bấm.
5. `finishListening()` (Player.tsx:183) — dừng đồng thời
   `provider.stop()` + `recorder.stop()`, chấm điểm bằng
   `provider.score(practiceTarget, speechResult)`, hiển thị `RewardPopup`.
   Có chốt `finishingRef` để không chạy trùng nếu nút bấm và timer trùng
   thời điểm.

## Kiến trúc / abstraction

Hai interface tách biệt, mỗi cái có bản Web và bản Capacitor (native), chọn
qua `Capacitor.isNativePlatform()`:

| Interface | File | Bản Web | Bản Native |
|---|---|---|---|
| `SpeechProvider` (STT + chấm điểm) | `services/Speech/types.ts` | `WebSpeechProvider.ts` (Web Speech API) | `CapacitorSpeechProvider.ts` (`@capacitor-community/speech-recognition`) |
| `AudioRecorder` (ghi âm để phát lại) | `services/Recording/types.ts` | `WebAudioRecorder.ts` (`MediaRecorder`) | `CapacitorAudioRecorder.ts` |

Factory chọn implementation: `services/Speech/index.ts` và
`services/Recording/index.ts` (`getSpeechProvider()` / `getAudioRecorder()`,
cache singleton).

Chấm điểm nằm riêng trong
[`services/Speech/scoring.ts`](../app/src/services/Speech/scoring.ts) —
hàm `scorePronunciation(expectedText, transcript)`: so khớp từ **không theo
thứ tự** giữa transcript và câu gốc, tính tỷ lệ khớp → 1-5 sao. Cả hai
`SpeechProvider` đều gọi chung hàm này trong `score()`.

## Các bug đã gặp & đã sửa (2026-07-26)

Bối cảnh: người dùng báo ghi âm hay bị ngắt giữa chừng, khó khớp với câu
ngắn dù đọc đúng. Quá trình sửa qua vài vòng, có lúc sửa sai làm tệ hơn —
ghi lại chi tiết để lần sau không lặp lại các giả định sai.

1. **Bị ngắt giữa chừng (nguyên nhân gốc)** — `LISTEN_DURATION_MS = 3200`
   trước đây là timer **cố định** cho mọi câu, dù comment ghi là "fallback".
   Thực tế đây là cơ chế dừng ghi âm chính (không có nút dừng thủ công, không
   VAD/silence detection). Câu dài hơn 3.2s bị cắt giữa chừng.
   → Sửa: `getListenDuration()` (Player.tsx:44) tính thời lượng theo số từ
   trong câu (base 2200ms + 650ms/từ + 900ms đệm, giới hạn 4-12s).

2. **Khó khớp câu ngắn** — `scorePronunciation` cũ yêu cầu khớp **chuỗi
   tuyệt đối** từng từ. Với câu 1-2 từ, chỉ cần STT nghe nhầm 1 âm là ratio
   rơi thẳng xuống 0 hoặc 0.5 (không có "khớp một phần" như câu dài).
   → Sửa: thêm `isCloseMatch()` (scoring.ts:36) dùng Levenshtein distance,
   cho phép sai lệch nhỏ tùy độ dài từ trước khi coi là không khớp.

3. **Sửa timer ở bug #1 khiến kết quả TỆ HƠN — chỉ nhận được 1 từ** — nguyên
   nhân không phải do thời lượng, mà do một bug có sẵn bị lộ ra khi thời
   lượng dài hơn: `WebSpeechProvider` trước đây **không có handler nào lắng
   nghe `recognition.onend` trong lúc đang nghe** (chỉ gán khi chủ động gọi
   `stop()`). Chrome tự động kết thúc phiên nhận diện sau một khoảng lặng
   ngắn dù `continuous = true`. Khi việc này xảy ra sớm (thường ngay sau từ
   đầu), phiên "chết" âm thầm — đợi thêm bao lâu ở tầng Player cũng không
   giúp được vì mic không còn thực sự lắng nghe. Cửa sổ ghi ngắn (3.2s) vô
   tình che giấu bug này vì ít thời gian để nó xảy ra; cửa sổ dài hơn làm nó
   lộ rõ và có vẻ như "tệ đi".
   → Sửa: thêm `stopRequested` flag + `onend` handler thường trực
   (WebSpeechProvider.ts) — nếu phiên kết thúc mà không phải do mình chủ
   động dừng, tự `recognition.start()` lại ngay. Kèm theo `baseTranscript`
   để gộp transcript giữa các lần restart nội bộ (mỗi lần restart,
   `event.results` của Chrome reset về đầu, nếu không gộp sẽ mất từ đã nhận
   trước đó).

4. **Giải pháp cuối cùng cho việc ngắt giữa chừng: nút dừng thủ công** — dù
   đã vá timer + auto-restart, việc đoán đúng thời lượng bằng heuristic vẫn
   rủi ro và khó kiểm chứng khi không nghe được audio thật. Thêm nút tick
   xanh trong `MicIndicator` để người dùng tự quyết định khi nào dừng, thay
   vì phụ thuộc vào ước lượng. Timer tự động vẫn giữ lại làm lưới an toàn.

## Giới hạn / rủi ro còn tồn tại (chưa kiểm chứng đầy đủ)

- **`CapacitorSpeechProvider` (native Android/iOS) chưa được test thực tế**
  với các thay đổi trên. Plugin native có thể có auto-stop-on-silence riêng
  của hệ điều hành (khác cơ chế `onend` của Web Speech API) — bug #3 có thể
  có biến thể tương ứng ở native chưa được xử lý.
- Không có VAD (voice activity detection) thật sự — thời lượng ghi âm mặc
  định (khi không bấm nút dừng) vẫn là ước lượng theo số từ, không phải
  phát hiện im lặng. Nút dừng thủ công là cách né chính, không phải giải
  pháp triệt để.
- Web Speech API cần mạng (audio được gửi lên server nhận diện của
  trình duyệt) — độ trễ/chất lượng mạng ảnh hưởng trực tiếp đến transcript,
  ngoài tầm kiểm soát của code app.
- `scorePronunciation` chỉ so khớp từ vựng (có fuzzy match ở mức từ), không
  xét ngữ pháp, thứ tự hay ngữ điệu.
- Việc chẩn đoán các bug trên chủ yếu dựa vào đọc code + phân tích 1 file
  âm thanh mẫu (`ffprobe` xem thời lượng) — môi trường hiện tại không có
  công cụ chuyển giọng nói thành văn bản để tự nghe/kiểm tra transcript thực
  tế, nên các giả thuyết chưa được xác nhận 100% bằng cách nghe lại nhiều
  mẫu.

## File map

| File | Vai trò |
|---|---|
| `app/src/pages/Player/Player.tsx` | Điều phối toàn bộ luồng (countdown → listening → stop → score → reward), tính `getListenDuration`. |
| `app/src/components/Speech/Countdown.tsx` | Đếm ngược 3→0 trước khi ghi âm. |
| `app/src/components/Speech/MicIndicator.tsx` | UI lúc đang nghe: mic pulsing, sound visualizer, nút dừng thủ công. |
| `app/src/components/Speech/SoundVisualizer.tsx` | Vẽ mức âm lượng theo thời gian thực (chỉ hiển thị, không ảnh hưởng logic dừng). |
| `app/src/services/Speech/types.ts` | Interface `SpeechProvider`. |
| `app/src/services/Speech/WebSpeechProvider.ts` | STT qua Web Speech API (web + fallback). |
| `app/src/services/Speech/CapacitorSpeechProvider.ts` | STT native (Android/iOS). |
| `app/src/services/Speech/scoring.ts` | `scorePronunciation()` — so khớp từ + Levenshtein fuzzy match. |
| `app/src/services/Speech/index.ts` | Factory chọn provider theo platform. |
| `app/src/services/Recording/types.ts` | Interface `AudioRecorder`. |
| `app/src/services/Recording/WebAudioRecorder.ts` | Ghi âm qua `MediaRecorder` (web). |
| `app/src/services/Recording/CapacitorAudioRecorder.ts` | Ghi âm native. |
| `app/src/services/Recording/index.ts` | Factory chọn recorder theo platform. |
| `app/src/components/RewardPopup/RewardPopup.tsx` | Hiển thị kết quả (sao, từ khớp/không khớp, nghe lại). |
