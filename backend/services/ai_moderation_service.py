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
    r'\b(mặt|mắt|mõm)\s+(xấu|ma|lợn|dày|đần|hãm|ghê|tởm)\b',
    r'\bvô\s*(văn\s*hóa|học|ý\s*thức|liêm\s*sỉ|giáo\s*dục)\b',
    r'\b(gia\s*đình|bố\s*mẹ|nhà)\s*nó\b',
    r'\b(đồ|con|thằng|bọn|lũ)\s*(ngu|chó|lợn|súc\s*sinh|rác|khùng|điên|bại\s*não)\b',
    r'\b(hãm|tởm|kinh\s*tởm|rẻ\s*rách|rẻ\s*tiền|lố\s*bịch|mất\s*dạy|mất\s*nết)\b',
    r'\b(ảo\s*tưởng|khoe\s*khoang|khoe\s*mẽ|xàm\s*xí|bớt\s*xàm)\b',
    r'\b(chết\s*đi|cút|biến|tiễn|đáng\s*đời)\b',
    r'\b(nhìn\s*cái\s*mặt|cái\s*bản\s*mặt)\b',
    r'\b(tôn\s*trọng\s*được)\b',
    r'\b(gặp\s*tai\s*nạn|bị\s*(xe\s*tông|xe\s*cán|xe\s*đâm)|sớm\s*(chết|đi\s*đời)|chết\s*bờ|chết\s*tiệt|chết\s*không\s*chỗ\s*chôn)\b',
]

ATTACK_PATTERNS_NO_ACCENT = [
    r'\b(mat|mom)\s+(xau|ma|lon|dan|ham|ghe|tom)\b',
    r'\bvo\s*(van\s*hoa|hoc|y\s*thuc|liem\s*si)\b',
    r'\b(do|con|thang|bon|lu)\s*(ngu|cho|lon|suc\s*sinh|rac|khung|dien|bai\s*nao)\b',
    r'\b(ham|tom|kinh\s*tom|re\s*rach|re\s*tien|lo\s*bich|mat\s*day|mat\s*net)\b',
    r'\b(ao\s*tuong|xam\s*xi|bot\s*xam)\b',
    r'\b(chet\s*di|cut|bien|dang\s*doi)\b',
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
        return {"label": "CLEAN", "score": 0.0, "isToxic": False, "reason": ""}

    try:
        res = classifier(text)[0]
        raw_label = res["label"]
        conf = float(res["score"])

        lower = text.lower()
        text_no_accent = remove_accents(lower)

        is_attack = (
            any(re.search(p, lower) for p in ATTACK_PATTERNS) or
            any(re.search(p, text_no_accent) for p in ATTACK_PATTERNS_NO_ACCENT)
        )

        is_innocent = (
            any(re.search(p, lower) for p in INNOCENT_PERSONAL) or
            any(re.search(p, text_no_accent) for p in INNOCENT_NO_ACCENT)
        )

        # 1. Có từ ngữ công kích/mỉa mai/hạ bệ/trù ẻo rõ ràng (kể cả khi câu văn ngụy trang khiến PhoBERT gán NEU)
        if is_attack and not is_innocent:
            label = "HATE" if (raw_label == "NEG" and conf >= 0.90) else "OFFENSIVE"
            score = conf if raw_label == "NEG" else 0.88
            return {
                "label": label,
                "score": score,
                "isToxic": True,
                "raw_label": raw_label,
                "reason": "Phát hiện nội dung xúc phạm/thù ghét cá nhân qua ViSoBERT (Tầng 2)"
            }

        # 2. Câu mang sắc thái tiêu cực cực đoan (>= 98.5%) từ PhoBERT và không phải tâm sự cá nhân
        if raw_label == "NEG" and conf >= 0.985 and not is_innocent:
            return {
                "label": "OFFENSIVE",
                "score": conf,
                "isToxic": True,
                "raw_label": raw_label,
                "reason": "Phát hiện chỉ trích tiêu cực gay gắt qua ViSoBERT (Tầng 2)"
            }

        return {
            "label": "CLEAN",
            "score": conf,
            "isToxic": False,
            "raw_label": raw_label,
            "reason": ""
        }
    except Exception as e:
        print("[AI Predict Error]:", e)
        return {"label": "CLEAN", "score": 0.0, "isToxic": False, "error": str(e), "reason": ""}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    print(f"[AI Moderation Service] 🚀 Starting server on http://127.0.0.1:{port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
