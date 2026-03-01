<template>
  <div class="home">

    <!--  HERO -->
    <section class="hero" :style="{ backgroundImage: `url(${heroBg})` }">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <span class="hero-eyebrow">South African Outdoorwear</span>
        <h1 class="hero-title">
          <span class="hero-title-line">Built For</span>
          <span class="hero-title-line accent">The Wild.</span>
        </h1>
        <p class="hero-sub">Hard-wearing gear for the bush, the farm, and the trail. No frills - just tough.</p>
        <div class="hero-cta">
          <router-link to="/shop" class="btn-primary">Shop Collection</router-link>
        </div>
      </div>
    </section>

    <!--  MARQUEE -->
    <div class="marquee-strip">
      <div class="marquee-track">
        <span v-for="n in 3" :key="n">
          <template v-for="word in ['Free Delivery', '★', 'South African Brand', '★', 'Built Tough', '★', 'New Arrivals', '★', 'Proudly SA', '★']" :key="word">
            <span class="marquee-word">{{ word }}</span>
          </template>
        </span>
      </div>
    </div>

    <!--  AI SEARCH ═══ -->
    <section class="ai-search-section">
      <div class="ai-search-inner">

        <span class="ai-search-eyebrow">
          <font-awesome-icon icon="wand-magic-sparkles" />
          AI-Powered Search
        </span>

        <h2 class="ai-search-title">Find Your Perfect Gear</h2>
        <p class="ai-search-sub">Describe what you need or upload a photo - we'll find it.</p>

        <!-- Mode toggle -->
        <div class="search-mode-toggle">
          <button
            class="mode-btn"
            :class="{ active: searchMode === 'text' }"
            @click="searchMode = 'text'"
          >
            <font-awesome-icon icon="wand-magic-sparkles" />
            Describe It
          </button>
          <button
            class="mode-btn"
            :class="{ active: searchMode === 'image' }"
            @click="searchMode = 'image'"
          >
            <font-awesome-icon icon="camera" />
            Upload Photo
          </button>
        </div>

        <!--  TEXT MODE  -->
        <div v-if="searchMode === 'text'">
          <div class="ai-input-row">
            <input
              v-model="aiQuery"
              type="text"
              class="ai-input"
              placeholder="e.g. something warm for winter hiking in the Berg..."
              @keydown.enter="runAISearch"
              :disabled="aiLoading"
            />
            <button class="ai-submit-btn" @click="runAISearch" :disabled="aiLoading || !aiQuery.trim()">
              <div v-if="aiLoading" class="ai-spinner"></div>
              <template v-else>
                <font-awesome-icon icon="wand-magic-sparkles" />
                Search
              </template>
            </button>
          </div>

          <div class="ai-prompts">
            <button
              v-for="prompt in examplePrompts"
              :key="prompt"
              class="ai-prompt-chip"
              @click="aiQuery = prompt; runAISearch()"
            >{{ prompt }}</button>
          </div>

          <p v-if="aiError" class="ai-error">{{ aiError }}</p>

          <div v-if="aiResults.length > 0" class="ai-results">
            <p class="ai-results-heading">{{ aiResults.length }} result{{ aiResults.length !== 1 ? 's' : '' }} for "{{ lastQuery }}"</p>
            <div class="ai-results-grid">
              <div v-for="product in aiResults" :key="product.id" class="ai-result-card" @click="goToShop()">
                <div class="ai-result-img-wrap">
                  <img v-if="product.images?.[0]" :src="product.images[0]" :alt="product.name" class="ai-result-img" />
                  <div v-else class="ai-result-img-placeholder"><font-awesome-icon icon="image" /></div>
                </div>
                <div class="ai-result-body">
                  <span class="ai-result-cat">{{ product.category }}</span>
                  <h3 class="ai-result-name">{{ product.name }}</h3>
                  <div class="ai-result-footer">
                    <span class="ai-result-price">R{{ product.price }}</span>
                    <button class="ai-result-cart-btn" @click.stop="addProductToCart(product)">
                      <font-awesome-icon icon="bag-shopping" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="aiSearched && !aiLoading && aiResults.length === 0" class="ai-no-match">
            <p>No matches found for "{{ lastQuery }}". Try a different description or <router-link to="/shop" style="color:#d6a62d">browse all products</router-link>.</p>
          </div>
        </div>

        <!--  IMAGE MODE  -->
        <div v-else>
          <div
            class="img-drop-zone"
            :class="{ 'is-dragging': isDragging, 'has-image': imgPreview }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="onDrop"
            @click="!imgPreview && $refs.imgInput.click()"
          >
            <template v-if="imgPreview">
              <img :src="imgPreview" class="img-preview" alt="Uploaded image" />
              <div class="img-preview-overlay">
                <button class="img-change-btn" @click.stop="clearImage">
                  <font-awesome-icon icon="times" /> Remove
                </button>
              </div>
            </template>
            <template v-else>
              <div class="img-drop-icon"><font-awesome-icon icon="cloud-upload-alt" /></div>
              <p class="img-drop-text">Drag &amp; drop an image here</p>
              <p class="img-drop-sub">or click to browse - JPG, PNG, WEBP</p>
            </template>
          </div>

          <input
            ref="imgInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style="display:none"
            @change="onFileSelect"
          />

          <button class="ai-submit-btn wide" @click="runImageSearch" :disabled="!imgPreview || imgSearchLoading">
            <div v-if="imgSearchLoading" class="ai-spinner"></div>
            <template v-else>
              <font-awesome-icon icon="wand-magic-sparkles" />
              Find Similar Products
            </template>
          </button>

          <p v-if="imgSearchError" class="ai-error">{{ imgSearchError }}</p>

          <div v-if="imgResults.length > 0" class="ai-results">
            <p class="ai-results-heading">{{ imgResults.length }} similar product{{ imgResults.length !== 1 ? 's' : '' }} found</p>
            <div class="ai-results-grid">
              <div v-for="product in imgResults" :key="product.id" class="ai-result-card" @click="goToShop()">
                <div class="ai-result-img-wrap">
                  <img v-if="product.images?.[0]" :src="product.images[0]" :alt="product.name" class="ai-result-img" />
                  <div v-else class="ai-result-img-placeholder"><font-awesome-icon icon="image" /></div>
                </div>
                <div class="ai-result-body">
                  <span class="ai-result-cat">{{ product.category }}</span>
                  <h3 class="ai-result-name">{{ product.name }}</h3>
                  <div class="ai-result-footer">
                    <span class="ai-result-price">R{{ product.price }}</span>
                    <button class="ai-result-cart-btn" @click.stop="addProductToCart(product)">
                      <font-awesome-icon icon="bag-shopping" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="imgSearched && !imgSearchLoading && imgResults.length === 0" class="ai-no-match">
            <p>No close matches found. Try a clearer photo or <router-link to="/shop" style="color:#d6a62d">browse all products</router-link>.</p>
          </div>
        </div>

      </div>
    </section>

    <!--  POPULAR CAROUSEL  -->
    <section class="section popular-section">
      <div class="section-header">
        <div>
          <span class="section-eyebrow">Trending Now</span>
          <h2 class="section-title">Most Popular</h2>
        </div>
        <router-link to="/shop" class="see-all">All Products →</router-link>
      </div>

      <div v-if="popularLoading" class="carousel-skeleton">
        <div v-for="n in 4" :key="n" class="skel-card"></div>
      </div>

      <div v-else-if="popularProducts.length === 0" class="empty-carousel">
        <p>Products loading...</p>
      </div>

      <div v-else class="carousel-wrap">
        <button class="carousel-arrow left" @click="scrollCarousel(-1)" aria-label="Previous">‹</button>
        <div class="carousel" ref="carouselRef">
          <div
            v-for="product in popularProducts"
            :key="product.id"
            class="carousel-card"
            @click="goToShop()"
          >
            <div class="carousel-img-wrap">
              <img :src="product.images?.[0]" :alt="product.name" class="carousel-img" />
              <div class="carousel-badge" v-if="product.orderCount > 0">
                {{ product.orderCount }} sold
              </div>
            </div>
            <div class="carousel-info">
              <span class="carousel-cat">{{ product.category }}</span>
              <h3 class="carousel-name">{{ product.name }}</h3>
              <div class="carousel-footer">
                <span class="carousel-price">R{{ product.price }}</span>
                <button class="carousel-cart-btn" @click.stop="goToShop()">
                  <font-awesome-icon icon="bag-shopping" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <button class="carousel-arrow right" @click="scrollCarousel(1)" aria-label="Next">›</button>
      </div>
    </section>

    <!--  CATEGORIES  -->
    <section class="section categories-section" v-if="categories.length">
      <div class="section-header">
        <div>
          <span class="section-eyebrow">Browse By</span>
          <h2 class="section-title">Categories</h2>
        </div>
      </div>
      <div class="categories-grid">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="cat-chip"
          @click="goToCategory(cat.name)"
        >
          {{ cat.name }}
        </button>
      </div>
    </section>

    <!--  VALUE PROPS  -->
    <section class="section values-section">
      <div class="values-grid">
        <div class="value-card">
          <div class="value-icon"><font-awesome-icon icon="truck" /></div>
          <h4>Free Delivery</h4>
          <p>On all orders across South Africa. No minimum spend required.</p>
        </div>
        <div class="value-card">
          <div class="value-icon"><font-awesome-icon icon="mountain-sun" /></div>
          <h4>Proudly SA</h4>
          <p>Designed and crafted right here in South Africa. Local is lekker.</p>
        </div>
        <div class="value-card">
          <div class="value-icon"><font-awesome-icon icon="rotate-left" /></div>
          <h4>Easy Returns</h4>
          <p>Not happy? Return within 30 days. No questions asked.</p>
        </div>
        <div class="value-card">
          <div class="value-icon"><font-awesome-icon icon="lock" /></div>
          <h4>Secure Checkout</h4>
          <p>Your details are always safe. Shop with confidence.</p>
        </div>
      </div>
    </section>

    <!--  CTA BANNER  -->
    <section class="cta-banner">
      <div class="cta-banner-bg">
        <div class="cta-orb"></div>
      </div>
      <div class="cta-content">
        <h2>Ready for the Outdoors?</h2>
        <p>New drops every season. Gear up before it sells out.</p>
        <router-link to="/shop" class="btn-primary light">Shop Now</router-link>
      </div>
    </section>

    <!--  FOOTER  -->
    <footer class="site-footer">
      <div class="footer-inner">

        <div class="footer-col brand-col">
          <div class="footer-logo">Wild Rhino SA</div>
          <p class="footer-tagline">Hard-wearing gear for the bush,<br>the farm, and the trail.</p>
          <div class="footer-socials">
            <a href="https://instagram.com" target="_blank" class="social-btn" aria-label="Instagram">
              <font-awesome-icon :icon="['fab', 'instagram']" />
            </a>
            <a href="https://facebook.com" target="_blank" class="social-btn" aria-label="Facebook">
              <font-awesome-icon :icon="['fab', 'facebook-f']" />
            </a>
            <a href="https://tiktok.com" target="_blank" class="social-btn" aria-label="TikTok">
              <font-awesome-icon :icon="['fab', 'tiktok']" />
            </a>
          </div>
        </div>

        <div class="footer-col">
          <h5 class="footer-heading">Shop</h5>
          <ul class="footer-nav">
            <li><router-link to="/shop">All Products</router-link></li>
            <li><router-link to="/wishlist">My Wishlist</router-link></li>
            <li><router-link to="/cart">Cart</router-link></li>
          </ul>
        </div>

        <div class="footer-col">
          <h5 class="footer-heading">Account</h5>
          <ul class="footer-nav">
            <li><router-link to="/signin">Sign In</router-link></li>
            <li><router-link to="/register">Register</router-link></li>
            <li><router-link to="/my-orders">My Orders</router-link></li>
          </ul>
        </div>

        <div class="footer-col">
          <h5 class="footer-heading">Contact Us</h5>
          <div class="contact-list">
            <div class="contact-item">
              <font-awesome-icon icon="map-marker-alt" class="contact-icon" />
              <span>123 Rhino Street, Cape Town<br>Western Cape, 8001</span>
            </div>
            <div class="contact-item">
              <font-awesome-icon icon="phone" class="contact-icon" />
              <a href="tel:+27219876543">+27 21 987 6543</a>
            </div>
            <div class="contact-item">
              <font-awesome-icon icon="envelope" class="contact-icon" />
              <a href="mailto:hello@wildrhino.co.za">hello@wildrhino.co.za</a>
            </div>
          </div>
        </div>

      </div>

      <div class="footer-bottom">
        <span>© {{ currentYear }} Wild Rhino SA. All rights reserved.</span>
        <span class="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <span>·</span>
          <a href="#">Terms of Service</a>
        </span>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useAI } from '@/composables/useAI';
import { useCart } from '@/composables/useCart';
import heroBg from '@/assets/images/hero-image.jpg';

const emit = defineEmits(['notify']);
const router = useRouter();
const db = getFirestore();

//Data 
const categories      = ref([]);
const allProducts     = ref([]);   // full catalog- used for AI context
const popularProducts = ref([]);
const popularLoading  = ref(true);
const carouselRef     = ref(null);
const currentYear     = new Date().getFullYear();

//AI Search 
const { generate, generateWithImage, loading: aiLoading } = useAI();

const searchMode = ref('text'); // 'text' | 'image'

const aiQuery    = ref('');
const aiResults  = ref([]);
const aiSearched = ref(false);
const aiError    = ref('');
const lastQuery  = ref('');

const examplePrompts = [
  'Something warm for winter hiking',
  'Tough work pants for the farm',
  'Light gear for summer trail running',
  'Waterproof jacket for the bush',
];

// Client-side keyword fallback - used when AI returns [] or fails
const keywordFallback = (q) => {
  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  return allProducts.value.filter(p => {
    const haystack = `${p.name} ${p.category} ${p.description} ${(p.sizes || []).join(' ')}`.toLowerCase();
    return words.some(w => haystack.includes(w));
  }).slice(0, 6);
};

// Extract comma-separated numbers from any response format
// Handles: 0,3,7  or  [0,3,7]  or  1. 2. 3.  or  0 3 7
const extractIndices = (str) => {
  const nums = str.match(/\b\d+\b/g);
  if (!nums) return [];
  return [...new Set(nums.map(Number))];
};

const runAISearch = async () => {
  const q = aiQuery.value.trim();
  if (!q || aiLoading.value) return;

  aiSearched.value = false;
  aiResults.value  = [];
  aiError.value    = '';
  lastQuery.value  = q;

  // Guard: products not loaded yet
  if (allProducts.value.length === 0) {
    aiSearched.value = true;
    aiResults.value  = keywordFallback(q);
    return;
  }

  const catalog = allProducts.value.map((p, i) =>
    `${i}:${p.name}|${p.category || ''}|${p.color || ''}|${(p.description || '').slice(0, 80)}`
  ).join('\n');

  const systemPrompt = `You are a clothing search assistant. The user describes what they want and you return the numbers of the best matching products from the catalog. Reply with ONLY a comma-separated list of up to 4 numbers. Nothing else - no words, no explanation, no brackets. Example reply: 0,3,7`;

  const prompt = `Customer wants: "${q}"\n\nCatalog (number:name|category|color|description):\n${catalog}`;

  console.log('[AI Search] query:', q, '| catalog size:', allProducts.value.length);

  const raw = await generate(prompt, { systemPrompt, maxTokens: 500 });

  console.log('[AI Search] raw response:', raw);

  aiSearched.value = true;

  if (!raw) {
    aiResults.value = keywordFallback(q);
    return;
  }

  const indices = extractIndices(raw);
  console.log('[AI Search] indices:', indices);

  const matched = indices
    .filter(i => i >= 0 && i < allProducts.value.length)
    .map(i => allProducts.value[i])
    .filter(Boolean);

  aiResults.value = matched.length > 0 ? matched : keywordFallback(q);

  if (matched.length === 0) console.log('[AI Search] falling back to keyword search');
};


//  Image Search 
const imgInput        = ref(null);
const imgPreview      = ref(null);   // data URL for display
const imgBase64       = ref(null);   // raw base64 (no prefix) for API
const imgMimeType     = ref('image/jpeg');
const imgResults      = ref([]);
const imgSearched     = ref(false);
const imgSearchError  = ref('');
const imgSearchLoading = ref(false);
const isDragging      = ref(false);

const loadFile = (file) => {
  if (!file || !file.type.startsWith('image/')) return;
  imgMimeType.value = file.type;
  const reader = new FileReader();
  reader.onload = (e) => {
    imgPreview.value = e.target.result;                      // full data URL for <img>
    imgBase64.value  = e.target.result.split(',')[1];        // strip "data:image/...;base64,"
  };
  reader.readAsDataURL(file);
  // Reset previous results
  imgResults.value  = [];
  imgSearched.value = false;
  imgSearchError.value = '';
};

const onFileSelect = (e) => loadFile(e.target.files[0]);
const onDrop       = (e) => { isDragging.value = false; loadFile(e.dataTransfer.files[0]); };

const clearImage = () => {
  imgPreview.value  = null;
  imgBase64.value   = null;
  imgResults.value  = [];
  imgSearched.value = false;
  imgSearchError.value = '';
  if (imgInput.value) imgInput.value.value = '';
};

const runImageSearch = async () => {
  if (!imgBase64.value || imgSearchLoading.value) return;

  imgResults.value     = [];
  imgSearched.value    = false;
  imgSearchError.value = '';
  imgSearchLoading.value = true;

  try {
    // Build short catalog with indices (same approach as text search)
    const catalog = allProducts.value.map((p, i) =>
      `${i}:${p.name}|${p.category || ''}|${p.color || ''}`
    ).join('\n');

    const systemPrompt = `You are a clothing visual search assistant. The user uploads a photo of clothing or an outfit. Look at the image carefully - identify the garment type, color, style, and any notable features. Then match it against the product catalog and return ONLY a comma-separated list of up to 4 catalog numbers that are most visually similar. Nothing else - no words, no explanation. Example reply: 2,7,14`;

    const prompt = `Find products from this catalog that are most visually similar to the clothing in this image.\n\nCatalog (number:name|category|color):\n${catalog}`;

    const raw = await generateWithImage(
      imgBase64.value,
      imgMimeType.value,
      prompt,
      { systemPrompt, maxTokens: 50 }
    );

    console.log('[Image Search] raw:', raw);

    imgSearched.value = true;

    if (!raw) {
      imgSearchError.value = 'Could not analyse the image. Please try again.';
      return;
    }

    const nums = raw.match(/\b\d+\b/g);
    const indices = nums ? [...new Set(nums.map(Number))] : [];

    imgResults.value = indices
      .filter(i => i >= 0 && i < allProducts.value.length)
      .map(i => allProducts.value[i])
      .filter(Boolean);

  } catch (err) {
    imgSearchError.value = 'Something went wrong. Please try again.';
    console.error('[Image Search]', err);
    imgSearched.value = true;
  } finally {
    imgSearchLoading.value = false;
  }
};

//  Cart 
const { addToCart } = useCart();

const addProductToCart = async (product) => {
  const result = await addToCart(product);
  emit('notify', result.message, result.success ? 'success' : 'error');
};

//  Navigation 
const goToCategory = (cat) => router.push({ path: '/shop', query: { category: cat } });
const goToShop = () => router.push('/shop');

const scrollCarousel = (dir) => {
  if (!carouselRef.value) return;
  carouselRef.value.scrollBy({ left: dir * 280, behavior: 'smooth' });
};

//  Fetch 
const fetchPopular = async () => {
  try {
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const tally = {};
    ordersSnap.docs.forEach(d => {
      (d.data().items || []).forEach(item => {
        tally[item.productId] = (tally[item.productId] || 0) + item.quantity;
      });
    });

    popularProducts.value = allProducts.value
      .map(p => ({ ...p, orderCount: tally[p.id] || 0 }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);
  } catch (e) {
    console.error('[Home] fetchPopular error:', e);
  } finally {
    popularLoading.value = false;
  }
};

onMounted(async () => {
  try {
    const [prodSnap, catSnap] = await Promise.all([
      getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'categories'), orderBy('name'))),
    ]);
    allProducts.value  = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    categories.value   = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[Home] fetch error:', e);
  }

  // Popular depends on allProducts being loaded
  fetchPopular();
});
</script>

<style src="./Home.css" scoped></style>