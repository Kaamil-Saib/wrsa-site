<script setup>
import { ref, computed, onMounted } from 'vue'
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useWishlist } from '@/composables/useWishlist'   // ← ADD THIS

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

//  REPLACE the old local wishlist ref with the composable 
const { wishlistIds, toggle: toggleWishlist } = useWishlist()

// Products whose IDs are in the wishlist
const wishlistProducts = computed(() =>
  products.value.filter(p => wishlistIds.value.includes(p.id))
)

const inWishlist = (id) => wishlistIds.value.includes(id)

const toggleWishlistItem = async (product) => {
  const result = await toggleWishlist(product)
  if (result.success) {
    emit('notify', result.message, result.added ? 'success' : 'info')
  } else {
    emit('notify', result.message || 'Sign in to use your wishlist', 'error')
  }
}
// 

const addToCart = (product) => {
  emit('notify', `${product.name} added to cart!`, 'success')
}

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