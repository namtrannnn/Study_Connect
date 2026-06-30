const { GoogleGenAI } = require("@google/genai");
const uploadStreamToCloudinary = require("../../../helpers/cloudinary.helper");
// sửa lại đúng path file cloudinary của bạn

const apiKey =
  process.env.GOOGLE_GEMINI_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();

if (!apiKey) {
  throw new Error("Missing Gemini API key in .env");
}

const ai = new GoogleGenAI({
  apiKey,
});

const cleanJsonText = (text = "") => {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
};

const generateThemeColorsWithAI = async (userPrompt) => {
  const prompt = `
Bạn là AI thiết kế theme chat cho ứng dụng StudyConnect.

Dựa vào yêu cầu sau:
"${userPrompt}"

Hãy tạo theme chat phù hợp.

Yêu cầu bắt buộc:
- Chỉ trả về JSON hợp lệ.
- Không markdown.
- Không giải thích.
- Tất cả màu phải là mã HEX hợp lệ.
- Màu phải dễ đọc.
- bubbleMe là màu khung tin nhắn của người đang đăng nhập.
- bubbleOther là màu khung tin nhắn của người còn lại.
- textMe phải tương phản tốt với bubbleMe.
- textOther phải tương phản tốt với bubbleOther.
- coverImagePrompt phải là prompt tiếng Anh để tạo ảnh cover chat.

Format:
{
  "name": "Tên theme",
  "primary": "#2563eb",
  "background": "#f4f7fb",
  "headerBackground": "#ffffff",
  "bubbleMe": "#2563eb",
  "bubbleOther": "#ffffff",
  "textMe": "#ffffff",
  "textOther": "#111827",
  "coverImagePrompt": "English prompt for generating a beautiful chat cover image"
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text;
  const cleaned = cleanJsonText(text);
  const theme = JSON.parse(cleaned);

  return {
    name: theme.name || "AI Theme",
    primary: theme.primary || "#2563eb",
    background: theme.background || "#f4f7fb",
    headerBackground: theme.headerBackground || "#ffffff",
    bubbleMe: theme.bubbleMe || "#2563eb",
    bubbleOther: theme.bubbleOther || "#ffffff",
    textMe: theme.textMe || "#ffffff",
    textOther: theme.textOther || "#111827",
    coverImagePrompt:
      theme.coverImagePrompt ||
      "A modern study chat cover image, soft gradient, books, laptop, cozy learning atmosphere",
  };
};

const generateCoverImageBufferWithAI = async (coverImagePrompt) => {
  const imagePrompt = `
Create a beautiful horizontal chat cover image for a study social app.

Requirements:
- Modern, clean, soft, friendly
- Suitable for students
- No readable text
- No logo
- No real person
- Horizontal banner composition
- Good for chat room cover background

Theme:
${coverImagePrompt}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: imagePrompt,
  });

  const parts = response?.candidates?.[0]?.content?.parts || [];

  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart) {
    throw new Error("AI không trả về ảnh cover");
  }

  const base64Image = imagePart.inlineData.data;

  return Buffer.from(base64Image, "base64");
};

const generateChatThemeWithCoverAI = async (userPrompt) => {
  if (!userPrompt || !userPrompt.trim()) {
    throw new Error("Prompt tạo theme không hợp lệ");
  }

  const theme = await generateThemeColorsWithAI(userPrompt);

  const imageBuffer = await generateCoverImageBufferWithAI(
    theme.coverImagePrompt,
  );

  const uploadedImage = await uploadStreamToCloudinary(
    imageBuffer,
    "/chat-themes",
  );

  return {
    name: theme.name,
    primary: theme.primary,
    background: theme.background,
    headerBackground: theme.headerBackground,
    bubbleMe: theme.bubbleMe,
    bubbleOther: theme.bubbleOther,
    textMe: theme.textMe,
    textOther: theme.textOther,

    coverImage: uploadedImage.url,

    generatedByAI: true,
    prompt: userPrompt,
  };
};

module.exports = {
  generateChatThemeWithCoverAI,
};
