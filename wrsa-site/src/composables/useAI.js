import { ref } from 'vue';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * useAI — composable to call your Firebase/Gemini Cloud Function.
 *
 * Text usage:
 *   const { generate, loading, error } = useAI()
 *   await generate("Write a product description", { systemPrompt, maxTokens })
 *
 * Image usage:
 *   const { generateWithImage, loading, error } = useAI()
 *   await generateWithImage(imageBase64, mimeType, prompt, { systemPrompt, maxTokens })
 */
export function useAI() {
  const result  = ref(null);
  const loading = ref(false);
  const error   = ref(null);

  const functions = getFunctions();
  const askAI = httpsCallable(functions, 'askAI');

  /**
   * Text-only generation
   */
  const generate = async (prompt, options = {}) => {
    loading.value = true;
    error.value   = null;
    result.value  = null;

    try {
      const response = await askAI({
        prompt,
        systemPrompt: options.systemPrompt ?? null,
        maxTokens:    options.maxTokens    ?? 500,
      });

      result.value = response.data.result;
      return result.value;

    } catch (err) {
      error.value = err?.message ?? "AI request failed. Please try again.";
      console.error("[useAI]", err);
      return null;

    } finally {
      loading.value = false;
    }
  };

  /**
   * Vision generation — sends an image + text prompt to Gemini
   * @param {string} imageBase64  - Base64 encoded image (no data:// prefix)
   * @param {string} mimeType     - e.g. "image/jpeg", "image/png", "image/webp"
   * @param {string} prompt       - Text prompt to accompany the image
   * @param {object} options      - { systemPrompt, maxTokens }
   */
  const generateWithImage = async (imageBase64, mimeType, prompt, options = {}) => {
    loading.value = true;
    error.value   = null;
    result.value  = null;

    try {
      const response = await askAI({
        prompt,
        systemPrompt:  options.systemPrompt  ?? null,
        maxTokens:     options.maxTokens     ?? 100,
        imageBase64,
        imageMimeType: mimeType,
      });

      result.value = response.data.result;
      return result.value;

    } catch (err) {
      error.value = err?.message ?? "AI image request failed. Please try again.";
      console.error("[useAI image]", err);
      return null;

    } finally {
      loading.value = false;
    }
  };

  return { generate, generateWithImage, result, loading, error };
}