// src/composables/useCart.js
import { ref, computed } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * useCart — supports both guest (localStorage) and authenticated (Firestore) carts.
 *
 * Guest:  items saved to localStorage under 'guest_cart'
 * User:   items saved to Firestore uid/{uid}.cart
 *
 * On login: guest cart is merged into the user's Firestore cart, then cleared.
 */

const GUEST_CART_KEY = 'guest_cart';

const cartItems   = ref([]);
const cartLoading = ref(false);
let   currentUid  = null;

const db   = getFirestore();
const auth = getAuth();

/*  persistence helpers  */

const readGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeGuestCart = (items) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('[useCart] localStorage write error:', e);
  }
};

const clearGuestCart = () => {
  try { localStorage.removeItem(GUEST_CART_KEY); } catch {}
};

const saveCart = async () => {
  if (currentUid) {
    // Authenticated — persist to Firestore
    try {
      await updateDoc(doc(db, 'uid', currentUid), { cart: cartItems.value });
    } catch (e) {
      console.error('[useCart] Firestore save error:', e);
    }
  } else {
    // Guest — persist to localStorage
    writeGuestCart(cartItems.value);
  }
};

/*  merge helper  */

/**
 * Merge guestItems into baseItems.
 * If the same productId+size exists in both, quantities are summed.
 */
const mergeItems = (baseItems, guestItems) => {
  const merged = [...baseItems];
  for (const guestItem of guestItems) {
    const existing = merged.find(
      i => i.productId === guestItem.productId && i.size === guestItem.size
    );
    if (existing) {
      existing.quantity += guestItem.quantity;
    } else {
      merged.push({ ...guestItem });
    }
  }
  return merged;
};

/*  auth state listener  */

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUid    = user.uid;
    cartLoading.value = true;

    try {
      const snap       = await getDoc(doc(db, 'uid', user.uid));
      const firestoreCart = snap.exists() ? (snap.data().cart || []) : [];
      const guestCart  = readGuestCart();

      if (guestCart.length > 0) {
        // Merge guest items into the user's cart
        cartItems.value = mergeItems(firestoreCart, guestCart);
        clearGuestCart();
        // Persist the merged cart immediately
        await updateDoc(doc(db, 'uid', user.uid), { cart: cartItems.value });
      } else {
        cartItems.value = firestoreCart;
      }
    } catch (e) {
      console.error('[useCart] fetch error:', e);
    } finally {
      cartLoading.value = false;
    }

  } else {
    // Signed out — load guest cart from localStorage
    currentUid      = null;
    cartItems.value = readGuestCart();
  }
});

/*  composable  */

export function useCart() {
  const cartCount = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  const cartTotal = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  /**
   * Add a product to the cart (works for both guests and logged-in users).
   */
  const addToCart = async (product, size = '', quantity = 1) => {
    const existing = cartItems.value.find(
      item => item.productId === product.id && item.size === size
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      cartItems.value.push({
        productId: product.id,
        name:      product.name,
        price:     product.price,
        image:     product.images?.[0] || null,
        size,
        quantity,
      });
    }

    await saveCart();
    return { success: true, message: `${product.name} added to cart` };
  };

  const updateQty = async (productId, size, change) => {
    const item = cartItems.value.find(
      i => i.productId === productId && i.size === size
    );
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
      cartItems.value = cartItems.value.filter(
        i => !(i.productId === productId && i.size === size)
      );
    }

    await saveCart();
  };

  const removeFromCart = async (productId, size) => {
    cartItems.value = cartItems.value.filter(
      i => !(i.productId === productId && i.size === size)
    );
    await saveCart();
  };

  const clearCart = async () => {
    cartItems.value = [];
    await saveCart();
  };

  return {
    cartItems,
    cartLoading,
    cartCount,
    cartTotal,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
  };
}