import { ref } from 'vue';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * useAI — composable to call your Firebase/Gemini Cloud Function.
 *
 * Basic usage:
 *   const { generate, result, loading, error } = useAI()
 *   await generate("Write a short product description for blue cargo shorts")
 *   console.log(result.value)
 *
 * With a system prompt:
 *   await generate("Blue cargo shorts, rugged", {
 *     systemPrompt: "You are a product copywriter. Write punchy 2-sentence descriptions.",
 *     maxTokens: 100
 *   })
 */
export function useAI() {
  const result = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const functions = getFunctions();
  const askAI = httpsCallable(functions, 'askAI');

  /**
   * @param {string} prompt       - The prompt to send
   * @param {object} options
   * @param {string} [options.systemPrompt] - Optional system/context instruction
   * @param {number} [options.maxTokens]    - Max response tokens (default: 500)
   * @returns {Promise<string>}             - The AI response text
   */
  const generate = async (prompt, options = {}) => {
    loading.value = true;
    error.value = null;
    result.value = null;

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

  return { generate, result, loading, error };
}