import { ref, computed } from 'vue';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';

/**
 * useWishlist — per-user wishlist synced to Firestore.
 *
 * Usage in any component:
 *   const { wishlistIds, toggle, inWishlist, loading } = useWishlist()
 *
 * wishlistIds  — ref([]) of product ID strings
 * inWishlist(id) — returns true/false
 * toggle(product) — adds or removes, saves to Firestore
 * loading — true while fetching on mount
 */

// Module-level state so it's shared across all components that call useWishlist()
const wishlistIds = ref([]);
const wishlistLoading = ref(false);
let currentUid = null;

// Initialise once when the module is first imported
const db = getFirestore();
const auth = getAuth();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUid = user.uid;
    wishlistLoading.value = true;
    try {
      const snap = await getDoc(doc(db, 'uid', user.uid));
      if (snap.exists()) {
        wishlistIds.value = snap.data().wishlist || [];
      }
    } catch (e) {
      console.error('[useWishlist] fetch error:', e);
    } finally {
      wishlistLoading.value = false;
    }
  } else {
    // User signed out — clear wishlist
    currentUid = null;
    wishlistIds.value = [];
  }
});

export function useWishlist() {
  const inWishlist = (productId) => wishlistIds.value.includes(productId);

  const toggle = async (product) => {
    if (!currentUid) return { success: false, message: 'Sign in to use your wishlist' };

    const isIn = inWishlist(product.id);
    const userRef = doc(db, 'uid', currentUid);

    try {
      if (isIn) {
        // Optimistic update
        wishlistIds.value = wishlistIds.value.filter(id => id !== product.id);
        await updateDoc(userRef, { wishlist: arrayRemove(product.id) });
        return { success: true, added: false, message: `${product.name} removed from wishlist` };
      } else {
        // Optimistic update
        wishlistIds.value.push(product.id);
        await updateDoc(userRef, { wishlist: arrayUnion(product.id) });
        return { success: true, added: true, message: `${product.name} added to wishlist` };
      }
    } catch (e) {
      // Rollback optimistic update on error
      if (isIn) {
        wishlistIds.value.push(product.id);
      } else {
        wishlistIds.value = wishlistIds.value.filter(id => id !== product.id);
      }
      console.error('[useWishlist] toggle error:', e);
      return { success: false, message: 'Something went wrong. Try again.' };
    }
  };

  return {
    wishlistIds,          // ref([]) — all wishlisted product IDs
    wishlistLoading,      // ref(bool)
    inWishlist,           // (id: string) => boolean
    toggle,               // (product: object) => Promise<{success, added, message}>
  };
}