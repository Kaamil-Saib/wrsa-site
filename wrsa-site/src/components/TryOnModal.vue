<template>
  <Teleport to="body">
    <div class="tryon-overlay" @click.self="$emit('close')">
      <div class="tryon-modal">

        <!-- Header -->
        <div class="tryon-header">
          <div>
            <h2 class="tryon-title">
              <font-awesome-icon icon="wand-magic-sparkles" class="tryon-title-icon" />
              Virtual Try-On
            </h2>
            <p class="tryon-subtitle">See how it looks on you before you buy.</p>
          </div>
          <button class="tryon-close" @click="$emit('close')">✕</button>
        </div>

        <!-- Main layout -->
        <div class="tryon-body">

          <!-- LEFT: inputs (photo + product preview) -->
          <div class="tryon-inputs">

            <!-- User photo section -->
            <div class="input-block">
              <label class="input-label">
                <font-awesome-icon icon="user" />
                Your Photo
              </label>

              <!-- Has a saved photo and not re-uploading -->
              <div v-if="savedPhotoUrl && !replacing" class="saved-photo-wrap">
                <img :src="savedPhotoUrl" class="saved-photo" alt="Your saved photo" />
                <div class="saved-photo-overlay">
                  <button class="overlay-btn" @click="replacing = true">
                    <font-awesome-icon icon="camera" /> Change Photo
                  </button>
                </div>
                <span class="saved-badge">
                  <font-awesome-icon icon="check" /> Saved
                </span>
              </div>

              <!-- Upload zone -->
              <div
                v-else
                class="photo-drop-zone"
                :class="{ dragging: isDragging, 'has-file': localPreview }"
                @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false"
                @drop.prevent="onDrop"
                @click="!localPreview && $refs.photoInput.click()"
              >
                <template v-if="localPreview">
                  <img :src="localPreview" class="local-preview" alt="Preview" />
                  <div class="drop-overlay">
                    <button class="overlay-btn" @click.stop="clearLocal">
                      <font-awesome-icon icon="times" /> Remove
                    </button>
                  </div>
                </template>
                <template v-else>
                  <div class="drop-icon"><font-awesome-icon icon="cloud-upload-alt" /></div>
                  <p class="drop-text">Click or drag your photo here</p>
                  <p class="drop-sub">Full-body photos work best · JPG, PNG, WEBP</p>
                </template>
              </div>

              <input
                ref="photoInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style="display:none"
                @change="onFileSelect"
              />

              <p v-if="replacing || !savedPhotoUrl" class="photo-hint">
                <font-awesome-icon icon="lock" style="color:#d6a62d; margin-right:4px;" />
                Your photo is saved privately to your account for future try-ons.
              </p>
            </div>

            <!-- Product preview -->
            <div class="input-block">
              <label class="input-label">
                <font-awesome-icon icon="bag-shopping" />
                Product
              </label>
              <div class="product-preview-card">
                <img :src="product.images?.[0]" class="product-preview-img" :alt="product.name" />
                <div class="product-preview-info">
                  <span class="product-preview-cat">{{ product.category }}</span>
                  <strong class="product-preview-name">{{ product.name }}</strong>
                  <span class="product-preview-price">R{{ product.price }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT: result -->
          <div class="tryon-result">
            <label class="input-label">
              <font-awesome-icon icon="wand-magic-sparkles" />
              Result
            </label>

            <!-- Idle / placeholder -->
            <div v-if="!resultUrl && !generating" class="result-placeholder">
              <div class="result-placeholder-icon">
                <font-awesome-icon icon="wand-magic-sparkles" />
              </div>
              <p>Your try-on will appear here</p>
              <p class="result-placeholder-sub">Upload your photo and click Generate</p>
            </div>

            <!-- Generating spinner -->
            <div v-else-if="generating" class="result-generating">
              <div class="gen-spinner"></div>
              <p class="gen-text">Generating your try-on…</p>
              <p class="gen-sub">This takes around 15–30 seconds</p>
            </div>

            <!-- Result image -->
            <div v-else class="result-image-wrap">
              <img :src="resultUrl" class="result-img" alt="Try-on result" />
              <a :href="resultUrl" :download="`${product.name}-tryon.png`" class="download-btn">
                <font-awesome-icon icon="cloud-upload-alt" style="transform:rotate(180deg);" />
                Download
              </a>
            </div>

          </div>
        </div>

        <!-- Error -->
        <p v-if="tryOnError" class="tryon-error">
          <font-awesome-icon icon="times" /> {{ tryOnError }}
        </p>

        <!-- Footer actions -->
        <div class="tryon-footer">
          <button class="tryon-cancel" @click="$emit('close')">Cancel</button>
          <button
            class="tryon-generate-btn"
            :disabled="generating || (!hasUserPhoto && !localFile)"
            @click="handleGenerate"
          >
            <span v-if="generating" class="btn-spinner"></span>
            <font-awesome-icon v-else icon="wand-magic-sparkles" />
            {{ generating ? 'Generating…' : 'Generate Try-On' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTryOn } from '@/composables/useTryOn';

const props = defineProps({
  product: { type: Object, required: true },
});
const emit = defineEmits(['close', 'notify']);

const { loading: generating, error: tryOnError, resultDataUrl, runTryOn, getUserPhotoUrl } = useTryOn();

const savedPhotoUrl = ref(null);
const replacing     = ref(false);
const localFile     = ref(null);
const localPreview  = ref(null);
const isDragging    = ref(false);
const resultUrl     = ref('');
const photoInput    = ref(null);

const hasUserPhoto = ref(false);

onMounted(async () => {
  const url = await getUserPhotoUrl();
  if (url) {
    savedPhotoUrl.value = url;
    hasUserPhoto.value  = true;
  }
});

const loadFile = (file) => {
  if (!file?.type.startsWith('image/')) return;
  localFile.value = file;
  const r = new FileReader();
  r.onload = (e) => { localPreview.value = e.target.result; };
  r.readAsDataURL(file);
  resultUrl.value = '';  // clear previous result
};

const onFileSelect = (e) => loadFile(e.target.files[0]);
const onDrop       = (e) => { isDragging.value = false; loadFile(e.dataTransfer.files[0]); };

const clearLocal = () => {
  localFile.value   = null;
  localPreview.value = null;
  if (photoInput.value) photoInput.value.value = '';
};

const handleGenerate = async () => {
  const productImageUrl = props.product.images?.[0];
  if (!productImageUrl) {
    emit('notify', 'Product has no image', 'error');
    return;
  }

  const result = await runTryOn(
    productImageUrl,
    props.product.name,
    props.product.category,
    localFile.value    // null = use saved photo
  );

  if (result) {
    resultUrl.value     = result;
    hasUserPhoto.value  = true;
    replacing.value     = false;
    if (localFile.value) {
      const url = await getUserPhotoUrl();
      if (url) savedPhotoUrl.value = url;
    }
    emit('notify', 'Try-on generated!', 'success');
  } else {
    emit('notify', tryOnError.value || 'Generation failed', 'error');
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

/* ── Overlay ── */
.tryon-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 9500;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  backdrop-filter: blur(5px);
}

.tryon-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 960px;
  max-height: 92vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.3);
  border-top: 4px solid #d6a62d;
  font-family: 'DM Sans', sans-serif;
}

/* ── Header ── */
.tryon-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 24px 28px 0;
}
.tryon-title {
  font-family: 'Oswald', sans-serif;
  font-size: 1.5rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1px; margin: 0 0 4px; color: #1a1a1a;
  display: flex; align-items: center; gap: 10px;
}
.tryon-title-icon { color: #d6a62d; font-size: 1.1rem; }
.tryon-subtitle { color: #999; font-size: 0.85rem; margin: 0; }
.tryon-close {
  background: #f0f0f0; border: none; width: 34px; height: 34px;
  border-radius: 50%; cursor: pointer; font-size: 0.9rem;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.2s;
}
.tryon-close:hover { background: #e0e0e0; }

/* ── Body ── */
.tryon-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px 28px;
}

.input-label {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Oswald', sans-serif; font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 12px;
}

.input-block { display: flex; flex-direction: column; }

/* ── Saved photo ── */
.saved-photo-wrap {
  position: relative; height: 260px; border-radius: 10px;
  overflow: hidden; background: #f0efed;
}
.saved-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
.saved-badge {
  position: absolute; top: 10px; left: 10px;
  background: #2d8c4e; color: white;
  font-family: 'Oswald', sans-serif; font-size: 0.65rem; font-weight: 700;
  letter-spacing: 0.8px; text-transform: uppercase; padding: 3px 9px; border-radius: 4px;
}

/* ── Drop zone ── */
.photo-drop-zone {
  height: 260px; border: 2px dashed #e0e0e0; border-radius: 10px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; transition: border-color 0.2s, background 0.2s;
  background: #fafafa; position: relative; overflow: hidden;
}
.photo-drop-zone.dragging  { border-color: #d6a62d; background: rgba(214,166,45,0.05); }
.photo-drop-zone.has-file  { border-color: #d6a62d; cursor: default; }
.photo-drop-zone:hover:not(.has-file) { border-color: #d6a62d; background: rgba(214,166,45,0.03); }

.drop-icon  { font-size: 2rem; color: #ccc; margin-bottom: 10px; }
.drop-text  { margin: 0 0 4px; color: #888; font-size: 0.9rem; font-weight: 500; }
.drop-sub   { margin: 0; color: #bbb; font-size: 0.75rem; }

.local-preview { width: 100%; height: 100%; object-fit: cover; display: block; }

.drop-overlay, .saved-photo-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0);
  display: flex; align-items: flex-end; justify-content: center;
  padding-bottom: 14px; opacity: 0; transition: all 0.2s;
}
.photo-drop-zone.has-file:hover .drop-overlay,
.saved-photo-wrap:hover .saved-photo-overlay { opacity: 1; background: rgba(0,0,0,0.45); }

.overlay-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px; background: rgba(255,255,255,0.92); color: #1a1a1a;
  border: none; border-radius: 20px; font-size: 0.82rem; font-weight: 600;
  cursor: pointer; transition: background 0.2s;
}
.overlay-btn:hover { background: white; }

.photo-hint {
  margin: 8px 0 0; font-size: 0.75rem; color: #aaa; line-height: 1.5;
}

/* ── Product preview card ── */
.product-preview-card {
  display: flex; gap: 14px; align-items: center;
  border: 1.5px solid #f0f0f0; border-radius: 10px; padding: 14px;
  background: #fafafa;
}
.product-preview-img { width: 72px; height: 72px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
.product-preview-info { display: flex; flex-direction: column; gap: 3px; }
.product-preview-cat {
  font-family: 'Oswald', sans-serif; font-size: 0.65rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 1.5px; color: #d6a62d;
}
.product-preview-name { font-weight: 600; font-size: 0.9rem; color: #1a1a1a; }
.product-preview-price { font-family: 'Oswald', sans-serif; font-size: 1rem; font-weight: 700; color: #1a1a1a; }

/* ── Result area ── */
.tryon-result { display: flex; flex-direction: column; }

.result-placeholder {
  flex: 1; min-height: 320px; border: 2px dashed #ebebeb; border-radius: 10px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #ccc; text-align: center; padding: 30px;
}
.result-placeholder-icon { font-size: 2.5rem; margin-bottom: 12px; color: #e8e8e8; }
.result-placeholder p { margin: 0 0 4px; font-size: 0.9rem; color: #bbb; font-weight: 500; }
.result-placeholder-sub { font-size: 0.78rem; color: #d0d0d0 !important; }

.result-generating {
  flex: 1; min-height: 320px; border: 2px solid #f8f0dd; border-radius: 10px;
  background: linear-gradient(135deg, #fffdf5, #fff9e8);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px;
}
.gen-spinner {
  width: 48px; height: 48px;
  border: 4px solid rgba(214,166,45,0.2);
  border-top-color: #d6a62d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.gen-text { font-family: 'Oswald', sans-serif; font-size: 1rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #1a1a1a; margin: 0; }
.gen-sub  { font-size: 0.8rem; color: #aaa; margin: 0; }

.result-image-wrap { position: relative; border-radius: 10px; overflow: hidden; }
.result-img { width: 100%; border-radius: 10px; display: block; }
.download-btn {
  position: absolute; bottom: 14px; right: 14px;
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px;
  background: rgba(0,0,0,0.75); color: white;
  border-radius: 20px; font-size: 0.8rem; font-weight: 600;
  text-decoration: none; font-family: 'Oswald', sans-serif;
  letter-spacing: 0.5px; text-transform: uppercase;
  backdrop-filter: blur(4px); transition: background 0.2s;
}
.download-btn:hover { background: rgba(214,166,45,0.9); color: #0f0f0f; }

/* ── Error ── */
.tryon-error {
  margin: 0 28px 0;
  color: #e74c3c; font-size: 0.85rem;
  display: flex; align-items: center; gap: 7px;
}

/* ── Footer ── */
.tryon-footer {
  display: flex; justify-content: flex-end; align-items: center; gap: 12px;
  padding: 20px 28px 24px;
  border-top: 1px solid #f0f0f0;
}
.tryon-cancel {
  padding: 11px 22px;
  border: 1.5px solid #e0e0e0; border-radius: 6px;
  background: white; cursor: pointer; font-family: 'Oswald', sans-serif;
  font-size: 0.85rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
  color: #666; transition: all 0.15s;
}
.tryon-cancel:hover { border-color: #d6a62d; color: #d6a62d; }

.tryon-generate-btn {
  display: inline-flex; align-items: center; gap: 9px;
  padding: 12px 28px;
  background: #1a1a1a; color: white;
  border: none; border-radius: 6px; cursor: pointer;
  font-family: 'Oswald', sans-serif; font-size: 0.9rem; font-weight: 600;
  letter-spacing: 1px; text-transform: uppercase;
  transition: background 0.2s;
}
.tryon-generate-btn:hover:not(:disabled) { background: #d6a62d; color: #0f0f0f; }
.tryon-generate-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-spinner {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ── Responsive ── */
@media (max-width: 720px) {
  .tryon-body { grid-template-columns: 1fr; }
  .tryon-modal { max-height: 100vh; border-radius: 0; }
}
</style>