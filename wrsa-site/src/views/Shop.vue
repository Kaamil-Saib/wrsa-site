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
            @click="openQuickView(product)"
          >
            <div class="card-image-wrap">
              <img
                :src="hoveredId === product.id && product.images?.[1] ? product.images[1] : product.images?.[0]"
                :alt="product.name"
                class="card-img"
              />
              <div class="card-actions">
                <button class="card-action-btn" @click.stop="toggleWishlistItem(product)">
                  <font-awesome-icon icon="heart" :style="{ color: inWishlist(product.id) ? '#e74c3c' : 'white' }" />
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
                <button class="add-to-cart-btn" @click.stop="product.sizes?.length ? openQuickView(product) : addToCart(product)">
                  <font-awesome-icon icon="bag-shopping" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- List view -->
        <div v-else class="product-list">
          <div
            v-for="product in filteredProducts" :key="product.id"
            class="list-card"
            @click="openQuickView(product)"
            style="cursor:pointer;"
          >
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
              <button class="action-btn" @click.stop="openQuickView(product)">Add to Cart</button>
              <button class="wishlist-btn" @click.stop="toggleWishlistItem(product)">
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
              <button class="add-to-cart-btn" @click="openQuickView(product); showWishlistPanel = false">
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

            <div class="qv-section">
              <label class="filter-label">Quantity</label>
              <div class="qv-quantity">
                <button class="qty-btn" @click="qvQty = Math.max(1, qvQty - 1)">−</button>
                <span class="qty-value">{{ qvQty }}</span>
                <button class="qty-btn" @click="qvQty++">+</button>
              </div>
            </div>

            <div class="qv-cta">
              <button
                class="action-btn"
                @click="addToCart(quickViewProduct, selectedQVSize, qvQty); quickViewProduct = null"
              >
                <font-awesome-icon icon="bag-shopping" /> Add to Cart
              </button>
              <button
                class="tryon-btn"
                @click="tryOnProduct = quickViewProduct"
                title="Virtual Try-On"
              >
                <font-awesome-icon icon="wand-magic-sparkles" />
                Try On
              </button>
              <button class="wishlist-btn-lg" @click="toggleWishlistItem(quickViewProduct)">
                <font-awesome-icon icon="heart" :style="{ color: inWishlist(quickViewProduct.id) ? '#e74c3c' : '#ccc' }" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TRY ON MODAL -->
    <TryOnModal
      v-if="tryOnProduct"
      :product="tryOnProduct"
      @close="tryOnProduct = null"
      @notify="(msg, type) => emit('notify', msg, type)"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useWishlist } from '@/composables/useWishlist'
import { useCart } from '@/composables/useCart'
import TryOnModal from '@/components/TryOnModal.vue'

const emit = defineEmits(['notify'])
const db = getFirestore()

const products   = ref([])
const categories = ref([])
const colors     = ref([])
const sizes      = ref([])
const loading    = ref(true)

const viewMode          = ref('grid')
const sidebarOpen       = ref(false)
const hoveredId         = ref(null)
const quickViewProduct  = ref(null)
const activeImageIndex  = ref(0)
const selectedQVSize    = ref('')
const qvQty             = ref(1)
const tryOnProduct      = ref(null)

const search           = ref('')
const selectedCategory = ref('')
const selectedColor    = ref('')
const selectedSizes    = ref([])
const minPrice         = ref(null)
const maxPrice         = ref(null)
const sortBy           = ref('newest')

const showWishlistPanel = ref(false)

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

const { addToCart: addToCartStore } = useCart()

const addToCart = async (product, size = '', quantity = 1) => {
  const result = await addToCartStore(product, size, quantity)
  if (result.success) {
    emit('notify', result.message, 'success')
  } else {
    emit('notify', result.message || 'Sign in to use your cart', 'error')
  }
}

const openQuickView = (product) => {
  quickViewProduct.value = product
  activeImageIndex.value = 0
  selectedQVSize.value   = (product.sizes && product.sizes[0]) || ''
  qvQty.value            = 1
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
  if (selectedColor.value)    temp = temp.filter(p => p.color === selectedColor.value)
  if (selectedSizes.value.length) {
    temp = temp.filter(p => Array.isArray(p.sizes) && p.sizes.some(s => selectedSizes.value.includes(s)))
  }
  if (minPrice.value != null) temp = temp.filter(p => p.price >= minPrice.value)
  if (maxPrice.value != null) temp = temp.filter(p => p.price <= maxPrice.value)

  temp.sort((a, b) => {
    if (sortBy.value === 'price-asc')  return (a.price || 0) - (b.price || 0)
    if (sortBy.value === 'price-desc') return (b.price || 0) - (a.price || 0)
    if (sortBy.value === 'name-asc')   return (a.name || '').localeCompare(b.name || '')
    if (sortBy.value === 'name-desc')  return (b.name || '').localeCompare(a.name || '')
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
    products.value   = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    categories.value = catSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    colors.value     = colorSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    const rawSizes   = sizeSnap.docs.map(d => ({ id: d.id, ...d.data() }))
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

<style src="./Shop.css" scoped></style>