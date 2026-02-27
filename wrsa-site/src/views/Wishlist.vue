<template>
  <div class="page-container">
    <header class="page-header">
      <h1>My Wishlist</h1>
      <p v-if="wishlistItems.length">You have {{ wishlistItems.length }} items saved.</p>
    </header>

    <div v-if="wishlistItems.length === 0" class="empty-state">
      <font-awesome-icon icon="heart" class="empty-icon" />
      <p>Your wishlist is currently empty.</p>
      <router-link to="/shop" class="action-btn-small">Go Shopping</router-link>
    </div>

    <div v-else class="grid-layout">
      <div v-for="item in wishlistItems" :key="item.id" class="item-card">
        <div class="item-details">
          <h3>{{ item.name }}</h3>
          <span class="price-tag">${{ item.price }}</span>
        </div>
        
        <div class="item-footer">
          <button @click="moveToCart(item)" class="action-btn">Add to Cart</button>
          <button @click="removeItem(item.id)" class="text-btn-danger">Remove</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['notify']);

// Mock data
const wishlistItems = ref([
  { id: 1, name: "Golden Watch", price: 120 },
  { id: 2, name: "Minimalist Lamp", price: 85 }
]);

const removeItem = (id) => {
  wishlistItems.value = wishlistItems.value.filter(item => item.id !== id);
  emit('notify', "Item removed from wishlist", "info");
};

const moveToCart = (item) => {
  emit('notify', `${item.name} added to cart!`, "success");
};
</script>