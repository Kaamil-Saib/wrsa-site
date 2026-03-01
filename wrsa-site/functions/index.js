const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiKey = defineSecret("GEMINI_API_KEY");

exports.askAI = onCall(
  { secrets: [geminiKey] },
  async (request) => {

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in to use AI features.");
    }

    const {
      prompt,
      systemPrompt,
      maxTokens  = 500,
      // Optional image fields for vision requests
      imageBase64 = null,
      imageMimeType = "image/jpeg",
    } = request.data;

    if (!prompt) {
      throw new HttpsError("invalid-argument", "A prompt is required.");
    }

    const genAI = new GoogleGenerativeAI(geminiKey.value());

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: systemPrompt || undefined,
    });

    // Build the parts array — add image inline if provided
    const parts = [];

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType,
        },
      });
    }

    parts.push({ text: prompt });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { maxOutputTokens: maxTokens },
    });

    const text = result.response.text();
    return { result: text };
  }
);

//  Replace your entire tryOnAI export in functions/index.js 
// Key fixes:
//  1. cors: true  — required for v2 onCall to accept browser requests
//  2. fetch() is available natively in Node 18+ (Firebase default runtime)
//  3. Correct model name for image generation

exports.tryOnAI = onCall(
  {
    secrets: [geminiKey],
    timeoutSeconds: 120,
    cors: true,              // ← fixes the CORS preflight error
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in to use Try On.");
    }

    const {
      userPhotoUrl,
      userPhotoBase64  = null,
      userPhotoMime    = "image/jpeg",
      productImageUrl,
      productName      = "this garment",
      productCategory  = "clothing",
    } = request.data;

    if (!productImageUrl) {
      throw new HttpsError("invalid-argument", "A product image URL is required.");
    }
    if (!userPhotoUrl && !userPhotoBase64) {
      throw new HttpsError("invalid-argument", "A user photo is required.");
    }

    /*  helper: fetch a URL → { base64, mimeType }  */
    const urlToBase64 = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
      const buffer   = await res.arrayBuffer();
      const mimeType = res.headers.get("content-type") || "image/jpeg";
      return { base64: Buffer.from(buffer).toString("base64"), mimeType };
    };

    // Resolve user photo
    const userImg = userPhotoBase64
      ? { base64: userPhotoBase64, mimeType: userPhotoMime }
      : await urlToBase64(userPhotoUrl);

    // Always fetch product image server-side
    const productImg = await urlToBase64(productImageUrl);

    /*  Gemini image generation  */
    const genAI = new GoogleGenerativeAI(geminiKey.value());

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
    });

    const prompt =
      `You are a virtual clothing try-on assistant. ` +
      `The first image is a photo of a person. ` +
      `The second image is a ${productCategory} called "${productName}". ` +
      `Generate a realistic image of the person wearing that exact garment. ` +
      `Keep the person's face, skin tone, body shape, and pose completely unchanged. ` +
      `The clothing should drape and fit naturally. ` +
      `Do not add text, watermarks, or change the background.`;

    let result;
    try {
      result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { inlineData: { data: userImg.base64,    mimeType: userImg.mimeType    } },
            { inlineData: { data: productImg.base64, mimeType: productImg.mimeType } },
            { text: prompt },
          ],
        }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      });
    } catch (geminiErr) {
      console.error("[tryOnAI] Gemini error:", geminiErr);
      throw new HttpsError("internal", `AI generation failed: ${geminiErr.message}`);
    }

    const parts     = result.response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);

    if (!imagePart) {
      const textPart = parts.find((p) => p.text);
      console.error("[tryOnAI] No image in response. Text:", textPart?.text);
      throw new HttpsError(
        "internal",
        textPart?.text || "Gemini did not return an image. Try a different photo."
      );
    }

    return {
      imageBase64: imagePart.inlineData.data,
      mimeType:    imagePart.inlineData.mimeType || "image/png",
    };
  }
);