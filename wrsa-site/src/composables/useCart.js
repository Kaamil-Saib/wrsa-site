import { ref, computed } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * useCart — per-user cart synced to Firestore.
 *
 * Cart items are stored as:
 *   { productId, name, price, image, size, quantity }
 *
 * Usage:
 *   const { cartItems, addToCart, removeFromCart, updateQty, cartCount, cartTotal, clearCart } = useCart()
 */

// Module-level shared state
const cartItems = ref([]);
const cartLoading = ref(false);
let currentUid = null;

const db = getFirestore();
const auth = getAuth();

const saveCart = async () => {
  if (!currentUid) return;
  try {
    await updateDoc(doc(db, 'uid', currentUid), { cart: cartItems.value });
  } catch (e) {
    console.error('[useCart] save error:', e);
  }
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUid = user.uid;
    cartLoading.value = true;
    try {
      const snap = await getDoc(doc(db, 'uid', user.uid));
      if (snap.exists()) {
        cartItems.value = snap.data().cart || [];
      }
    } catch (e) {
      console.error('[useCart] fetch error:', e);
    } finally {
      cartLoading.value = false;
    }
  } else {
    currentUid = null;
    cartItems.value = [];
  }
});

export function useCart() {
  const cartCount = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  );

  const cartTotal = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  /**
   * Add a product to the cart.
   * If the same productId + size combo exists, increment quantity.
   * @param {object} product  - Full product object from Firestore
   * @param {string} size     - Selected size (can be '' if product has no sizes)
   * @param {number} quantity - How many to add (default 1)
   */
  const addToCart = async (product, size = '', quantity = 1) => {
    if (!currentUid) {
      return { success: false, message: 'Sign in to use your cart' };
    }

    const existing = cartItems.value.find(
      item => item.productId === product.id && item.size === size
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      cartItems.value.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || null,
        size,
        quantity,
      });
    }

    await saveCart();
    return { success: true, message: `${product.name} added to cart` };
  };

  /**
   * Change the quantity of a specific cart item.
   * Removes the item if quantity drops to 0.
   */
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

  /**
   * Remove a specific cart item entirely.
   */
  const removeFromCart = async (productId, size) => {
    cartItems.value = cartItems.value.filter(
      i => !(i.productId === productId && i.size === size)
    );
    await saveCart();
  };

  /**
   * Empty the entire cart.
   */
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