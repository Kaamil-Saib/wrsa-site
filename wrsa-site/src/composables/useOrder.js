// src/composables/useOrder.js
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useCart } from '@/composables/useCart';

export function useOrder() {
  const { cartItems, cartTotal, clearCart } = useCart();

  /**
   * Place an order.
   * @param {Object} options
   * @param {string} options.paymentMethod  — 'cash' | 'card' | 'paypal' | 'eft'
   */
  const placeOrder = async ({ paymentMethod = 'cash' } = {}) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return { success: false, message: 'You must be signed in to place an order.' };
    if (!cartItems.value.length) return { success: false, message: 'Your cart is empty.' };

    try {
      const db = getFirestore();

      const orderData = {
        userId:        user.uid,
        customerName:  user.displayName || 'Customer',
        email:         user.email,
        items:         cartItems.value.map(item => ({
          productId: item.productId,
          name:      item.name,
          price:     item.price,
          quantity:  item.quantity,
          size:      item.size || '',
          image:     item.image || '',
        })),
        total:         cartTotal.value,
        paymentMethod,           // ← stored for reporting
        status:        'pending',
        createdAt:     serverTimestamp(),
        updatedAt:     serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      await clearCart();

      return { success: true, orderId: docRef.id };
    } catch (e) {
      console.error('[useOrder] placeOrder error:', e);
      return { success: false, message: 'Failed to place order. Please try again.' };
    }
  };

  return { placeOrder };
}