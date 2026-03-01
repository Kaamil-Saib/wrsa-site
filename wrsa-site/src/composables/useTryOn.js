// src/composables/useTryOn.js
import { ref } from 'vue';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

export function useTryOn() {
  const loading       = ref(false);
  const error         = ref('');
  const resultDataUrl = ref('');

  const tryOnFn = httpsCallable(getFunctions(), 'tryOnAI', { timeout: 120_000 });

  /** Convert a File → raw base64 (no data-URL prefix) */
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload  = (e) => resolve(e.target.result.split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  /*  user photo persistence  */

  const getUserPhotoUrl = async () => {
    const user = getAuth().currentUser;
    if (!user) return null;
    try {
      const snap = await getDoc(doc(getFirestore(), 'uid', user.uid));
      return snap.exists() ? (snap.data().tryOnPhotoUrl ?? null) : null;
    } catch { return null; }
  };

  const saveUserPhoto = async (file) => {
    const user = getAuth().currentUser;
    if (!user) throw new Error('You must be signed in to save a photo.');
    const storageRef = sRef(getStorage(), `userPhotos/${user.uid}/tryon.jpg`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(getFirestore(), 'uid', user.uid), { tryOnPhotoUrl: url });
    return url;
  };

  /*  main action  */

  /**
   * Run the virtual try-on.
   *
   * Images are resolved server-side to avoid browser CORS restrictions.
   * When a new photo file is provided, its base64 is sent directly so the
   * function doesn't need to re-fetch it from Storage.
   */
  const runTryOn = async (productImageUrl, productName, productCategory, newPhotoFile = null) => {
    loading.value       = true;
    error.value         = '';
    resultDataUrl.value = '';

    try {
      let userPhotoUrl       = null;
      let userPhotoBase64    = null;
      let userPhotoMime      = 'image/jpeg';

      if (newPhotoFile) {
        // Upload first, then read base64 from the local file (no Storage fetch needed)
        userPhotoUrl    = await saveUserPhoto(newPhotoFile);
        userPhotoBase64 = await fileToBase64(newPhotoFile);
        userPhotoMime   = newPhotoFile.type || 'image/jpeg';
      } else {
        userPhotoUrl = await getUserPhotoUrl();
        if (!userPhotoUrl) {
          error.value = 'Please upload a photo of yourself first.';
          return null;
        }
      }

      // Pass URLs to the function — it fetches them server-side (no CORS issue).
      // For a fresh upload we also pass the base64 directly to skip the extra fetch.
      const { data } = await tryOnFn({
        userPhotoUrl,
        userPhotoBase64,   // null when using saved photo — function fetches via URL
        userPhotoMime,
        productImageUrl,
        productName,
        productCategory,
      });

      resultDataUrl.value = `data:${data.mimeType};base64,${data.imageBase64}`;
      return resultDataUrl.value;

    } catch (e) {
      console.error('[useTryOn]', e);
      error.value = e?.message || 'Try-on failed. Please try again.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, resultDataUrl, runTryOn, getUserPhotoUrl, saveUserPhoto };
}