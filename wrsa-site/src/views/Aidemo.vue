<template>
  <div style="max-width:600px; margin:40px auto; padding:20px;">
    <h2>useAI — Usage Examples</h2>

    <!-- EXAMPLE 1: Simple prompt -->
    <div style="border:1px solid #eee; border-radius:8px; padding:20px; margin-bottom:20px;">
      <h4>Example 1 — Basic prompt</h4>
      <textarea v-model="prompt1" rows="3" style="width:100%; padding:10px;"></textarea>
      <button @click="runExample1" :disabled="loading1" style="margin-top:10px; padding:10px 20px;">
        {{ loading1 ? 'Thinking...' : 'Ask AI' }}
      </button>
      <p v-if="error1" style="color:red;">{{ error1 }}</p>
      <pre v-if="result1" style="background:#f9f9f9; padding:15px; border-radius:6px; white-space:pre-wrap;">{{ result1 }}</pre>
    </div>

    <!-- EXAMPLE 2: Product description generator (more realistic) -->
    <div style="border:1px solid #eee; border-radius:8px; padding:20px;">
      <h4>Example 2 — Product description generator</h4>
      <input v-model="productName" placeholder="e.g. Wild Rhino Khaki Cargo Shorts" style="width:100%; padding:10px; margin-bottom:10px;">
      <button @click="generateDescription" :disabled="loadingDesc" style="padding:10px 20px;">
        <font-awesome-icon icon="wand-magic-sparkles" />
        {{ loadingDesc ? 'Generating...' : 'Generate Description' }}
      </button>
      <p v-if="errorDesc" style="color:red;">{{ errorDesc }}</p>
      <pre v-if="resultDesc" style="background:#f9f9f9; padding:15px; border-radius:6px; white-space:pre-wrap;">{{ resultDesc }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAI } from '@/composables/useAI';

// ── Each call to useAI() gives you independent state ──────────────────────────

// Example 1 — basic
const { generate: gen1, result: result1, loading: loading1, error: error1 } = useAI();
const prompt1 = ref("Write a one-sentence tagline for a South African clothing brand.");

const runExample1 = () => gen1(prompt1.value);

// Example 2 — product description with a system prompt
const { generate: genDesc, result: resultDesc, loading: loadingDesc, error: errorDesc } = useAI();
const productName = ref("");

const generateDescription = () => {
  if (!productName.value) return;
  genDesc(productName.value, {
    systemPrompt: `You are a copywriter for a South African streetwear brand called Wild Rhino. 
Write punchy, 2-sentence product descriptions. Keep it casual and confident. No hashtags.`,
    maxTokens: 120,
  });
};
</script>