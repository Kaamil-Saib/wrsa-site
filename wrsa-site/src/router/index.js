import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const routes = [
  { path: '/', name: 'home', component: () => import('../views/Home.vue') },
  { path: '/register', name: 'register', component: () => import('../views/Register.vue') },
  { path: '/signin', name: 'signin', component: () => import('../views/Signin.vue') },
  { path: '/shop', name: 'shop', component: () => import('../views/Shop.vue') },

  { path: '/ai-demo', name: 'ai-demo', component: () => import('../views/Aidemo.vue') },


  { 
    path: '/admin', 
    name: 'admin', 
    component: () => import('../views/Admin.vue'),
    meta: { requiresAdmin: true } // Specific check for admin role
  },
  { 
    path: '/wishlist', 
    name: 'wishlist',
    component: () => import('../views/Wishlist.vue'), 
    meta: { requiresAuth: true } 
  },
  { 
    path: '/cart', 
    name: 'cart',
    component: () => import('../views/Cart.vue'), 
    meta: { requiresAuth: true } 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * Helper: Fetches the user and their Firestore role.
 */
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

/**
 * Navigation Guard: Handles both Auth and Admin checks.
 */
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);

  if (requiresAuth || requiresAdmin) {
    const { user, role } = await getUserState();

    // 1. If route requires Admin
    if (requiresAdmin) {
      if (user && role === 'admin') {
        next();
      } else {
        // Not an admin? Kick to home with error query
        next({ path: "/", query: { auth_error: "admin_only" } });
      }
    } 
    // 2. If route requires basic Auth
    else if (requiresAuth) {
      if (user) {
        next();
      } else {
        next({ path: "/signin", query: { reason: "auth_required" } });
      }
    }
  } else {
    next();
  }
});

export default router;