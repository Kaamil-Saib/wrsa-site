<template>
  <div class="page-container">
    <header class="page-header">
      <h1>My Orders</h1>
      <p v-if="!loading && orders.length">
        {{ orders.length }} order{{ orders.length !== 1 ? 's' : '' }}
      </p>
    </header>

    <div v-if="!isLoggedIn" class="empty-state">
      <font-awesome-icon icon="bag-shopping" class="empty-icon" />
      <p>Sign in to view your orders.</p>
      <router-link to="/signin" class="action-btn-small">Sign In</router-link>
    </div>

    <div v-else-if="loading" class="empty-state">
      <p style="color:#aaa;">Loading your orders...</p>
    </div>

    <div v-else-if="orders.length === 0" class="empty-state">
      <font-awesome-icon icon="bag-shopping" class="empty-icon" />
      <p>You haven't placed any orders yet.</p>
      <router-link to="/shop" class="action-btn-small">Start Shopping</router-link>
    </div>

    <div v-else class="orders-wrapper">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        :class="{ expanded: expandedId === order.id }"
      >
        <!-- Header -->
        <div class="order-header" @click="toggleExpand(order.id)">
          <div class="order-header-left">
            <div class="order-meta">
              <span class="order-id">
                <font-awesome-icon icon="clipboard-list" style="margin-right:6px; opacity:0.4;" />
                #{{ order.id.slice(0, 8).toUpperCase() }}
              </span>
              <span class="order-date">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="order-summary-pills">
              <span class="summary-pill">{{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}</span>
              <span class="summary-pill total">R{{ order.total }}</span>
            </div>
          </div>
          <div class="order-header-right">
            <span :class="['status-badge', order.status]">
              <span class="status-dot"></span>{{ order.status }}
            </span>
            <font-awesome-icon icon="angle-down" class="expand-icon" :class="{ rotated: expandedId === order.id }" />
          </div>
        </div>

        <!-- Progress track -->
        <div class="progress-track">
          <div
            v-for="(step, i) in STATUS_STEPS" :key="step"
            class="progress-step"
            :class="{ done: statusIndex(order.status) > i, active: statusIndex(order.status) === i }"
          >
            <div class="step-dot">
              <font-awesome-icon v-if="statusIndex(order.status) > i" icon="check" />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="step-label">{{ step }}</span>
            <div v-if="i < STATUS_STEPS.length - 1" class="step-line" :class="{ filled: statusIndex(order.status) > i }"></div>
          </div>
        </div>

        <!-- Expanded items -->
        <transition name="slide-down">
          <div v-if="expandedId === order.id" class="order-items">
            <div v-for="item in order.items" :key="`${item.productId}-${item.size}`" class="order-item-row">
              <div class="order-item-img-wrap">
                <img v-if="item.image" :src="item.image" :alt="item.name" />
                <div v-else class="img-placeholder"><font-awesome-icon icon="image" style="color:#ddd;" /></div>
              </div>
              <div class="order-item-info">
                <strong>{{ item.name }}</strong>
                <div class="item-tags">
                  <span v-if="item.size" class="tag">Size: {{ item.size }}</span>
                  <span class="tag">Qty: {{ item.quantity }}</span>
                </div>
              </div>
              <div class="order-item-price">R{{ item.price * item.quantity }}</div>
            </div>
            <div class="order-total-row">
              <span>Order Total</span>
              <strong>R{{ order.total }}</strong>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const emit = defineEmits(['notify']);
const db = getFirestore();
const isLoggedIn = ref(false); const loading = ref(true); const orders = ref([]); const expandedId = ref(null);
const STATUS_STEPS = ['pending', 'confirmed', 'completed'];
const statusIndex = (s) => STATUS_STEPS.indexOf(s);
const toggleExpand = (id) => { expandedId.value = expandedId.value === id ? null : id; };
const formatDate = (ts) => {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
onMounted(() => {
  onAuthStateChanged(getAuth(), async (user) => {
    isLoggedIn.value = !!user;
    if (user) {
      try {
        const snap = await getDocs(query(collection(db, 'orders'), where('uid', '==', user.uid)));
        orders.value = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        if (orders.value.length) expandedId.value = orders.value[0].id;
      } catch (e) { console.error('[MyOrders]', e); emit('notify', 'Could not load orders', 'error'); }
    }
    loading.value = false;
  });
});
</script>

<style src="./MyOrders.css" scoped></style>