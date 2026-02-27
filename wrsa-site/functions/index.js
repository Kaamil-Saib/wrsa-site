const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Stored securely in Firebase Secret Manager
const geminiKey = defineSecret("GEMINI_API_KEY");

exports.askAI = onCall(
  { secrets: [geminiKey] },
  async (request) => {

    // Must be signed in
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be signed in to use AI features.");
    }

    const { prompt, systemPrompt, maxTokens = 500 } = request.data;

    if (!prompt) {
      throw new HttpsError("invalid-argument", "A prompt is required.");
    }

    const genAI = new GoogleGenerativeAI(geminiKey.value());

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Free tier, fast
      systemInstruction: systemPrompt || undefined,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    });

    const text = result.response.text();

    return { result: text };
  }
);