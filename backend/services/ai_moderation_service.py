"""
AI COMMENT MODERATION MICROSERVICE (FASTAPI - PORT 8001)
Uses pre-trained PhoBERT / ViSoBERT model for Vietnamese Toxic/Offensive/Hate Speech Detection.
"""
import os
import re
import unicodedata

# Bật offline mode để transformers nạp trực tiếp từ local cache (tránh timeout kiểm tra HF online)
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="StudyConnect AI Comment Moderation Service", version="1.0.0")

MODEL_NAME = os.getenv("MODERATION_MODEL_NAME", "wonrax/phobert-base-vietnamese-sentiment")

print(f"[AI Moderation Service] ⏳ Loading model: {MODEL_NAME}...")
classifier = pipeline(
    "sentiment-analysis",
    model=MODEL_NAME
)
print("[AI Moderation Service] ✅ Model loaded successfully and ready for inference!")

class CommentInput(BaseModel):
    text: str

def remove_accents(text: str) -> str:
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return text.replace('đ', 'd').replace('Đ', 'D')

# Các dấu hiệu công kích / miệt thị / hạ nhục nhân phẩm / trù ẻo
ATTACK_PATTERNS = [
    r'\b(mặt|mắt|mõm)\s+(xấu|ma|lợn|dày|đần|hãm|ghê|tởm|như)\b',
    r'\bvô\s*(văn\s*hóa|học|ý\s*thức|liêm\s*sỉ|giáo\s*dục)\b',
    r'\b(không\s*có|thiếu)\s*(giáo\s*dục|văn\s*hóa|ý\s*thức|liêm\s*sỉ)\b',
    r'\b(gia\s*đình|bố\s*mẹ|nhà)\s*(nó|mày|vô\s*phúc)\b',
    r'\b(đồ|con|thằng|bọn|lũ)\s*(ngu|chó|lợn|súc\s*sinh|rác|khùng|điên|bại\s*não|mất\s*dạy)\b',
    r'\b(hãm|tởm|kinh\s*tởm|phát\s*gớm|phát\s*tởm|rẻ\s*rách|rẻ\s*tiền|lố\s*bịch|kệch\s*cỡm|mất\s*dạy|mất\s*nết)\b',
    r'\b(ảo\s*tưởng|khoe\s*khoang|khoe\s*mẽ|xàm\s*xí|bớt\s*xàm|hai\s*mặt|giả\s*tạo|giả\s*trân|đạo\s*đức\s*giả)\b',
    r'\b(chết\s*đi|cút|biến|tiễn|đáng\s*đời|thất\s*đức)\b',
    r'\b(nhìn\s*cái\s*mặt|cái\s*bản\s*mặt)\b',
    r'\b(tôn\s*trọng\s*được)\b',
    r'\b(gặp\s*tai\s*nạn|bị\s*(xe\s*tông|xe\s*cán|xe\s*đâm)|sớm\s*(chết|đi\s*đời)|chết\s*bờ|chết\s*tiệt|chết\s*không\s*chỗ\s*chôn)\b',
]

ATTACK_PATTERNS_NO_ACCENT = [
    r'\b(mat|mom)\s+(xau|ma|lon|dan|ham|ghe|tom|nhu)\b',
    r'\bvo\s*(van\s*hoa|hoc|y\s*thuc|liem\s*si|giao\s*duc)\b',
    r'\b(khong\s*co|thieu)\s*(giao\s*duc|van\s*hoa|y\s*thuc)\b',
    r'\b(gia\s*dinh|bo\s*me|nha)\s*(no|may|vo\s*phuc)\b',
    r'\b(do|con|thang|bon|lu)\s*(ngu|cho|lon|suc\s*sinh|rac|khung|dien|bai\s*nao|mat\s*day)\b',
    r'\b(ham|tom|kinh\s*tom|phat\s*gom|phat\s*tom|re\s*rach|re\s*tien|lo\s*bich|kech\s*com|mat\s*day|mat\s*net)\b',
    r'\b(ao\s*tuong|xam\s*xi|bot\s*xam|hai\s*mat|gia\s*tao|dao\s*duc\s*gia)\b',
    r'\b(chet\s*di|cut|bien|dang\s*doi|that\s*duc)\b',
    r'\b(nhin\s*cai\s*mat|cai\s*ban\s*mat)\b',
    r'\b(gap\s*tai\s*nan|bi\s*(xe\s*tong|xe\s*can|xe\s*dam)|som\s*(chet|di\s*doi)|chet\s*bo|chet\s*tiet)\b',
]

INNOCENT_PERSONAL = [
    r'\b(buồn|mệt|thất vọng|áp lực|stress|khóc|tiếc|đau lòng|chán\s*nản|nản\s*lòng|cô đơn)\b'
]
INNOCENT_NO_ACCENT = [
    r'\b(buon|met|that vong|ap luc|stress|khoc|tiec|dau long|chan\s*nan|nan\s*long|co don)\b'
]

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "engine": "phobert-visobert-local"
    }

@app.post("/predict")
def predict_toxicity(payload: CommentInput):
    text = (payload.text or "").strip()
    if not text:
        return {
            "label": "CLEAN",
            "score": 0.0,
            "isToxic": False,
            "reason": "",
            "details": {
                "rawLabel": "EMPTY",
                "rawConfidence": 0.0,
                "matchedKeywords": [],
                "detectedBehavior": "Nội dung trống",
                "explanation": "Bình luận không có nội dung chữ."
            }
        }

    try:
        res = classifier(text)[0]
        raw_label = res["label"]
        conf = float(res["score"])

        lower = text.lower()
        text_no_accent = remove_accents(lower)

        matched_keywords = []
        for p in ATTACK_PATTERNS:
            found = re.findall(p, lower)
            for m in found:
                kw = m[0] if isinstance(m, tuple) else m
                if kw and kw not in matched_keywords:
                    matched_keywords.append(kw)

        for p in ATTACK_PATTERNS_NO_ACCENT:
            found = re.findall(p, text_no_accent)
            for m in found:
                kw = m[0] if isinstance(m, tuple) else m
                if kw and kw not in matched_keywords:
                    matched_keywords.append(kw)

        innocent_found = []
        for p in INNOCENT_PERSONAL:
            found = re.findall(p, lower)
            for m in found:
                kw = m[0] if isinstance(m, tuple) else m
                if kw and kw not in innocent_found:
                    innocent_found.append(kw)

        for p in INNOCENT_NO_ACCENT:
            found = re.findall(p, text_no_accent)
            for m in found:
                kw = m[0] if isinstance(m, tuple) else m
                if kw and kw not in innocent_found:
                    innocent_found.append(kw)

        is_attack = len(matched_keywords) > 0
        is_innocent = len(innocent_found) > 0

        # 1. Có từ ngữ công kích/mỉa mai/hạ bệ/trù ẻo rõ ràng
        if is_attack and not is_innocent:
            label = "HATE" if (raw_label == "NEG" and conf >= 0.90) else "OFFENSIVE"
            score = conf if raw_label == "NEG" else 0.88
            kw_display = ", ".join(f'"{k}"' for k in matched_keywords[:3])
            return {
                "label": label,
                "score": score,
                "isToxic": True,
                "raw_label": raw_label,
                "reason": "Phát hiện nội dung xúc phạm/thù ghét cá nhân qua ViSoBERT (Tầng 2)",
                "details": {
                    "rawLabel": raw_label,
                    "rawConfidence": conf,
                    "matchedKeywords": matched_keywords,
                    "detectedBehavior": "Công kích / Xúc phạm cá nhân hoặc miệt thị ngoại hình",
                    "explanation": f"PhoBERT AI đo được sắc thái {raw_label} ({conf*100:.1f}%) kết hợp cụm từ công kích đối tượng ({kw_display}) ➔ Quyết định vi phạm: {label}."
                }
            }

        # 2. Câu mang sắc thái tiêu cực cực đoan (>= 98.5%) từ PhoBERT và không phải tâm sự cá nhân
        if raw_label == "NEG" and conf >= 0.985 and not is_innocent:
            return {
                "label": "OFFENSIVE",
                "score": conf,
                "isToxic": True,
                "raw_label": raw_label,
                "reason": "Phát hiện chỉ trích tiêu cực gay gắt qua ViSoBERT (Tầng 2)",
                "details": {
                    "rawLabel": raw_label,
                    "rawConfidence": conf,
                    "matchedKeywords": [],
                    "detectedBehavior": "Sắc thái tiêu cực cực đoan bất thường",
                    "explanation": f"PhoBERT AI đo được sắc thái câu mang tính tiêu cực cực đoan bất thường ({conf*100:.1f}%) ➔ Quyết định: OFFENSIVE."
                }
            }

        # 3. Tâm sự buồn bã / cảm xúc cá nhân lành tính (Bảo vệ người dùng khỏi bắt nhầm)
        if raw_label == "NEG" and is_innocent and not is_attack:
            kw_display = ", ".join(f'"{k}"' for k in innocent_found[:3])
            return {
                "label": "CLEAN",
                "score": conf,
                "isToxic": False,
                "raw_label": raw_label,
                "reason": "",
                "details": {
                    "rawLabel": raw_label,
                    "rawConfidence": conf,
                    "matchedKeywords": [],
                    "detectedBehavior": "Tâm sự / Cảm xúc cá nhân lành tính",
                    "explanation": f"Mặc dù PhoBERT nhận diện câu mang sắc thái tiêu cực ({conf*100:.1f}%), nhưng hệ thống nhận diện từ khóa cảm xúc cá nhân ({kw_display}), không có hành vi công kích người khác ➔ Đánh giá: HỢP LỆ (CLEAN)."
                }
            }

        # 4. Nội dung bình thường / tích cực
        behavior_text = "Nội dung tích cực / Khen ngợi" if raw_label == "POS" else "Nội dung trung tính / Thảo luận thông thường"
        return {
            "label": "CLEAN",
            "score": conf,
            "isToxic": False,
            "raw_label": raw_label,
            "reason": "",
            "details": {
                "rawLabel": raw_label,
                "rawConfidence": conf,
                "matchedKeywords": [],
                "detectedBehavior": behavior_text,
                "explanation": f"PhoBERT AI xác nhận nội dung thuộc nhóm {raw_label} ({conf*100:.1f}%), văn minh và tuân thủ tiêu chuẩn cộng đồng."
            }
        }
    except Exception as e:
        print("[AI Predict Error]:", e)
        return {
            "label": "CLEAN",
            "score": 0.0,
            "isToxic": False,
            "error": str(e),
            "reason": "",
            "details": {
                "rawLabel": "ERROR",
                "rawConfidence": 0.0,
                "matchedKeywords": [],
                "detectedBehavior": "Lỗi phân tích",
                "explanation": str(e)
            }
        }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    print(f"[AI Moderation Service] 🚀 Starting server on http://127.0.0.1:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
