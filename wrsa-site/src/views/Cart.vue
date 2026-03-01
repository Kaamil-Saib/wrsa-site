<template>
  <div class="page-container">
    <header class="page-header">
      <h1>Shopping Cart</h1>
      <p v-if="!cartLoading && cartItems.length">
        {{ cartCount }} item{{ cartCount !== 1 ? 's' : '' }}
      </p>
    </header>

    <!-- Loading -->
    <div v-if="cartLoading" class="empty-state">
      <p style="color:#aaa;">Loading your cart...</p>
    </div>

    <!-- Empty cart -->
    <div v-else-if="cartItems.length === 0" class="empty-state">
      <font-awesome-icon icon="bag-shopping" class="empty-icon" />
      <p>Your cart is empty.</p>
      <router-link to="/shop" class="action-btn-small">Start Shopping</router-link>
    </div>

    <!-- Cart with items -->
    <div v-else class="cart-layout">

      <!-- Items list -->
      <div class="cart-items-list">
        <div
          v-for="item in cartItems"
          :key="`${item.productId}-${item.size}`"
          class="cart-item-row"
        >
          <!-- Product image -->
          <div class="cart-item-img-wrap">
            <img v-if="item.image" :src="item.image" :alt="item.name" class="cart-item-img" />
            <div v-else class="cart-item-img-placeholder">
              <font-awesome-icon icon="image" style="color:#ddd; font-size:1.5rem;" />
            </div>
          </div>

          <!-- Info -->
          <div class="cart-item-info">
            <h3>{{ item.name }}</h3>
            <span v-if="item.size" class="cart-item-size">Size: {{ item.size }}</span>
            <span class="price-tag">R{{ item.price }}</span>
          </div>

          <!-- Controls -->
          <div class="cart-item-controls">
            <div class="quantity-selector">
              <button @click="handleUpdateQty(item, -1)">−</button>
              <span>{{ item.quantity }}</span>
              <button @click="handleUpdateQty(item, 1)">+</button>
            </div>
            <span class="item-subtotal">R{{ item.price * item.quantity }}</span>
            <button @click="handleRemove(item)" class="text-btn-danger">Remove</button>
          </div>
        </div>

        <!-- Clear cart -->
        <div style="text-align:right; margin-top:10px;">
          <button @click="handleClearCart" class="text-btn-danger">Clear Cart</button>
        </div>
      </div>

      <!-- Order summary -->
      <aside class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal ({{ cartCount }} items)</span>
          <span>R{{ cartTotal }}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>R{{ cartTotal }}</span>
        </div>

        <!-- Guest: prompt sign in before checkout -->
        <div v-if="!isLoggedIn" class="guest-checkout-nudge">
          <p>
            <font-awesome-icon icon="lock" style="color:#d6a62d; margin-right:6px;" />
            Sign in to complete your order - your cart will be saved.
          </p>
          <router-link to="/signin" class="action-btn checkout-btn">
            <font-awesome-icon icon="sign-in-alt" />
            Sign In to Checkout
          </router-link>
          <router-link to="/register" class="register-link">
            New here? Create an account →
          </router-link>
        </div>

        <!-- Logged in: go to checkout -->
        <router-link v-else to="/checkout" class="action-btn checkout-btn">
          <font-awesome-icon icon="bag-shopping" />
          Proceed to Checkout
        </router-link>

        <router-link
          to="/shop"
          style="display:block; text-align:center; margin-top:14px; font-size:0.85rem; color:#888;"
        >
          ← Continue Shopping
        </router-link>
      </aside>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useCart } from '@/composables/useCart';

const emit = defineEmits(['notify']);

const isLoggedIn = ref(false);

const {
  cartItems, cartLoading, cartCount, cartTotal,
  updateQty, removeFromCart, clearCart,
} = useCart();

const handleUpdateQty = async (item, change) => {
  await updateQty(item.productId, item.size, change);
};

const handleRemove = async (item) => {
  await removeFromCart(item.productId, item.size);
  emit('notify', `${item.name} removed from cart`, 'info');
};

const handleClearCart = async () => {
  if (confirm('Clear your entire cart?')) {
    await clearCart();
    emit('notify', 'Cart cleared', 'info');
  }
};

onMounted(() => {
  onAuthStateChanged(getAuth(), (user) => {
    isLoggedIn.value = !!user;
  });
});
</script>
<style src="./Cart.css" scoped></style>

