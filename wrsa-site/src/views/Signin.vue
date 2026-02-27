<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <h1>Sign In</h1>
      
      <div class="input-group">
        <input 
          type="email" 
          placeholder="Email Address" 
          v-model.trim="email" 
          @keyup.enter="signIn"
        >
        <input 
          type="password" 
          placeholder="Password" 
          v-model="password" 
          @keyup.enter="signIn"
        >
      </div>

      <button class="action-btn" @click="signIn">Sign In</button>
      
      <div class="divider">or</div>
      
      <button class="google-btn" @click="signInWithGoogle">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18">
        Sign in with Google
      </button>

      <p class="footer-text">
        New here? <router-link to="/register">Create an account</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from "vue";
import { useRouter, useRoute } from "vue-router";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const emit = defineEmits(['notify']);

const email = ref("");
const password = ref("");
const router = useRouter();
const route = useRoute();
const db = getFirestore();

onMounted(() => {
  if (route.query.reason === "auth_required") {
    emit('notify', "Please sign in to access that page.", "info");
  }
});

const signIn = async () => {
  if (!email.value || !password.value) {
    emit('notify', "Please enter your credentials", "error");
    return;
  }

  try {
    await signInWithEmailAndPassword(getAuth(), email.value, password.value);
    emit('notify', "Welcome back!", "success");
    console.log("User signed in:", getAuth().currentUser);
    router.push("/");
  } catch (error) {
    emit('notify', "Invalid email or password", "error");
  }
};

const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(getAuth(), new GoogleAuthProvider());
    
    /** * IMPORTANT: For Google login, we use setDoc with { merge: true }.
     * This ensures if it's a new user, they get a "user" role in your 'uid' collection.
     * If they are an existing admin, it won't overwrite their 'admin' role.
     */
    await setDoc(doc(db, "uid", res.user.uid), {
      email: res.user.email,
      role: "user" 
    }, { merge: true });

    emit('notify', "Signed in with Google", "success");
    router.push("/");
  } catch (error) {
    emit('notify', "Google sign-in failed", "error");
  }
};
</script>