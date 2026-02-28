<template>
  <div class="page-container">
    <header class="page-header">
      <h1>Shopping Cart</h1>
      <p v-if="!cartLoading && cartItems.length">
        {{ cartCount }} item{{ cartCount !== 1 ? 's' : '' }}
      </p>
    </header>

    <!-- Not signed in -->
    <div v-if="!isLoggedIn" class="empty-state">
      <font-awesome-icon icon="bag-shopping" class="empty-icon" />
      <p>Sign in to view your cart.</p>
      <router-link to="/signin" class="action-btn-small">Sign In</router-link>
    </div>

    <!-- Loading -->
    <div v-else-if="cartLoading" class="empty-state">
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

        <div v-for="item in cartItems" :key="`${item.productId}-${item.size}`" class="cart-item-row">

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
        <button @click="checkout" class="action-btn" style="width:100%; justify-content:center; margin-top:20px;">
          Checkout
        </button>
        <router-link to="/shop" style="display:block; text-align:center; margin-top:14px; font-size:0.85rem; color:#888;">
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
const { cartItems, cartLoading, cartCount, cartTotal, updateQty, removeFromCart, clearCart } = useCart();

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

const checkout = () => {
  emit('notify', 'Checkout coming soon!', 'info');
};

onMounted(() => {
  onAuthStateChanged(getAuth(), (user) => {
    isLoggedIn.value = !!user;
  });
});
</script>

<style scoped>
.cart-item-row {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);
}

.cart-item-img-wrap {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cart-item-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cart-item-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.cart-item-size {
  font-size: 0.8rem;
  color: #888;
  background: #f4f4f4;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.cart-item-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.item-subtotal {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text);
}

@media (max-width: 600px) {
  .cart-item-row {
    grid-template-columns: 60px 1fr;
  }
  .cart-item-controls {
    grid-column: span 2;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>