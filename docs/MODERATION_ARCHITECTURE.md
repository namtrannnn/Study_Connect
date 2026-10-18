# HỆ THỐNG AI MODERATION 4 TẦNG (NEXUS ARCHITECTURE BLUEPRINT)

> **Tài liệu đặc tả kiến trúc kiểm duyệt nội dung đa tầng (Defense-in-Depth Content Moderation Engine) cho ứng dụng StudyConnect / Nexus.**
>
> **Mục đích:** Đây là blueprint kỹ thuật dùng làm tài liệu gốc để triển khai hệ thống Moderation theo từng giai đoạn. Mọi implementation về sau phải tuân thủ các contract, state transition, decision rule và nguyên tắc được định nghĩa trong tài liệu này.

---

# 📑 MỤC LỤC

1. [Nguyên tắc thiết kế cốt lõi](#-1-nguyên-tắc-thiết-kế-cốt-lõi)
2. [Kiến trúc tổng thể](#-2-kiến-trúc-tổng-thể)
3. [Pipeline Flow](#-3-sơ-đồ-luồng-xử-lý)
4. [Moderation State Machine](#-4-moderation-state-machine)
5. [Tầng 1 - Fast Rule & Fingerprint](#-5-tầng-1)
6. [Tầng 2 - Local AI & OCR](#-6-tầng-2)
7. [Tầng 3 - Async Multimodal AI](#-7-tầng-3)
8. [Decision Engine](#-8-decision-engine)
9. [Tầng 4 - Human Moderation](#-9-tầng-4)
10. [Job Resilience & Idempotency](#-10-job-resilience--idempotency)
11. [Data Models](#-11-data-models)
12. [Signal Contract](#-12-signal-contract)
13. [Audit & MLOps](#-13-audit--mlops)
14. [Appeal System](#-14-appeal-system)
15. [Public Feed Security Rules](#-15-public-feed-security-rules)
16. [Failure & Recovery Strategy](#-16-failure--recovery-strategy)
17. [Backend Folder Structure](#-17-backend-folder-structure)
18. [Implementation Roadmap](#-18-implementation-roadmap)
19. [Production Checklist](#-19-production-checklist)

---

# 🎯 1. NGUYÊN TẮC THIẾT KẾ CỐT LÕI

## 1.1. Fast-First & Defense-in-Depth

Hệ thống sử dụng mô hình kiểm duyệt nhiều tầng:

```text
TẦNG 1
Fast Rule / Fingerprint
        ↓
TẦNG 2
Local AI / OCR
        ↓
TẦNG 3
Multimodal AI
        ↓
DECISION ENGINE
        ↓
TẦNG 4
Human Moderation
```

Mục tiêu:

- Vi phạm xác thực có thể được ngắt sớm.
- Tín hiệu nghi vấn được truyền sang tầng sâu hơn.
- Không dùng một model duy nhất để quyết định mọi trường hợp.
- Giảm chi phí AI bên ngoài.
- Có khả năng audit và giải thích quyết định.

---

## 1.2. Short-Circuit Evaluation

Nếu phát hiện **deterministic hard violation** đã được xác thực:

```text
Exact pHash Match
Verified Malicious Domain
Deterministic Rule với bằng chứng chắc chắn
```

thì pipeline có thể ngắt sớm.

Canonical state:

```text
action             = "block"
status             = "hidden"
moderationStatus   = "rejected"
```

> `block` là **moderation action**, không phải một `post.status` riêng.

Hệ thống **không tạo `status = "blocked"`** trong V1 để tránh có quá nhiều state đại diện cho cùng một trạng thái không public.

---

# 1.3. Content Risk ≠ User Reputation

## Content Risk

Đánh giá bản thân nội dung:

```text
Text
Image
Video
Audio
OCR
Context
AI Signals
```

Content Risk phải độc lập với danh tiếng người dùng.

## User Reputation

Chỉ dùng để điều khiển workflow:

```text
Queue Priority
Processing Priority
SLA
Review Priority
Rate Limiting
```

### TUYỆT ĐỐI KHÔNG

```text
User Reputation
      ↓
modify Content Risk
```

Không được:

```text
Risk = 0.50
User uy tín
      ↓
ép Active
```

Một bài vẫn phải hoàn thành moderation pipeline trước khi được public.

---

# 1.4. Local AI Signal ≠ Hard Block

Ví dụ:

```text
NSFW Score = 0.91
```

không đồng nghĩa:

```text
BLOCK
```

Mà:

```text
NSFW Score >= 0.85
        ↓
HIGH-RISK SIGNAL
        ↓
Decision Engine
```

Context có thể làm thay đổi cách đánh giá:

```text
Y tế
Giáo dục
Lịch sử
Nghệ thuật
Tin tức
Đồ bơi
```

---

# 1.5. pHash Exact Match ≠ Near Match

```text
Hamming Distance = 0
        ↓
Exact Match
        ↓
Hard Violation
        ↓
BLOCK / HIDDEN
```

Trong khi:

```text
Hamming Distance = 1..5
        ↓
Near Duplicate
        ↓
Strong Signal
        ↓
Continue Pipeline
```

Khoảng `1..5` là **ngưỡng ban đầu**, cần recalibrate bằng dữ liệu thực tế.

---

# 1.6. Decision Engine Là Điểm Hội Tụ Cuối

Decision Engine nhận:

```text
T1 Fast Signals
+
T2 Local AI / OCR Signals
+
T3 Multimodal AI Signals
+
Context
```

Decision Engine là thành phần quyết định:

```text
ALLOW
REVIEW
HIDE
```

Gemini **không được trực tiếp quyết định trạng thái Post**.

Ví dụ Gemini trả:

```json
{
  "overallRisk": 0.91
}
```

không có nghĩa service Gemini tự:

```text
post.status = "hidden"
```

Mà:

```text
Gemini
  ↓
Signal
  ↓
Decision Engine
  ↓
Final Action
```

---

# 1.7. `processing` Không Được Public

Public Feed chỉ được phép trả:

```js
Post.find({
  status: "active"
})
```

Các trạng thái sau không được xuất hiện Public Feed:

```text
processing
pending_admin
hidden
deleted
```

---

# 1.8. Không Được Fail-Open

Nếu moderation gặp lỗi:

```text
Gemini timeout
FFmpeg error
Redis unavailable
Worker crash
Unknown exception
```

**Không được tự động chuyển bài thành `active`.**

Nguyên tắc:

```text
Moderation Failure
      ↓
Không Public
      ↓
Retry
      ↓
Nếu retry thất bại
      ↓
pending_admin
```

---

# 1.9. Mọi Moderation Run Phải Có Identity

Mỗi lần moderation chạy phải có:

```text
requestId
moderationRunId
contentVersion
pipelineVersion
```

Mục đích:

- chống worker cũ ghi đè;
- trace một lần moderation xuyên suốt T1 → T3;
- audit;
- debug;
- phân biệt nhiều lần edit cùng một Post.

---

# 🔄 2. KIẾN TRÚC TỔNG THỂ

```text
                         CREATE / UPDATE POST
                                  │
                                  ▼
                       ┌─────────────────────┐
                       │ CREATE MODERATION   │
                       │ RUN / SNAPSHOT      │
                       └──────────┬──────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ TẦNG 1                  │
                    │ FAST RULE / FINGERPRINT │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              HARD VIOLATION               SIGNALS
                    │                         │
                    ▼                         ▼
                  BLOCK                    TẦNG 2
                 HIDDEN              LOCAL AI / OCR
                                              │
                                  ┌───────────┴───────────┐
                                  │                       │
                           DETERMINISTIC            SIGNALS
                            VIOLATION                  │
                                  │                    ▼
                                  ▼                  TẦNG 3
                                BLOCK          MULTIMODAL AI
                                                     │
                                                     ▼
                                          ┌───────────────────┐
                                          │ DECISION ENGINE   │
                                          └─────────┬─────────┘
                                                    │
                                ┌───────────────────┼──────────────────┐
                                │                   │                  │
                                ▼                   ▼                  ▼
                              ALLOW               REVIEW              HIDE
                                │                   │                  │
                                ▼                   ▼                  ▼
                              ACTIVE          PENDING_ADMIN          HIDDEN
                                                    │
                                                    ▼
                                             HUMAN MODERATION
                                                    │
                                             ┌──────┴──────┐
                                             ▼             ▼
                                          APPROVE        REJECT
                                             │             │
                                             ▼             ▼
                                           ACTIVE        HIDDEN
```

---

# 🔀 3. SƠ ĐỒ LUỒNG XỬ LÝ (PRE-MODERATION LIFECYCLE)

Hệ thống áp dụng kiến trúc **Pre-moderation 2 pha (Synchronous In-Request + Asynchronous Background)** kết hợp WebSockets để tối ưu vừa an toàn bảo mật 100% cho cộng đồng vừa không làm đơ giật trải nghiệm người đăng:

```text
NGƯỜI DÙNG BẤM "ĐĂNG BÀI" (POST /api/v1/posts)
    │
    ▼
[PHA 1: SYNCHRONOUS IN-REQUEST (0 – 50ms)]
    │
    ├── TẦNG 1: Fast Regex / Blacklist Pattern Matching (0ms)
    └── TẦNG 2: Local pHash Check / Fast Hash Match (2–5ms)
    │
    ├── [PHÁT HIỆN HARD VIOLATION]
    │       └── ❌ Short-Circuit: Trả về HTTP 400 Bad Request ngay lập tức
    │
    └── [VƯỢT QUA TẦNG 1 & 2]
            │
            ├── Lưu Database: status = "processing", moderationStatus = "pending"
            ├── Đẩy Job vào Moderation Queue (hoặc Background Worker)
            └── ⚡ Trả về HTTP 201 Created ngay cho Người đăng!
                     (Tác giả thấy bài đăng có badge: "Đang kiểm duyệt...")
                     (Public Feed CHƯA THẤY BÀI NÀY - Zero Exposure)

                                   │
                                   ▼
[PHA 2: ASYNC BACKGROUND MODERATION (1 – 3 giây)]
    │
    ├── Worker bốc Job (Atomic Lock trên DB hoặc BullMQ)
    ├── TẦNG 2 (Sâu): Selective OCR (nếu có nghi vấn)
    ├── TẦNG 3: Multimodal Context AI (Gemini 1.5/2.0 Flash)
    │       ├── Đóng gói Text Caption + Base64 Inline Images
    │       └── Phân tích chéo Ngữ cảnh (Context Cross-Check)
    │
    ▼
DECISION ENGINE (Single Source of Truth)
    │
    ├── [ALLOW: overallRisk < 0.40]
    │       ├── status = "active", moderationStatus = "approved"
    │       ├── Ghi ModerationLog (source = "system")
    │       └── 📡 Bắn Socket.io: Bài viết chính thức hiện trên Public Feed!
    │
    ├── [REVIEW: 0.40 <= overallRisk < 0.80 hoặc Critical Signal]
    │       ├── status = "pending_admin", moderationStatus = "review"
    │       ├── Ghi ModerationLog (reasonCode = "HUMAN_REVIEW")
    │       └── Đẩy vào Hàng chờ Duyệt tay (TẦNG 4 - Admin Queue)
    │
    └── [HIDE: overallRisk >= 0.80]
            ├── status = "hidden", moderationStatus = "rejected"
            ├── Ghi ModerationLog (violationReason)
            └── 🔔 Bắn Socket.io / Thông báo tác giả: "Bài viết vi phạm tiêu chuẩn..."
```

---

# 🔐 4. MODERATION STATE MACHINE

## 4.1. Post Status

```text
processing
active
pending_admin
hidden
deleted
```

## 4.2. Moderation Status

```text
pending
approved
review
rejected
```

---

## 4.3. State Transition Matrix

| Current | Event | Next | Actor |
|---|---|---|---|
| processing | T1 hard violation | hidden | system |
| processing | T2 hard violation | hidden | system |
| processing | Decision ALLOW | active | system |
| processing | Decision REVIEW | pending_admin | system |
| processing | Decision HIDE | hidden | system |
| pending_admin | Admin APPROVE | active | human |
| pending_admin | Admin REJECT | hidden | human |
| hidden | Appeal APPROVE | active | human |
| hidden | Appeal REJECT | hidden | human |
| active | User DELETE | deleted | user |
| processing | User DELETE | deleted | user |
| pending_admin | User DELETE | deleted | user |

### Không được phép

```text
processing → active
```

nếu chưa có Decision Engine hoặc Human Moderation quyết định.

---

# 🟢 5. TẦNG 1 — FAST RULE & FINGERPRINT

## Target

```text
Target latency: < 5–20ms
External API cost: 0
```

> Đây là target, không phải SLA cứng.

Local CPU/RAM vẫn có infrastructure cost.

---

## 5.1. Text Inspection

Sử dụng:

```text
Pattern Matching
Keyword
URL / Domain
Phone Pattern
Bank Account Pattern
Frequency
Rate Detection
```

Không cố thực hiện semantic intent bằng Regex.

Semantic Context / Intent chủ yếu được xử lý ở Tầng 3.

---

## 5.2. pHash

```text
Hamming = 0
→ Exact Match
→ Hard Violation
→ BLOCK
```

```text
Hamming = 1..5
→ Near Duplicate
→ Strong Signal
→ Continue
```

---

## 5.3. Spam / Behavior

Theo dõi:

```text
Posts / minute
Comments / minute
Repeated content
Repeated URLs
Repeated images
```

Tầng 1 có thể:

```text
Rate Limit
```

nhưng không được dùng behavior score để thay đổi Content Risk.

---

## 5.4. T1 Signal Output

T1 phải trả về format thống nhất:

```json
{
  "stage": "T1",
  "hardViolation": false,
  "signals": [
    {
      "type": "near_phash",
      "severity": "high",
      "confidence": 0.94,
      "evidence": "hamming_distance=3"
    }
  ]
}
```

---

# 🔵 6. TẦNG 2 — LOCAL AI & OCR

## Target

```text
Target latency: 20–50ms
External API cost: 0
```

Đây cũng là target, không phải guarantee.

---

# 6.1. NSFW Classification

Model:

```text
nsfwjs
```

Các class:

```text
Porn
Hentai
Sexy
Neutral
Drawing
```

Output:

```json
{
  "porn": 0.91,
  "hentai": 0.02,
  "sexy": 0.05,
  "neutral": 0.01,
  "drawing": 0.01
}
```

Quy tắc:

```text
NSFW >= 0.85
→ HIGH-RISK SIGNAL
```

Không được tự động:

```text
NSFW >= 0.85 → BLOCK
```

---

# 6.2. Selective OCR

Tool:

```text
tesseract.js
```

Chỉ chạy khi có lý do nghi vấn.

Ví dụ:

```text
QR Code
Bank Account
Phone Number
Lottery / Gambling
Suspicious Advertisement
Scam Text
```

Không OCR mọi ảnh mặc định nếu không cần thiết.

---

# 6.3. T2 Deterministic Violation

Chỉ được coi là Hard Violation nếu có bằng chứng deterministic được xác thực.

Nếu có:

```text
Deterministic Hard Violation
```

thì:

```text
action = block
status = hidden
moderationStatus = rejected
```

Nếu chỉ là:

```text
NSFW Signal
OCR Suspicious
Near Duplicate
```

thì:

```text
→ T3
```

---

# 6.4. T2 Signal Output

```json
{
  "stage": "T2",
  "hardViolation": false,
  "signals": [
    {
      "type": "nsfw",
      "severity": "high",
      "confidence": 0.91,
      "evidence": "porn=0.91"
    },
    {
      "type": "ocr_scam",
      "severity": "medium",
      "confidence": 0.78,
      "evidence": "suspicious bank information detected"
    }
  ]
}
```

---

# 🟡 7. TẦNG 3 — ASYNC MULTIMODAL AI

## Target

```text
Target: 1–3 seconds+
Execution: Background Queue
External API: Gemini
```

Latency thực tế phụ thuộc:

```text
Media size
Video duration
FFmpeg
STT
Network
Gemini
Queue load
```

---

# 7.1. BullMQ

Kiến trúc:

```text
API
 ↓
Redis
 ↓
BullMQ
 ↓
Moderation Worker
 ↓
T3
 ↓
Decision Engine
```

API không nên giữ HTTP request chờ Gemini hoàn thành.

---

# 7.2. Video Sampling

Không mặc định cắt từng giây.

Sử dụng:

```text
10–20 representative keyframes
```

kết hợp với:

```text
Scene change
Duration
Important timestamps
```

Con số `10–20` là initial configuration, cần điều chỉnh theo dữ liệu.

---

# 7.3. Audio / STT

Video có audio:

```text
Video
 ↓
FFmpeg
 ↓
Audio
 ↓
STT
 ↓
Transcript
```

Transcript trở thành một input của Multimodal Context AI.

---

# 7.4. Gemini Output Contract

Gemini chỉ trả **signals**, không trực tiếp update Post.

```json
{
  "overallRisk": 0.65,
  "categories": {
    "sexual": 0.02,
    "violence": 0.71,
    "harassment": 0.20,
    "hate": 0.05,
    "scam": 0.10,
    "spam": 0.08
  },
  "severity": "medium",
  "reason": "Phát hiện hình ảnh vết thương nghi bạo lực nhưng ngữ cảnh có thể là giáo dục/y tế",
  "evidence": [
    "visible injury",
    "medical context"
  ]
}
```

Tất cả score:

```text
0.0 ≤ score ≤ 1.0
```

---

# 7.5. Media Packaging Specification (Multimodal Input Handling)

Gemini không được phép chỉ nhận Text Caption đơn thuần. Để đảm bảo phát hiện được mã QR lừa đảo, ảnh cờ bạc, ảnh khiêu dâm hoặc bạo lực, Tầng 3 bắt buộc phải đóng gói Media theo chuẩn sau:

1. **Images (Hình ảnh):**
   - Đọc buffer từ URL lưu trữ nội bộ (Cloudinary / S3 / Local storage).
   - Resize/Compress nếu kích thước quá lớn (> 2MB) để giảm payload và tối ưu độ trễ.
   - Chuyển đổi thành định dạng Gemini Inline Data Part:
     ```json
     {
       "inlineData": {
         "mimeType": "image/jpeg",
         "data": "<BASE64_ENCODED_STRING>"
       }
     }
     ```
2. **Video & Keyframe Sampling:**
   - Sử dụng `fluent-ffmpeg` trích xuất 5 - 15 frame đại diện (dựa vào Scene Change Detection).
   - Đóng gói danh sách frame này thành các image parts tuần tự gửi kèm Transcript (nếu có audio) cho Gemini.
3. **Cross-Context Prompting:**
   - Prompt bắt buộc Gemini phải đối chiếu chéo giữa Caption và Media (ví dụ: Caption ghi "Tài liệu học tập" nhưng ảnh hiển thị mã QR thanh toán hoặc link cá độ).

---

# 7.6. Gemini Quota & Rate Limiting Strategy

Để ngăn chặn lỗi sập hệ thống do vượt ngưỡng API Quota (HTTP 429 Too Many Requests):

1. **Free Tier vs Paid Tier:**
   - Free Tier: Giới hạn **15 RPM (Requests Per Minute)**.
   - Paid Tier (Pay-As-You-Go): Giới hạn cao hơn (1000+ RPM).
2. **Worker Concurrency & Throttling:**
   - Cấu hình Worker Queue với `concurrency: 2 - 5` để kiểm soát tốc độ gửi request.
   - Áp dụng cơ chế Throttling giữa các job (khoảng delay tối thiểu 500ms - 1s giữa các lượt gọi API đối với Free Tier).
3. **HTTP 429 Resilience:**
   - Khi nhận mã lỗi 429 (Resource Exhausted), Worker tự động kích hoạt **Exponential Backoff with Jitter** (thử lại sau 2s, 4s, 8s...).

---

# 7.7. Dynamic Model Configuration

Không hard-code chuỗi tên model trong source code. Phải load qua biến môi trường để sẵn sàng nâng cấp hoặc fallback:

```env
GEMINI_MODEL=gemini-1.5-flash
```

Các model khuyến nghị:
- `gemini-1.5-flash`: Tốc độ cực nhanh (< 1.5s), chi phí thấp, tối ưu nhất cho Moderation thời gian thực.
- `gemini-2.0-flash`: Thế hệ mới cho độ chính xác cao hơn trong nhận diện ngữ cảnh tiếng Việt phức tạp.

---

# 🧠 8. DECISION ENGINE

Decision Engine là **single source of truth cho final moderation decision**.

---

# 8.1. Input

```text
T1 Signals
T2 Signals
T3 Signals
Post Context
Content Type
Content Version
```

Ví dụ:

```json
{
  "requestId": "...",
  "moderationRunId": "...",
  "contentVersion": 4,
  "t1": {},
  "t2": {},
  "t3": {}
}
```

---

# 8.2. Decision Priority

Decision Engine xử lý theo thứ tự:

```text
1. Deterministic Hard Violation
2. Critical Signal Combination
3. Calibrated Risk
4. Default Safe/Review Policy
```

---

# 8.3. Decision Matrix V1

```text
IF deterministicHardViolation
    → BLOCK
    → HIDDEN
    → REJECTED

ELSE IF criticalSignalCombination
    → REVIEW
    → PENDING_ADMIN
    → REVIEW

ELSE IF overallRisk < 0.40
    → ALLOW
    → ACTIVE
    → APPROVED

ELSE IF overallRisk < 0.80
    → REVIEW
    → PENDING_ADMIN
    → REVIEW

ELSE
    → HIDE
    → HIDDEN
    → REJECTED
```

---

# 8.4. Critical Signal Combination

Ví dụ V1:

```text
Near pHash
+
Local NSFW High
+
Scam OCR
```

→ `REVIEW`

Đây là rule có thể mở rộng:

```text
criticalSignalCombination[]
```

Không hard-code toàn bộ trong controller.

---

# 8.5. Risk Threshold

Initial Threshold:

```text
0.00 ───────── 0.39
       ALLOW

0.40 ───────── 0.79
       REVIEW

0.80 ───────── 1.00
       HIDE
```

> Đây chỉ là **Initial Thresholds**.

Sau khi có moderation dataset:

```text
Moderation Data
      ↓
False Positive / False Negative Analysis
      ↓
Threshold Calibration
      ↓
pipelineVersion mới
```

---

# 8.6. Không dùng Weighted Average đơn giản

Không mặc định:

```text
risk =
  T1 × weight
+ T2 × weight
+ T3 × weight
```

vì các signal không cùng bản chất.

Ví dụ:

```text
Exact Hash Match
```

không nên được coi chỉ là một điểm số cạnh:

```text
NSFW = 0.9
```

Deterministic rules có priority cao hơn probabilistic signals.

---

# 8.7. Decision Output Contract

```json
{
  "action": "review",
  "status": "pending_admin",
  "moderationStatus": "review",
  "moderationSource": "system",
  "overallRisk": 0.65,
  "reasonCode": "HUMAN_REVIEW",
  "reason": "Multiple suspicious signals detected",
  "evidence": [
    "near_phash",
    "nsfw_high",
    "ocr_suspicious"
  ]
}
```

---

# 🔴 9. TẦNG 4 — HUMAN MODERATION

Tầng 4 xử lý:

```text
status = pending_admin
```

Admin Panel hiển thị:

```text
Author
Content
Image / Video
Risk Score
Category Scores
Evidence
Reason
Pipeline Version
Model Version
Moderation History
```

---

# 9.1. APPROVE

```text
status = active
moderationStatus = approved
moderationSource = human
```

Tạo ModerationLog mới.

---

# 9.2. REJECT

```text
status = hidden
moderationStatus = rejected
moderationSource = human
```

Bắt buộc chọn:

```text
reasonCode
```

---

# 9.3. Human Decision Có Priority Cao Hơn Worker Cũ

Sau khi Admin quyết định:

```text
Worker cũ
   ↓
KHÔNG được overwrite
```

Worker phải kiểm tra:

```text
requestId
contentVersion
moderationRunId
current status
```

trước khi update.

---

# ⚙️ 10. JOB RESILIENCE & IDEMPOTENCY

# 10.1. Retry Policy

Initial configuration:

```js
{
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000
  }
}
```

---

# 10.2. Timeout

Phân biệt:

```text
Job Timeout
FFmpeg Timeout
STT Timeout
Gemini Request Timeout
```

Không coi tất cả là một timeout duy nhất.

Ví dụ:

```text
FFmpeg
→ 5s

Gemini
→ 15s

Whole Job
→ 30s
```

Các giá trị trên chỉ là ví dụ configuration, cần benchmark khi triển khai.

---

# 10.3. Dead Letter Queue

Nếu retry thất bại:

```text
Attempt 1
   ↓
Attempt 2
   ↓
Attempt 3
   ↓
FAILED
   ↓
DLQ
   ↓
pending_admin
```

Không:

```text
FAILED
 ↓
ACTIVE
```

---

# 10.4. Idempotency

Một job retry nhiều lần không được tạo:

```text
duplicate ModerationLog
duplicate state transition
duplicate side effect
```

Job cần có:

```text
jobId
moderationRunId
requestId
contentVersion
```

---

# 10.5. Stale Worker Protection

Worker chỉ được update nếu:

```text
worker.requestId === post.requestId
AND
worker.contentVersion === post.contentVersion
AND
worker.moderationRunId === post.activeModerationRunId
```

Nếu không:

```text
STALE_RESULT
→ discard
→ audit log
```

---

# 10.6. User Edit Trong Khi Moderation

Ví dụ:

```text
Post Version 1
    ↓
Moderation Run A

User Edit
    ↓
Post Version 2
    ↓
Moderation Run B
```

Nếu:

```text
Run A hoàn thành sau Run B
```

thì Run A không được overwrite Run B.

---

# 10.7. User Delete Trong Khi Moderation

Nếu:

```text
post.status = deleted
```

Worker không được đổi:

```text
deleted → active
```

Worker chỉ ghi audit:

```text
MODERATION_RESULT_DISCARDED_POST_DELETED
```

---

# 10.8. Database Atomic Lock (Khi triển khai Polling Worker)

Trong giai đoạn đầu nếu chưa dựng cụm Redis + BullMQ độc lập mà dùng Background Interval Worker trên Node.js, bắt buộc phải áp dụng **Atomic Lock trên MongoDB** để chống trùng lặp dữ liệu và Race Condition giữa các lượt quét:

```js
// Bốc bài và khóa ngay lập tức trong 1 atomic operation
const postToProcess = await Post.findOneAndUpdate(
  {
    status: "processing",
    $or: [
      { lockedAt: null },
      { lockedAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } } // Tự nhả lock nếu worker cũ bị treo quá 5 phút
    ]
  },
  {
    $set: { lockedAt: new Date() }
  },
  { new: true }
);
```

---

# 10.9. Quy chuẩn Triệt Để: Loại Bỏ Hoàn Toàn "Fail-Open"

Nghiêm cấm mọi đoạn code có dạng:
```js
// NGUY HIỂM - CẤM TUYỆT ĐỐI:
catch (error) {
  return { isAllowed: true, riskScore: 0 };
}
```

**Quy tắc xử lý sự cố:**
1. Khi Gemini API timeout, mạng chập chờn, hoặc hết quota 429: Worker bắt buộc phải **giữ nguyên trạng thái `status: 'processing'`** và kích hoạt cơ chế retry (tối đa 3 lần).
2. Nếu sau 3 lần retry vẫn thất bại: Chuyển `status = 'pending_admin'`, `moderationStatus = 'review'`, gán `reasonCode = 'SYSTEM_FAILURE'` và lưu `ModerationLog`.
3. Bài viết **không bao giờ được tự động chuyển thành `active`** khi hệ thống gặp lỗi kỹ thuật.

---

# 📊 11. DATA MODELS

# 11.1. Post

```js
status: {
  type: String,
  enum: [
    "processing",
    "active",
    "pending_admin",
    "hidden",
    "deleted"
  ],
  default: "processing",
  index: true
},

moderationStatus: {
  type: String,
  enum: [
    "pending",
    "approved",
    "rejected",
    "review"
  ],
  default: "pending",
  index: true
},

moderationSource: {
  type: String,
  enum: [
    "rule",
    "nsfwjs",
    "gemini",
    "human",
    "system"
  ],
  default: "system"
},

requestId: {
  type: String,
  index: true
},

contentVersion: {
  type: Number,
  default: 1
},

activeModerationRunId: {
  type: String,
  index: true
}
```

---

# 11.2. ModerationLog

```js
const moderationLogSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    index: true
  },

  moderationRunId: {
    type: String,
    required: true,
    index: true
  },

  contentVersion: {
    type: Number,
    required: true
  },

  pipelineVersion: {
    type: String,
    default: "v1.0.0"
  },

  modelVersion: {
    type: String,
    default: "gemini-3.6-flash"
  },

  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "post",
    required: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true
  },

  action: {
    type: String,
    enum: [
      "allow",
      "hold",
      "hide",
      "block",
      "approve",
      "reject"
    ],
    required: true
  },

  source: {
    type: String,
    enum: [
      "rule",
      "nsfwjs",
      "gemini",
      "human",
      "system"
    ],
    required: true
  },

  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },

  overallRisk: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },

  categories: {
    sexual: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },

    violence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },

    harassment: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },

    hate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },

    scam: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },

    spam: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },

  severity: {
    type: String,
    enum: ["low", "medium", "high"]
  },

  reason: String,

  reasonCode: {
    type: String,
    enum: [
      "SCAM_LINK",
      "SEXUAL_CONTENT",
      "VIOLENCE",
      "HARASSMENT",
      "HATE",
      "SPAM_FLOOD",
      "BLACKLISTED_HASH",
      "MALICIOUS_DOMAIN",
      "HUMAN_REVIEW",
      "SYSTEM_FAILURE",
      "STALE_RESULT",
      "POST_DELETED"
    ]
  },

  evidence: [String],

  ruleId: String,

  stage: {
    type: String,
    enum: [
      "T1",
      "T2",
      "T3",
      "DECISION",
      "T4",
      "SYSTEM"
    ]
  },

  processingTimeMs: Number,

  previousStatus: String,

  newStatus: String,

  errorCode: String,

  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }
}, {
  timestamps: true
});
```

---

# 11.3. BlacklistedHash

BlacklistedHash dùng để lưu fingerprint đã được xác định.

```js
const blacklistedHashSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  hashType: {
    type: String,
    enum: ["phash"],
    default: "phash"
  },

  reasonCode: {
    type: String,
    required: true
  },

  source: {
    type: String,
    enum: ["system", "human", "import"],
    default: "system"
  },

  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  },

  active: {
    type: Boolean,
    default: true
  },

  note: String
}, {
  timestamps: true
});
```

---

# 11.4. Appeal

```js
const appealSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "post",
    required: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true
  },

  reason: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: [
      "pending",
      "approved",
      "rejected"
    ],
    default: "pending"
  },

  adminNote: String,

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },

  reviewedAt: Date
}, {
  timestamps: true
});
```

---

# 11.5. Content Snapshot

Mỗi Moderation Run cần biết AI thực sự kiểm tra nội dung nào.

Snapshot tối thiểu:

```text
postId
contentVersion
textHash
mediaHash[]
mediaUrl[]
createdAt
```

Không nhất thiết phải copy toàn bộ media.

Mục tiêu là đảm bảo:

```text
Moderation Run A
→ kiểm tra Version 1

Moderation Run B
→ kiểm tra Version 2
```

---

# 🔗 12. SIGNAL CONTRACT

Các tầng không được tự định nghĩa output tùy ý.

Tất cả dùng concept:

```js
{
  stage,
  hardViolation,
  signals
}
```

Signal:

```js
{
  type,
  severity,
  confidence,
  evidence,
  metadata
}
```

Ví dụ:

```json
{
  "stage": "T2",
  "hardViolation": false,
  "signals": [
    {
      "type": "nsfw",
      "severity": "high",
      "confidence": 0.91,
      "evidence": "porn=0.91",
      "metadata": {
        "class": "Porn"
      }
    }
  ]
}
```

Điều này giúp Decision Engine không phụ thuộc implementation bên trong T1/T2/T3.

---

# 🧾 13. AUDIT & MLOPS

Mỗi moderation run cần trace được:

```text
requestId
moderationRunId
postId
userId
contentVersion
pipelineVersion
modelVersion
stage
action
source
confidence
overallRisk
categories
evidence
processingTimeMs
previousStatus
newStatus
errorCode
createdAt
```

---

# 13.1. `moderationSource` ≠ `evidence`

Ví dụ:

```text
NSFWJS phát hiện NSFW
Gemini xác nhận context
Human quyết định Reject
```

thì:

```text
moderationSource = human
```

Nhưng:

```text
evidence =
[
  "nsfwjs:porn=0.91",
  "gemini:sexual=0.88",
  "human:confirmed"
]
```

`moderationSource` = nguồn chịu trách nhiệm cho **final action**.

`evidence` = tất cả bằng chứng được thu thập.

---

# 13.2. Pipeline Version

Mỗi thay đổi lớn:

```text
Rule
Threshold
Decision Matrix
Model
Prompt
Sampling
```

có thể tạo:

```text
pipelineVersion
```

Ví dụ:

```text
v1.0.0
v1.1.0
v2.0.0
```

Mục đích:

```text
Moderation Result
→ biết được pipeline nào tạo ra kết quả
```

---

# 📮 14. APPEAL SYSTEM

## User

Nếu bài bị:

```text
hidden
```

User có thể tạo Appeal:

```text
POST /appeals
```

---

## Admin

```text
pending
   ↓
Admin Review
   ├── APPROVED
   └── REJECTED
```

### Appeal APPROVED

```text
post.status = active
post.moderationStatus = approved
```

Tạo ModerationLog:

```text
action = approve
source = human
```

### Appeal REJECTED

```text
post.status = hidden
post.moderationStatus = rejected
```

Tạo ModerationLog:

```text
action = reject
source = human
```

---

## Không được bypass moderation

Appeal chỉ thay đổi trạng thái sau quyết định của Human.

Không:

```text
Appeal Created
→ Automatically Active
```

---

# 🌐 15. PUBLIC FEED SECURITY RULES

Public Feed phải enforce server-side:

```js
Post.find({
  status: "active"
})
```

Không tin:

```text
Frontend filter
```

Không được:

```text
Frontend nhận hidden rồi tự hide
```

Database/API phải đảm bảo bài chưa approved không thể xuất hiện public.

---

# 🛡️ 16. FAILURE & RECOVERY STRATEGY

| Failure | Action |
|---|---|
| T1 exception | Fail closed → pending_admin |
| T2 exception | Retry / pending_admin |
| FFmpeg failure | Retry |
| STT failure | Retry |
| Gemini timeout | Retry |
| Gemini API unavailable | Retry |
| Redis unavailable | Không public bài mới |
| Worker crash | BullMQ retry |
| 3 retries failed | DLQ |
| DLQ | pending_admin |
| Worker stale | Discard result |
| Post deleted | Discard result |
| Admin already decided | Worker không overwrite |

---

# 📁 17. BACKEND FOLDER STRUCTURE

```text
backend/
├── api/v1/
│   ├── controllers/
│   │   ├── post.controller.js
│   │   ├── adminModeration.controller.js
│   │   └── appeal.controller.js
│   │
│   ├── models/
│   │   ├── post.model.js
│   │   ├── blacklistedHash.model.js
│   │   ├── moderationLog.model.js
│   │   └── appeal.model.js
│   │
│   └── routes/
│       ├── adminModeration.route.js
│       └── appeal.route.js
│
├── helpers/
│   └── moderation/
│       ├── stage1_fastFilter.helper.js
│       ├── stage2_localVision.helper.js
│       ├── signalBuilder.helper.js
│       └── index.js
│
├── services/
│   └── moderation/
│       ├── moderationOrchestrator.service.js
│       ├── decisionEngine.service.js
│       ├── stage1_fastFilter.service.js
│       ├── stage2_localVision.service.js
│       ├── stage3_asyncQueue.service.js
│       ├── stage3_deepContextAI.service.js
│       ├── moderationSnapshot.service.js
│       ├── moderationAudit.service.js
│       └── stage4_adminQueue.service.js
│
├── workers/
│   └── moderation/
│       ├── moderation.worker.js
│       └── moderation.dlq.worker.js
│
├── queues/
│   └── moderation.queue.js
│
└── docs/
    └── MODERATION_ARCHITECTURE.md
```

---

# 🚀 18. IMPLEMENTATION ROADMAP

Không triển khai tất cả cùng lúc.

## Phase 1 — Foundation

```text
Post Status
Moderation Status
Moderation Source
requestId
contentVersion
activeModerationRunId
```

Implement:

```text
State Transition
Public Feed Filtering
ModerationLog
```

---

## Phase 2 — Tầng 1

```text
Keyword / Pattern
URL / Domain
Rate Detection
pHash
BlacklistedHash
```

Implement:

```text
stage1_fastFilter
```

---

## Phase 3 — Tầng 2

```text
nsfwjs
tesseract.js
OCR Trigger
Signal Contract
```

Implement:

```text
stage2_localVision
```

---

## Phase 4 — Queue

```text
Redis
BullMQ
Worker
Retry
Timeout
DLQ
```

Implement:

```text
stage3_asyncQueue
```

---

## Phase 5 — Tầng 3

```text
FFmpeg
Keyframe Sampling
STT
Gemini Multimodal
```

Implement:

```text
stage3_deepContextAI
```

---

## Phase 6 — Decision Engine

Implement:

```text
Decision Matrix
Critical Signal Combination
Risk Threshold
State Transition
Decision Output
```

Đây là **single source of truth** cho automated final decision.

---

## Phase 7 — Admin Moderation

Implement:

```text
Admin Queue
Review Detail
Approve
Reject
Reason Code
Audit
```

---

## Phase 8 — Appeal

Implement:

```text
Create Appeal
Admin Review
Approve Appeal
Reject Appeal
Audit
```

---

## Phase 9 — Observability & Calibration

Theo dõi:

```text
Processing Time
Queue Failure
False Positive
False Negative
Human Override
ALLOW → HUMAN REJECT
HIDE → HUMAN APPROVE
```

Sau đó recalibrate:

```text
Threshold
pHash Distance
NSFW Threshold
Decision Matrix
```

---

# ✅ 19. PRODUCTION CHECKLIST

## Architecture

- [ ] T1 Fast Filter
- [ ] T2 Local AI/OCR
- [ ] T3 Multimodal AI
- [ ] Decision Engine
- [ ] T4 Human Moderation
- [ ] Appeal System

## Security

- [ ] `processing` không public
- [ ] `pending_admin` không public
- [ ] `hidden` không public
- [ ] Server-side feed filtering
- [ ] Fail-closed
- [ ] Worker stale protection

## Reliability

- [ ] BullMQ (hoặc MongoDB Atomic Lock nếu dùng Polling Worker)
- [ ] Retry (tối đa 3 lần)
- [ ] Backoff (Exponential with Jitter)
- [ ] Timeout (FFmpeg 5s, Gemini 15s)
- [ ] DLQ / chuyển pending_admin khi retry hết lượt
- [ ] Idempotency
- [ ] Redis failure handling
- [ ] Gemini Rate Limiting (15 RPM free tier throttling & 429 backoff)

## Data

- [ ] `requestId`
- [ ] `moderationRunId`
- [ ] `contentVersion`
- [ ] `pipelineVersion`
- [ ] `modelVersion`
- [ ] Content Snapshot
- [ ] ModerationLog

## AI & Multimodal

- [ ] Media Packaging (Base64 Inline Data + MimeType cho Gemini)
- [ ] NSFW Signal ≠ Hard Block
- [ ] pHash Exact ≠ Near
- [ ] Gemini ≠ Final Decision
- [ ] Risk 0–1
- [ ] Category scores 0–1
- [ ] Threshold calibration
- [ ] Không Fail-Open (tuyệt đối không `return isAllowed: true` trong catch)

## Human Moderation

- [ ] Admin Queue
- [ ] Evidence
- [ ] Reason Code
- [ ] Approve
- [ ] Reject
- [ ] Appeal
- [ ] Audit

---

# 🧠 FINAL ARCHITECTURAL CONTRACT

Hệ thống Nexus Moderation V1 tuân thủ nguyên tắc:

```text
                    CONTENT
                       │
                       ▼
                ┌─────────────┐
                │     T1      │
                │ FAST RULE   │
                │   pHash     │
                └──────┬──────┘
                       │
              ┌────────┴────────┐
              │                 │
           HARD              SIGNAL
              │                 │
              ▼                 ▼
            BLOCK              T2
           HIDDEN          LOCAL AI/OCR
                                │
                       ┌────────┴────────┐
                       │                 │
                    HARD             SIGNAL
                       │                 │
                       ▼                 ▼
                     BLOCK              T3
                                      GEMINI
                                        │
                                        ▼
                                DECISION ENGINE
                                        │
                         ┌──────────────┼──────────────┐
                         │              │              │
                         ▼              ▼              ▼
                       ALLOW          REVIEW          HIDE
                         │              │              │
                         ▼              ▼              ▼
                       ACTIVE     PENDING_ADMIN       HIDDEN
                                        │
                                        ▼
                                  HUMAN REVIEW
                                        │
                              ┌─────────┴─────────┐
                              ▼                   ▼
                           APPROVE              REJECT
                              │                   │
                              ▼                   ▼
                            ACTIVE              HIDDEN
```

### Các invariant bắt buộc

```text
1. Không có bài nào được ACTIVE chỉ vì User Reputation.

2. NSFW Score chỉ là Signal, không tự động là Hard Block.

3. Gemini chỉ cung cấp Signal, Decision Engine mới quyết định.

4. Exact pHash Match có thể Short-Circuit.

5. Near pHash Match không mặc định là Block.

6. processing / pending_admin / hidden không được Public Feed.

7. Moderation Failure không được Fail-Open.

8. Worker cũ không được overwrite kết quả mới.

9. Human Decision có priority cao hơn Worker đang chạy.

10. Mọi quyết định phải có Audit Trail.

11. Mọi Moderation Run phải xác định được Content Version.

12. Threshold là Initial Configuration và phải được Calibration bằng dữ liệu thực tế.
```

> **Đây là contract nền tảng của Nexus Moderation V1. Các implementation về sau phải tuân thủ các invariant trên, trừ khi blueprint được cập nhật có chủ đích và tăng `pipelineVersion`.**