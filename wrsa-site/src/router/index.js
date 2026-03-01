import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const routes = [
  { path: '/',         name: 'home',      component: () => import('../views/Home.vue') },
  { path: '/register', name: 'register',  component: () => import('../views/Register.vue') },
  { path: '/signin',   name: 'signin',    component: () => import('../views/Signin.vue') },
  { path: '/shop',     name: 'shop',      component: () => import('../views/Shop.vue') },
  { path: '/ai-demo',  name: 'ai-demo',   component: () => import('../views/Aidemo.vue') },
  { path: '/cart',     name: 'cart',      component: () => import('../views/Cart.vue') },  // ← no requiresAuth
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAdmin: true }
  },
  {
    path: '/wishlist',
    name: 'wishlist',
    component: () => import('../views/Wishlist.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('../views/Checkout.vue'),
    meta: { requiresAuth: true }   // ← checkout still requires login
  },
  {
    path: '/my-orders',
    name: 'my-orders',
    component: () => import('../views/MyOrders.vue'),
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

const getUserState = () => {
  return new Promise((resolve) => {
    const removeListener = onAuthStateChanged(getAuth(), async (user) => {
      removeListener();
      if (user) {
        const userDoc = await getDoc(doc(getFirestore(), "uid", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : 'user';
        resolve({ user, role });
      } else {
        resolve({ user: null, role: null });
      }
    });
  });
};

router.beforeEach(async (to, from, next) => {
  const requiresAuth  = to.matched.some(r => r.meta.requiresAuth);
  const requiresAdmin = to.matched.some(r => r.meta.requiresAdmin);

  if (requiresAuth || requiresAdmin) {
    const { user, role } = await getUserState();
    if (requiresAdmin) {
      if (user && role === 'admin') next();
      else next({ path: '/', query: { auth_error: 'admin_only' } });
    } else if (requiresAuth) {
      if (user) next();
      else next({ path: '/signin', query: { reason: 'auth_required' } });
    }
  } else {
    next();
  }
});

export default router;