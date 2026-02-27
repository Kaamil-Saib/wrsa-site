<template>
  <div class="home-container">
    <header class="hero-section">
      <h1>Welcome to Our Store</h1>
      <p>Discover our exclusive collection and amazing deals.</p>
      <button><router-link to="/shop" class="action-btn">Start Shopping</router-link></button>
    </header>
  </div>
</template>

<script setup>
import { defineEmits } from 'vue';

// Declaring this acknowledges the @notify listener from router-view in App.vue
const emit = defineEmits(['notify']);
</script>

<style scoped>
.home-container {
  padding: 40px 20px;
  text-align: center;
}

.hero-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 20px;
  background: #f9f9f9;
  border-radius: 15px;
}

</style>