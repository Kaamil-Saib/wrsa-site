<template>
  <div class="page-container">
    <header class="page-header">
      <h1>My Wishlist</h1>
      <p v-if="!loading && wishlistProducts.length">
        {{ wishlistProducts.length }} item{{ wishlistProducts.length !== 1 ? 's' : '' }} saved
      </p>
    </header>

    <!-- Not signed in -->
    <div v-if="!isLoggedIn" class="empty-state">
      <font-awesome-icon icon="heart" class="empty-icon" />
      <p>Sign in to view and save your wishlist.</p>
      <router-link to="/signin" class="action-btn-small">Sign In</router-link>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="empty-state">
      <p style="color:#aaa;">Loading your wishlist...</p>
    </div>

    <!-- Empty wishlist -->
    <div v-else-if="wishlistProducts.length === 0" class="empty-state">
      <font-awesome-icon icon="heart" class="empty-icon" />
      <p>Your wishlist is empty.</p>
      <router-link to="/shop" class="action-btn-small">Go Shopping</router-link>
    </div>

    <!-- Wishlist items -->
    <div v-else class="grid-layout">
      <div v-for="product in wishlistProducts" :key="product.id" class="item-card">

        <!-- Product Image -->
        <div class="wishlist-img-wrap">
          <img
            v-if="product.images && product.images[0]"
            :src="product.images[0]"
            :alt="product.name"
            class="wishlist-img"
          />
          <div v-else class="wishlist-img-placeholder">
            <font-awesome-icon icon="image" style="font-size:2rem; color:#ddd;" />
          </div>
        </div>

        <div class="item-details">
          <span class="item-category">{{ product.category }}</span>
          <h3>{{ product.name }}</h3>
          <span class="price-tag">R{{ product.price }}</span>

          <!-- Sizes -->
          <div v-if="product.sizes && product.sizes.length" class="wishlist-sizes">
            <span v-for="sz in product.sizes" :key="sz" class="sz-chip">{{ sz }}</span>
          </div>
        </div>

        <div class="item-footer">
          <button @click="addToCart(product)" class="action-btn">Add to Cart</button>
          <button @click="removeFromWishlist(product)" class="text-btn-danger">
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { useWishlist } from '@/composables/useWishlist';

const emit = defineEmits(['notify']);

const db = getFirestore();
const isLoggedIn = ref(false);
const allProducts = ref([]);
const loading = ref(true);

const { wishlistIds, wishlistLoading, toggle } = useWishlist();

// Only show products that are in the wishlist
const wishlistProducts = computed(() =>
  allProducts.value.filter(p => wishlistIds.value.includes(p.id))
);

const removeFromWishlist = async (product) => {
  const result = await toggle(product);
  if (result.success) {
    emit('notify', result.message, 'info');
  } else {
    emit('notify', result.message, 'error');
  }
};

const addToCart = (product) => {
  // Wire up to cart later
  emit('notify', `${product.name} added to cart!`, 'success');
};

onMounted(() => {
  onAuthStateChanged(getAuth(), async (user) => {
    isLoggedIn.value = !!user;

    if (user) {
      try {
        // Fetch all products once — we filter client-side via wishlistIds
        const snap = await getDocs(collection(db, 'products'));
        allProducts.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.error('[Wishlist] fetch error:', e);
      }
    }

    loading.value = false;
  });
});
</script>

<style scoped>
.wishlist-img-wrap {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 14px;
  background: #f5f5f5;
}

.wishlist-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.wishlist-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-category {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--primary);
  display: block;
  margin-bottom: 4px;
}

.wishlist-sizes {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.sz-chip {
  background: #f4f4f4;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #555;
}
</style>