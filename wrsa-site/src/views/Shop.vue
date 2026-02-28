<template>
  <div class="shop-page">

    <!-- HERO -->
    <div class="shop-hero">
      <h1>Shop</h1>
      <p>{{ filteredProducts.length }} product{{ filteredProducts.length !== 1 ? 's' : '' }} found</p>
    </div>

    <div class="shop-layout">

      <!-- SIDEBAR -->
      <aside class="filter-sidebar" :class="{ open: sidebarOpen }">
        <div class="sidebar-header">
          <h3>Filters</h3>
          <button v-if="hasActiveFilters" class="clear-all" @click="clearFilters">Clear All</button>
        </div>

        <div class="filter-group">
          <label class="filter-label">Search</label>
          <input v-model="search" type="text" placeholder="Search products..." class="search-input" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Category</label>
          <div class="filter-pills">
            <button
              v-for="cat in categories" :key="cat.id"
              class="filter-pill"
              :class="{ active: selectedCategory === cat.name }"
              @click="selectedCategory = selectedCategory === cat.name ? '' : cat.name"
            >{{ cat.name }}</button>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Size</label>
          <div class="filter-pills">
            <button
              v-for="s in sizes" :key="s.id"
              class="filter-pill"
              :class="{ active: selectedSizes.includes(s.size) }"
              @click="toggleSize(s.size)"
            >{{ s.size }}</button>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Color</label>
          <div class="filter-pills">
            <button
              v-for="col in colors" :key="col.id"
              class="filter-pill"
              :class="{ active: selectedColor === col.name }"
              @click="selectedColor = selectedColor === col.name ? '' : col.name"
            >{{ col.name }}</button>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Price Range</label>
          <div class="price-inputs">
            <div class="price-input-group">
              <span>R</span>
              <input v-model.number="minPrice" type="number" placeholder="Min" />
            </div>
            <span style="color:#aaa">–</span>
            <div class="price-input-group">
              <span>R</span>
              <input v-model.number="maxPrice" type="number" placeholder="Max" />
            </div>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <main class="shop-main">

        <!-- Toolbar -->
        <div class="shop-toolbar">
          <button class="filter-toggle-btn" @click="sidebarOpen = !sidebarOpen">
            <font-awesome-icon icon="sliders" />
            Filters
            <span v-if="activeFilterCount > 0" class="filter-count-badge">{{ activeFilterCount }}</span>
          </button>
          <div class="toolbar-right">
            <button class="wishlist-toggle-btn" @click="showWishlistPanel = !showWishlistPanel">
              <font-awesome-icon icon="heart" />
              Wishlist
              <span v-if="wishlistIds.length > 0" class="filter-count-badge">{{ wishlistIds.length }}</span>
            </button>
            <select v-model="sortBy" class="sort-select">
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A–Z</option>
              <option value="name-desc">Name: Z–A</option>
            </select>
            <div class="view-toggle">
              <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">
                <font-awesome-icon icon="grip" />
              </button>
              <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
                <font-awesome-icon icon="list" />
              </button>
            </div>
          </div>
        </div>

        <!-- Active filter tags -->
        <div v-if="hasActiveFilters" class="active-filters">
          <span v-if="search" class="active-tag">"{{ search }}" <button @click="search = ''">✕</button></span>
          <span v-if="selectedCategory" class="active-tag">{{ selectedCategory }} <button @click="selectedCategory = ''">✕</button></span>
          <span v-if="selectedColor" class="active-tag">{{ selectedColor }} <button @click="selectedColor = ''">✕</button></span>
          <span v-for="s in selectedSizes" :key="s" class="active-tag">Size: {{ s }} <button @click="toggleSize(s)">✕</button></span>
          <span v-if="minPrice || maxPrice" class="active-tag">
            R{{ minPrice || 0 }} – R{{ maxPrice || '∞' }}
            <button @click="minPrice = null; maxPrice = null">✕</button>
          </span>
        </div>

        <!-- Loading skeletons -->
        <div v-if="loading" class="product-grid">
          <div v-for="n in 8" :key="n" class="skeleton-card"></div>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredProducts.length === 0" class="empty-state">
          <font-awesome-icon icon="bag-shopping" class="empty-icon" />
          <h3>No products found</h3>
          <p>Try adjusting your filters.</p>
          <button class="action-btn" @click="clearFilters">Clear Filters</button>
        </div>

        <!-- Grid view -->
        <div v-else-if="viewMode === 'grid'" class="product-grid">
          <div
            v-for="product in filteredProducts" :key="product.id"
            class="product-card"
            @mouseenter="hoveredId = product.id"
            @mouseleave="hoveredId = null"
          >
            <div class="card-image-wrap">
              <img
                :src="hoveredId === product.id && product.images?.[1] ? product.images[1] : product.images?.[0]"
                :alt="product.name"
                class="card-img"
              />
              <div class="card-actions">
                <button class="card-action-btn" @click="toggleWishlistItem(product)">
                  <font-awesome-icon icon="heart" :style="{ color: inWishlist(product.id) ? '#e74c3c' : 'white' }" />
                </button>
                <button class="card-action-btn" @click="openQuickView(product)">
                  <font-awesome-icon icon="eye" />
                </button>
              </div>
            </div>
            <div class="card-body">
              <span class="card-category">{{ product.category }}</span>
              <h3 class="card-name">{{ product.name }}</h3>
              <div v-if="product.sizes && product.sizes.length" class="card-sizes">
                <span v-for="sz in product.sizes.slice(0, 4)" :key="sz" class="sz-chip">{{ sz }}</span>
                <span v-if="product.sizes.length > 4" class="sz-chip muted">+{{ product.sizes.length - 4 }}</span>
              </div>
              <div class="card-footer">
                <span class="card-price">R{{ product.price }}</span>
                <button class="add-to-cart-btn" @click="product.sizes?.length ? openQuickView(product) : addToCart(product)">
                  <font-awesome-icon icon="bag-shopping" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- List view -->
        <div v-else class="product-list">
          <div v-for="product in filteredProducts" :key="product.id" class="list-card">
            <img :src="product.images?.[0]" :alt="product.name" class="list-img" />
            <div class="list-body">
              <span class="card-category">{{ product.category }}</span>
              <h3 class="list-name">{{ product.name }}</h3>
              <p class="list-desc">{{ product.description }}</p>
              <div v-if="product.sizes && product.sizes.length" class="card-sizes">
                <span v-for="sz in product.sizes" :key="sz" class="sz-chip">{{ sz }}</span>
              </div>
            </div>
            <div class="list-actions">
              <span class="card-price large">R{{ product.price }}</span>
              <button class="action-btn" @click="product.sizes?.length ? openQuickView(product) : addToCart(product)">Add to Cart</button>
              <button class="wishlist-btn" @click="toggleWishlistItem(product)">
                <font-awesome-icon icon="heart" :style="{ color: inWishlist(product.id) ? '#e74c3c' : '#ccc' }" />
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>

    <!-- WISHLIST PANEL -->
    <div v-if="showWishlistPanel" class="wishlist-overlay" @click.self="showWishlistPanel = false">
      <div class="wishlist-panel">
        <div class="wishlist-panel-header">
          <h3><font-awesome-icon icon="heart" style="color:#e74c3c; margin-right:8px" />Wishlist ({{ wishlistProducts.length }})</h3>
          <button class="modal-close" @click="showWishlistPanel = false">✕</button>
        </div>
        <div v-if="wishlistProducts.length === 0" class="wishlist-empty">
          <p>Your wishlist is empty.</p>
          <p style="font-size:0.85rem; color:#aaa">Click the heart icon on any product to save it.</p>
        </div>
        <div v-else class="wishlist-items">
          <div v-for="product in wishlistProducts" :key="product.id" class="wishlist-item">
            <img :src="product.images?.[0]" :alt="product.name" class="wishlist-item-img" />
            <div class="wishlist-item-info">
              <span class="card-category">{{ product.category }}</span>
              <h4>{{ product.name }}</h4>
              <span class="card-price">R{{ product.price }}</span>
            </div>
            <div class="wishlist-item-actions">
              <button class="add-to-cart-btn" @click="addToCart(product)">
                <font-awesome-icon icon="bag-shopping" />
              </button>
              <button class="remove-wish-btn" @click="toggleWishlistItem(product)">
                <font-awesome-icon icon="trash" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- QUICK VIEW MODAL -->
    <div v-if="quickViewProduct" class="modal-overlay" @click.self="quickViewProduct = null">
      <div class="quick-view-modal">
        <button class="modal-close" @click="quickViewProduct = null">✕</button>
        <div class="qv-layout">
          <div class="qv-gallery">
            <img
              :src="quickViewProduct.images?.[activeImageIndex]"
              class="qv-main-img"
              :alt="quickViewProduct.name"
            />
            <div v-if="quickViewProduct.images && quickViewProduct.images.length > 1" class="qv-thumbs">
              <img
                v-for="(img, i) in quickViewProduct.images" :key="i"
                :src="img"
                class="qv-thumb"
                :class="{ active: activeImageIndex === i }"
                @click="activeImageIndex = i"
              />
            </div>
          </div>
          <div class="qv-details">
            <span class="card-category">{{ quickViewProduct.category }}</span>
            <h2>{{ quickViewProduct.name }}</h2>
            <p class="qv-price">R{{ quickViewProduct.price }}</p>
            <p class="qv-desc">{{ quickViewProduct.description }}</p>
            <div v-if="quickViewProduct.sizes && quickViewProduct.sizes.length" class="qv-section">
              <label class="filter-label">Select Size</label>
              <div class="filter-pills">
                <button
                  v-for="s in quickViewProduct.sizes" :key="s"
                  class="filter-pill"
                  :class="{ active: selectedQVSize === s }"
                  @click="selectedQVSize = s"
                >{{ s }}</button>
              </div>
            </div>
            <div class="qv-cta">
              <button class="action-btn" @click="addToCart(quickViewProduct, selectedQVSize); quickViewProduct = null">
                <font-awesome-icon icon="bag-shopping" /> Add to Cart
              </button>
              <button class="wishlist-btn-lg" @click="toggleWishlistItem(quickViewProduct)">
                <font-awesome-icon icon="heart" :style="{ color: inWishlist(quickViewProduct.id) ? '#e74c3c' : '#ccc' }" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useWishlist } from '@/composables/useWishlist'
import { useCart } from '@/composables/useCart'

const emit = defineEmits(['notify'])
const db = getFirestore()

const products = ref([])
const categories = ref([])
const colors = ref([])
const sizes = ref([])
const loading = ref(true)

const viewMode = ref('grid')
const sidebarOpen = ref(false)
const hoveredId = ref(null)
const quickViewProduct = ref(null)
const activeImageIndex = ref(0)
const selectedQVSize = ref('')

const search = ref('')
const selectedCategory = ref('')
const selectedColor = ref('')
const selectedSizes = ref([])
const minPrice = ref(null)
const maxPrice = ref(null)
const sortBy = ref('newest')

const showWishlistPanel = ref(false)

// ── Wishlist via Firestore composable ────────────────────────────────────────
const { wishlistIds, toggle } = useWishlist()

const wishlistProducts = computed(() =>
  products.value.filter(p => wishlistIds.value.includes(p.id))
)

const inWishlist = (id) => wishlistIds.value.includes(id)

const toggleWishlistItem = async (product) => {
  const result = await toggle(product)
  if (result.success) {
    emit('notify', result.message, result.added ? 'success' : 'info')
  } else {
    emit('notify', result.message || 'Sign in to use your wishlist', 'error')
  }
}
// ────────────────────────────────────────────────────────────────────────────

// ── Cart via Firestore composable ────────────────────────────────────────────
const { addToCart: addToCartStore, cartCount } = useCart()

const addToCart = async (product, size = '') => {
  const result = await addToCartStore(product, size)
  if (result.success) {
    emit('notify', result.message, 'success')
  } else {
    emit('notify', result.message || 'Sign in to use your cart', 'error')
  }
}
// ────────────────────────────────────────────────────────────────────────────

const openQuickView = (product) => {
  quickViewProduct.value = product
  activeImageIndex.value = 0
  selectedQVSize.value = (product.sizes && product.sizes[0]) || ''
}

const toggleSize = (size) => {
  const idx = selectedSizes.value.indexOf(size)
  if (idx === -1) selectedSizes.value.push(size)
  else selectedSizes.value.splice(idx, 1)
}

const hasActiveFilters = computed(() =>
  !!(search.value || selectedCategory.value || selectedColor.value ||
  selectedSizes.value.length || minPrice.value || maxPrice.value)
)

const activeFilterCount = computed(() => {
  let count = 0
  if (search.value) count++
  if (selectedCategory.value) count++
  if (selectedColor.value) count++
  count += selectedSizes.value.length
  if (minPrice.value || maxPrice.value) count++
  return count
})

const clearFilters = () => {
  search.value = ''
  selectedCategory.value = ''
  selectedColor.value = ''
  selectedSizes.value = []
  minPrice.value = null
  maxPrice.value = null
}

const filteredProducts = computed(() => {
  let temp = [...products.value]
  if (search.value) {
    const q = search.value.toLowerCase()
    temp = temp.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q)))
    )
  }
  if (selectedCategory.value) temp = temp.filter(p => p.category === selectedCategory.value)
  if (selectedColor.value) temp = temp.filter(p => p.color === selectedColor.value)
  if (selectedSizes.value.length) {
    temp = temp.filter(p => Array.isArray(p.sizes) && p.sizes.some(s => selectedSizes.value.includes(s)))
  }
  if (minPrice.value != null) temp = temp.filter(p => p.price >= minPrice.value)
  if (maxPrice.value != null) temp = temp.filter(p => p.price <= maxPrice.value)

  temp.sort((a, b) => {
    if (sortBy.value === 'price-asc') return (a.price || 0) - (b.price || 0)
    if (sortBy.value === 'price-desc') return (b.price || 0) - (a.price || 0)
    if (sortBy.value === 'name-asc') return (a.name || '').localeCompare(b.name || '')
    if (sortBy.value === 'name-desc') return (b.name || '').localeCompare(a.name || '')
    const aTime = a.createdAt?.toMillis?.() ?? 0
    const bTime = b.createdAt?.toMillis?.() ?? 0
    return bTime - aTime
  })
  return temp
})

onMounted(async () => {
  try {
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
    const [prodSnap, catSnap, colorSnap, sizeSnap] = await Promise.all([
      getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'categories'), orderBy('name'))),
      getDocs(collection(db, 'colors')),
      getDocs(collection(db, 'sizes')),
    ])
    products.value = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    categories.value = catSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    colors.value = colorSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const rawSizes = sizeSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    sizes.value = rawSizes.sort((a, b) => {
      const ai = sizeOrder.indexOf(a.size)
      const bi = sizeOrder.indexOf(b.size)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
  } catch (e) {
    console.error('Shop fetch error:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.shop-page { min-height: 100vh; background: #fafafa; }

.shop-hero {
  background: var(--primary, #d6a62d);
  color: white;
  text-align: center;
  padding: 48px 20px 36px;
}
.shop-hero h1 { font-size: 2.4rem; margin: 0 0 6px; }
.shop-hero p  { opacity: 0.85; margin: 0; font-size: 0.95rem; }

.shop-layout {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
  gap: 30px;
  align-items: flex-start;
}

.filter-sidebar {
  width: 300px;
  flex-shrink: 0;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  position: sticky;
  top: 20px;
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.sidebar-header h3 { margin: 0; font-size: 1rem; }
.clear-all { font-size: 0.8rem; color: var(--primary, #d6a62d); background: none; border: none; cursor: pointer; font-weight: 600; padding: 0; }
.filter-group { margin-bottom: 22px; }
.filter-label { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #888; margin-bottom: 10px; }
.search-input { width: 100%; padding: 9px 12px; border: 1.5px solid #e8e8e8; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; outline: none; }
.search-input:focus { border-color: var(--primary, #d6a62d); }
.filter-pills { display: flex; flex-wrap: wrap; gap: 7px; }
.filter-pill { padding: 5px 13px; border: 1.5px solid #e8e8e8; border-radius: 20px; font-size: 0.8rem; cursor: pointer; background: white; color: #555; transition: all 0.2s; font-weight: 500; }
.filter-pill:hover { border-color: var(--primary, #d6a62d); color: var(--primary, #d6a62d); }
.filter-pill.active { background: var(--primary, #d6a62d); border-color: var(--primary, #d6a62d); color: white; }
.price-inputs { display: flex; align-items: center; gap: 8px; }
.price-input-group {
  display: flex;
  align-items: stretch;
  border: 1.5px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  flex: 1;
  height: 38px;
}
.price-input-group span {
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: #888;
  font-size: 0.85rem;
  background: #f4f4f4;
  border-right: 1px solid #e8e8e8;
  flex-shrink: 0;
  font-weight: 600;
}
.price-input-group input {
  flex: 1;
  min-width: 0;
  padding: 0 8px;
  border: none;
  outline: none;
  font-size: 0.85rem;
  background: white;
  height: 100%;
}

.shop-main { flex: 1; min-width: 0; }
.shop-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; }
.filter-toggle-btn { display: flex; align-items: center; gap: 7px; padding: 9px 16px; border: 1.5px solid #e8e8e8; border-radius: 8px; background: white; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #444; }
.filter-count-badge { background: var(--primary, #d6a62d); color: white; font-size: 0.65rem; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.toolbar-right { display: flex; align-items: center; gap: 10px; }
.sort-select { padding: 9px 12px; border: 1.5px solid #e8e8e8; border-radius: 8px; font-size: 0.85rem; background: white; cursor: pointer; outline: none; color: #444; }
.view-toggle { display: flex; border: 1.5px solid #e8e8e8; border-radius: 8px; overflow: hidden; }
.view-toggle button { padding: 8px 12px; border: none; background: white; cursor: pointer; color: #aaa; transition: all 0.2s; }
.view-toggle button.active { background: var(--primary, #d6a62d); color: white; }

.active-filters { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 16px; }
.active-tag { display: flex; align-items: center; gap: 5px; background: #fff8e6; border: 1px solid #f5d88a; color: #a07a00; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
.active-tag button { background: none; border: none; cursor: pointer; color: #a07a00; font-size: 0.75rem; padding: 0; }

.skeleton-card { height: 340px; border-radius: 12px; background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

.empty-state { text-align: center; padding: 80px 20px; color: #aaa; }
.empty-icon { font-size: 3.5rem; margin-bottom: 16px; opacity: 0.3; display: block; }
.empty-state h3 { color: #555; margin: 0 0 8px; }
.empty-state p { margin: 0 0 20px; }

.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.product-card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: transform 0.25s ease, box-shadow 0.25s ease; cursor: pointer; }
.product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.card-image-wrap { position: relative; height: 260px; overflow: hidden; background: #f5f5f5; }
.card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; display: block; }
.product-card:hover .card-img { transform: scale(1.04); }
.card-actions { position: absolute; top: 10px; right: 10px; display: flex; flex-direction: column; gap: 7px; opacity: 0; transform: translateX(10px); transition: all 0.25s ease; }
.product-card:hover .card-actions { opacity: 1; transform: translateX(0); }
.card-action-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: rgba(0,0,0,0.55); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; transition: background 0.2s; }
.card-action-btn:hover { background: rgba(0,0,0,0.8); }
.card-body { padding: 14px 16px 16px; }
.card-category { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--primary, #d6a62d); }
.card-name { margin: 5px 0 8px; font-size: 0.95rem; font-weight: 600; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-sizes { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 10px; }
.sz-chip { background: #f4f4f4; padding: 2px 7px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; color: #555; }
.sz-chip.muted { color: #aaa; }
.card-footer { display: flex; justify-content: space-between; align-items: center; }
.card-price { font-size: 1.05rem; font-weight: 700; color: #222; }
.card-price.large { font-size: 1.3rem; }
.add-to-cart-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: var(--primary, #d6a62d); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; transition: background 0.2s, transform 0.15s; }
.add-to-cart-btn:hover { background: #b8891f; transform: scale(1.08); }

.product-list { display: flex; flex-direction: column; gap: 16px; }
.list-card { display: flex; gap: 20px; background: white; border-radius: 12px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); align-items: center; }
.list-img { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #f5f5f5; }
.list-body { flex: 1; min-width: 0; }
.list-name { margin: 4px 0 6px; font-size: 1rem; font-weight: 600; color: #222; }
.list-desc { margin: 0 0 8px; font-size: 0.85rem; color: #888; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.list-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0; }
.wishlist-btn { background: none; border: 1.5px solid #eee; border-radius: 8px; padding: 6px 10px; cursor: pointer; font-size: 1rem; }
.wishlist-btn:hover { border-color: #e74c3c; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(3px); }
.quick-view-modal { background: white; border-radius: 16px; max-width: 860px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; padding: 30px; }
.modal-close { position: absolute; top: 16px; right: 16px; background: #f0f0f0; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; }
.qv-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
.qv-main-img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; background: #f5f5f5; }
.qv-thumbs { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.qv-thumb { width: 58px; height: 58px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid transparent; }
.qv-thumb.active { border-color: var(--primary, #d6a62d); }
.qv-details { display: flex; flex-direction: column; gap: 12px; }
.qv-details h2 { margin: 0; font-size: 1.5rem; }
.qv-price { font-size: 1.4rem; font-weight: 700; color: #222; margin: 0; }
.qv-desc { color: #666; font-size: 0.9rem; line-height: 1.6; margin: 0; }
.qv-section { display: flex; flex-direction: column; gap: 8px; }
.qv-cta { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.wishlist-btn-lg { width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #eee; background: white; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
.wishlist-btn-lg:hover { border-color: #e74c3c; }

.wishlist-toggle-btn {
  display: flex; align-items: center; gap: 7px; padding: 9px 16px;
  border: 1.5px solid #e8e8e8; border-radius: 8px; background: white;
  cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #444;
  transition: border-color 0.2s, color 0.2s;
}
.wishlist-toggle-btn:hover { border-color: #e74c3c; color: #e74c3c; }

.wishlist-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9000; backdrop-filter: blur(2px); }
.wishlist-panel {
  position: fixed; top: 0; right: 0; width: 380px; height: 100vh;
  background: white; box-shadow: -4px 0 24px rgba(0,0,0,0.12);
  display: flex; flex-direction: column; z-index: 9001;
}
.wishlist-panel-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid #f0f0f0; }
.wishlist-panel-header h3 { margin: 0; font-size: 1.1rem; }
.wishlist-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; text-align: center; color: #888; }
.wishlist-items { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 16px; }
.wishlist-item { display: flex; gap: 14px; align-items: center; padding: 12px; border-radius: 10px; border: 1px solid #f0f0f0; background: #fafafa; }
.wishlist-item-img { width: 70px; height: 70px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #eee; }
.wishlist-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.wishlist-item-info h4 { margin: 0; font-size: 0.9rem; font-weight: 600; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wishlist-item-actions { display: flex; flex-direction: column; gap: 7px; }
.remove-wish-btn { width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid #eee; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #aaa; transition: border-color 0.2s, color 0.2s; }
.remove-wish-btn:hover { border-color: #e74c3c; color: #e74c3c; }

.action-btn { padding: 11px 22px; background: var(--primary, #d6a62d); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; transition: background 0.2s; }
.action-btn:hover { background: #b8891f; }

@media (max-width: 900px) {
  .filter-sidebar { position: fixed; left: -280px; top: 0; height: 100vh; z-index: 8000; border-radius: 0; overflow-y: auto; transition: left 0.3s ease; box-shadow: 4px 0 20px rgba(0,0,0,0.15); width: 260px; }
  .filter-sidebar.open { left: 0; }
  .qv-layout { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>