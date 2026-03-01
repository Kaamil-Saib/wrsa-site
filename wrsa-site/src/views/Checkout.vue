<template>
  <div class="page-container">
    <header class="page-header">
      <h1>Checkout</h1>
    </header>

    <div v-if="!isLoggedIn" class="empty-state">
      <font-awesome-icon icon="bag-shopping" class="empty-icon" />
      <p>Sign in to complete your order.</p>
      <router-link to="/signin" class="action-btn-small">Sign In</router-link>
    </div>

    <div v-else-if="!cartLoading && cartItems.length === 0 && !orderPlaced" class="empty-state">
      <font-awesome-icon icon="bag-shopping" class="empty-icon" />
      <p>Your cart is empty.</p>
      <router-link to="/shop" class="action-btn-small">Start Shopping</router-link>
    </div>

    <!--  Order confirmed  -->
    <div v-else-if="orderPlaced" class="success-state">
      <div class="success-icon-wrap">
        <font-awesome-icon icon="check" />
      </div>
      <h2>Order Placed!</h2>
      <p class="success-sub">Thank you, <strong>{{ customerName }}</strong>. Your order has been received.</p>
      <div class="order-id-box">
        <span>Order ID</span>
        <code>{{ placedOrderId }}</code>
      </div>

      <!-- Payment method confirmation -->
      <div class="payment-confirm-row">
        <div class="payment-confirm-badge" :class="selectedPayment">
          <font-awesome-icon :icon="paymentOptions.find(p => p.id === selectedPayment)?.icon" />
          {{ paymentOptions.find(p => p.id === selectedPayment)?.label }}
        </div>
        <span class="payment-confirm-note">{{ paymentConfirmNote }}</span>
      </div>

      <p class="status-note">Status: <span class="status-badge pending">Pending</span></p>
      <router-link to="/shop" class="action-btn" style="display:inline-flex; margin-top:24px; text-decoration:none;">
        Continue Shopping
      </router-link>
    </div>

    <!--  Checkout form  -->
    <div v-else class="checkout-layout">

      <!-- LEFT: Order summary -->
      <div class="checkout-items">
        <h3>Order Summary</h3>
        <div v-if="cartLoading" class="loading-hint">Loading cart...</div>
        <div v-else>
          <div v-for="item in cartItems" :key="`${item.productId}-${item.size}`" class="checkout-item-row">
            <div class="checkout-item-img-wrap">
              <img v-if="item.image" :src="item.image" :alt="item.name" />
              <div v-else class="img-placeholder"><font-awesome-icon icon="image" style="color:#ddd;" /></div>
            </div>
            <div class="checkout-item-info">
              <strong>{{ item.name }}</strong>
              <span v-if="item.size" class="size-tag">Size: {{ item.size }}</span>
              <span class="qty-tag">Qty: {{ item.quantity }}</span>
            </div>
            <div class="checkout-item-price">R{{ item.price * item.quantity }}</div>
          </div>

          <div class="checkout-totals">
            <div class="total-row">
              <span>Subtotal ({{ cartCount }} item{{ cartCount !== 1 ? 's' : '' }})</span>
              <span>R{{ cartTotal }}</span>
            </div>
            <div class="total-row">
              <span>Shipping</span>
              <span class="free-tag">Free</span>
            </div>
            <div class="total-row grand">
              <span>Total</span>
              <span>R{{ cartTotal }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: Details + payment + confirm -->
      <aside class="checkout-aside">

        <!-- Customer details -->
        <h3>Your Details</h3>
        <div class="details-card">
          <div class="detail-row">
            <font-awesome-icon icon="user" class="detail-icon" />
            <span>{{ customerName || '-' }}</span>
          </div>
          <div class="detail-row">
            <font-awesome-icon icon="envelope" class="detail-icon" />
            <span>{{ customerEmail || '-' }}</span>
          </div>
        </div>

        <!-- Payment method selection -->
        <h3 class="payment-heading">Payment Method</h3>
        <div class="payment-options">
          <label
            v-for="option in paymentOptions"
            :key="option.id"
            class="payment-option"
            :class="{ selected: selectedPayment === option.id }"
          >
            <input
              type="radio"
              :value="option.id"
              v-model="selectedPayment"
              class="payment-radio"
            />
            <div class="payment-option-icon" :class="option.id">
              <font-awesome-icon :icon="option.icon" />
            </div>
            <div class="payment-option-info">
              <span class="payment-option-label">{{ option.label }}</span>
              <span class="payment-option-desc">{{ option.desc }}</span>
            </div>
            <div class="payment-option-check" v-if="selectedPayment === option.id">
              <font-awesome-icon icon="check" />
            </div>
          </label>
        </div>

        <p class="simulation-note">
          <font-awesome-icon icon="lock" style="color:#d6a62d; margin-right:5px;" />
          This is a simulated order - no payment will be taken.
        </p>

        <button
          class="action-btn confirm-btn"
          @click="handlePlaceOrder"
          :disabled="placing || cartLoading || cartItems.length === 0 || !selectedPayment"
        >
          <font-awesome-icon v-if="placing" icon="spinner" spin />
          <font-awesome-icon v-else :icon="paymentOptions.find(p => p.id === selectedPayment)?.icon || 'bag-shopping'" />
          {{ placing ? 'Placing Order...' : `Pay with ${paymentOptions.find(p => p.id === selectedPayment)?.label || '…'}` }}
        </button>

        <router-link to="/cart" class="back-link">← Back to Cart</router-link>
        <p v-if="orderError" class="error-msg">{{ orderError }}</p>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useCart } from '@/composables/useCart';
import { useOrder } from '@/composables/useOrder';

const emit = defineEmits(['notify']);
const db = getFirestore();

const isLoggedIn    = ref(false);
const customerName  = ref('');
const customerEmail = ref('');

const { cartItems, cartLoading, cartCount, cartTotal } = useCart();
const { placeOrder } = useOrder();

const placing       = ref(false);
const orderPlaced   = ref(false);
const placedOrderId = ref('');
const orderError    = ref('');

/*  Payment  */
const selectedPayment = ref('');

const paymentOptions = [
  {
    id:    'cash',
    label: 'Cash on Delivery',
    desc:  'Pay in cash when your order arrives',
    icon:  'money-bill-wave',
  },
  {
    id:    'card',
    label: 'Credit / Debit Card',
    desc:  'Visa, Mastercard, Amex',
    icon:  'credit-card',
  },
  {
    id:    'paypal',
    label: 'PayPal',
    desc:  'Fast and secure via PayPal',
    icon:  ['fab', 'paypal'],
  },
  {
    id:    'eft',
    label: 'EFT / Bank Transfer',
    desc:  'Direct bank transfer',
    icon:  'building-columns',
  },
];

const paymentConfirmNote = computed(() => {
  const notes = {
    cash:   'Your order will be confirmed once cash is received on delivery.',
    card:   'Your card will be charged once your order is dispatched.',
    paypal: 'Payment authorised via PayPal.',
    eft:    'Please complete your bank transfer within 24 hours to confirm your order.',
  };
  return notes[selectedPayment.value] || '';
});

/*  Place order  */
const handlePlaceOrder = async () => {
  if (!selectedPayment.value) {
    emit('notify', 'Please select a payment method', 'error');
    return;
  }
  placing.value   = true;
  orderError.value = '';

  //stores on the Firestore order doc
  const result = await placeOrder({ paymentMethod: selectedPayment.value });

  placing.value = false;
  if (result.success) {
    placedOrderId.value = result.orderId;
    orderPlaced.value   = true;
    emit('notify', 'Order placed successfully!', 'success');
  } else {
    orderError.value = result.message;
    emit('notify', result.message, 'error');
  }
};

onMounted(() => {
  onAuthStateChanged(getAuth(), async (user) => {
    isLoggedIn.value = !!user;
    if (user) {
      try {
        const snap = await getDoc(doc(db, 'uid', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          customerName.value  = [d.firstName, d.surname].filter(Boolean).join(' ');
          customerEmail.value = d.email || user.email;
        } else {
          customerName.value  = user.displayName || 'Customer';
          customerEmail.value = user.email;
        }
      } catch {
        customerName.value  = user.displayName || 'Customer';
        customerEmail.value = user.email;
      }
    }
  });
});
</script>

<style src="./Checkout.css" scoped></style>

