<template>
  <div class="page-container">
    <header class="page-header">
      <h1>My Wishlist</h1>
      <p v-if="!loading && wishlistProducts.length">
        {{ wishlistProducts.length }} item{{ wishlistProducts.length !== 1 ? 's' : '' }} saved
      </p>
    </header>

    <div v-if="!isLoggedIn" class="empty-state">
      <font-awesome-icon icon="heart" class="empty-icon" />
      <p>Sign in to view and save your wishlist.</p>
      <router-link to="/signin" class="action-btn-small">Sign In</router-link>
    </div>

    <div v-else-if="loading" class="empty-state">
      <p style="color:#aaa;">Loading your wishlist...</p>
    </div>

    <div v-else-if="wishlistProducts.length === 0" class="empty-state">
      <font-awesome-icon icon="heart" class="empty-icon" />
      <p>Your wishlist is empty.</p>
      <router-link to="/shop" class="action-btn-small">Go Shopping</router-link>
    </div>

    <div v-else class="grid-layout">
      <div v-for="product in wishlistProducts" :key="product.id" class="item-card">
        <div class="wishlist-img-wrap">
          <img v-if="product.images && product.images[0]" :src="product.images[0]" :alt="product.name" class="wishlist-img" />
          <div v-else class="wishlist-img-placeholder">
            <font-awesome-icon icon="image" style="font-size:2rem; color:#ddd;" />
          </div>
        </div>
        <div class="item-details">
          <span class="item-category">{{ product.category }}</span>
          <h3>{{ product.name }}</h3>
          <span class="price-tag">R{{ product.price }}</span>
          <div v-if="product.sizes && product.sizes.length" class="wishlist-sizes">
            <span v-for="sz in product.sizes" :key="sz" class="sz-chip">{{ sz }}</span>
          </div>
        </div>
        <div class="item-footer">
          <button @click="addToCart(product)" class="action-btn">Add to Cart</button>
          <button @click="removeFromWishlist(product)" class="text-btn-danger">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useWishlist } from '@/composables/useWishlist';

const emit = defineEmits(['notify']);
const db = getFirestore(); const isLoggedIn = ref(false); const allProducts = ref([]); const loading = ref(true);
const { wishlistIds, toggle } = useWishlist();
const wishlistProducts = computed(() => allProducts.value.filter(p => wishlistIds.value.includes(p.id)));

const removeFromWishlist = async (product) => {
  const r = await toggle(product);
  emit('notify', r.message, r.success ? 'info' : 'error');
};
const addToCart = (product) => { emit('notify', `${product.name} added to cart!`, 'success'); };

onMounted(() => {
  onAuthStateChanged(getAuth(), async (user) => {
    isLoggedIn.value = !!user;
    if (user) {
      try { const snap = await getDocs(collection(db, 'products')); allProducts.value = snap.docs.map(d => ({ id: d.id, ...d.data() })); }
      catch (e) { console.error('[Wishlist]', e); }
    }
    loading.value = false;
  });
});
</script>

<style src= "Wishlist.css" scoped></style>