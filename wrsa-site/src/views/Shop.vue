<template>
  <div class="shop-container">
    <h1>Our Shop</h1>
    <p>Browse our latest collection here.</p>
    
    <div class="product-grid">
      </div>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';
const emit = defineEmits(['notify']);
</script>

<style scoped>
.shop-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 2rem;
}
</style>