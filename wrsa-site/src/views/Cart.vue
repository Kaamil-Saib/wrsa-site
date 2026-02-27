<template>
  <div class="page-container">
    <header class="page-header">
      <h1>Shopping Cart</h1>
    </header>

    <div v-if="cartItems.length === 0" class="empty-state">
      <font-awesome-icon icon="bag-shopping" class="empty-icon" />
      <p>Your cart is empty.</p>
      <router-link to="/shop" class="action-btn-small">Start Shopping</router-link>
    </div>

    <div v-else class="cart-layout">
      <div class="cart-items-list">
        <div v-for="item in cartItems" :key="item.id" class="cart-item-row">
          <div class="cart-item-info">
            <h3>{{ item.name }}</h3>
            <p class="price-tag">${{ item.price }}</p>
          </div>
          
          <div class="cart-item-controls">
            <div class="quantity-selector">
              <button @click="updateQty(item, -1)">-</button>
              <span>{{ item.quantity }}</span>
              <button @click="updateQty(item, 1)">+</button>
            </div>
            <button @click="removeFromCart(item)" class="text-btn-danger">Remove</button>
          </div>
        </div>
      </div>

      <aside class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal</span>
          <span>${{ subtotal }}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>${{ subtotal }}</span>
        </div>
        <button @click="checkout" class="action-btn">Checkout</button>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue';

const emit = defineEmits(['notify']);

const cartItems = ref([
  { id: 101, name: "Premium Headphones", price: 299, quantity: 1 },
  { id: 102, name: "Leather Journal", price: 45, quantity: 2 }
]);

const subtotal = computed(() => {
  return cartItems.value.reduce((acc, item) => acc + (item.price * item.quantity), 0);
});

const updateQty = (item, change) => {
  if (item.quantity + change > 0) {
    item.quantity += change;
  }
};

const removeFromCart = (item) => {
  cartItems.value = cartItems.value.filter(i => i.id !== item.id);
  emit('notify', "Item removed from cart", "info");
};

const checkout = () => {
  emit('notify', "Processing checkout...", "success");
};
</script>