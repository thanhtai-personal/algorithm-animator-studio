# AI Video Agent local flow

Màn hình mới: `/ai-video-agent`.

Mục tiêu: tạo workflow giống agent content của AiToEarn nhưng chạy local trong KAI STUDIO, không cần host cloud.

## Flow hiện tại

```txt
Topic / instruction
→ AI plan/script
→ Piper voice-over local
→ tạo background PNG local
→ FFmpeg render MP4
→ lưu vào generated-videos
→ copy metadata để đăng YouTube/TikTok/Facebook thủ công hoặc qua Channel Manager
```

## Config API key

AI Video Agent dùng Gemini text model để viết plan/script. Không có API key vẫn chạy được bằng fallback local, nhưng script sẽ đơn giản hơn.

### Qua giao diện

Vào:

```txt
Settings → API Keys
```

Điền:

```txt
Gemini API key for AI Video Agent: AI_SHORTS_API_KEY
AI Agent text model: gemini-2.0-flash
Gemini API base URL: https://generativelanguage.googleapis.com/v1beta
```

### Qua `.env`

```env
AI_SHORTS_API_KEY=AIza...
AI_SHORTS_API_URL=https://generativelanguage.googleapis.com/v1beta
AI_AGENT_TEXT_MODEL=gemini-2.0-flash
```

Sau khi sửa `.env`, restart local server hoặc app desktop.

## Fake host đang dùng

App dev hiện dùng:

```txt
https://kai-studio.pro:3000
```

AI Video Agent không cần OAuth redirect, nhưng nếu tạo video xong đem đăng qua Channel Manager thì YouTube/Facebook/TikTok OAuth vẫn phải dùng cùng fake host theo hướng dẫn social provider.

## Yêu cầu local runtime

Cần sẵn:

```txt
Piper voice model
FFmpeg / FFprobe
SERVER_DATA_DIR
```

Kiểm tra ở:

```txt
Settings → Health check
```

## Job status

Agent job lưu local trong:

```txt
SERVER_DATA_DIR/ai-video-agent-jobs.json
```

Trạng thái:

```txt
draft      tạo job nháp, chưa chạy
queued     có lịch nhưng chưa tới giờ
running    đang tạo plan/voice/render
success    đã render MP4
failed     lỗi
cancelled  đã hủy
```

## Giới hạn phiên bản đầu

- Tạo video bằng 1 background PNG + voice-over, chưa phải scene animation phức tạp.
- Chưa tự publish lên Facebook/TikTok; job tạo ra video + metadata để đưa sang Channel Manager.
- Voice backend hiện ưu tiên Piper local để bảo đảm không cần cloud.
- AI chỉ dùng cho plan/script, render vẫn chạy local.

## Hướng mở rộng tiếp theo

1. Cho agent chọn template render: ProShow timeline / Remotion / Algorithm Long Content.
2. Cho agent tự gọi Story Video, MU News hoặc Algorithm renderer tùy content kind.
3. Kết nối output sang Publish Scheduler.
4. Tạo nhiều biến thể Shorts từ 1 plan dài.
5. Thêm trạng thái `needs_review` trước khi tự đăng.
