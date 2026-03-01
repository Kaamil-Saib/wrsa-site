<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <div class="auth-logo">Wild Rhino SA</div>
      <h1>Sign In</h1>
      <p class="auth-sub">Welcome back. Gear's waiting.</p>

      <div class="input-group">
        <input type="email" placeholder="Email Address" v-model.trim="email" @keyup.enter="signIn">
        <input type="password" placeholder="Password" v-model="password" @keyup.enter="signIn">
      </div>

      <button class="action-btn" @click="signIn">Sign In</button>

      <div class="divider"><span>or</span></div>

      <button class="google-btn" @click="signInWithGoogle">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18">
        Continue with Google
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
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const emit = defineEmits(['notify']);
const email = ref(""); const password = ref("");
const router = useRouter(); const route = useRoute(); const db = getFirestore();

onMounted(() => { if (route.query.reason === "auth_required") emit('notify', "Please sign in to access that page.", "info"); });

const signIn = async () => {
  if (!email.value || !password.value) { emit('notify', "Please enter your credentials", "error"); return; }
  try {
    await signInWithEmailAndPassword(getAuth(), email.value, password.value);
    emit('notify', "Welcome back!", "success"); router.push("/");
  } catch { emit('notify', "Invalid email or password", "error"); }
};

const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(getAuth(), new GoogleAuthProvider());
    await setDoc(doc(db, "uid", res.user.uid), { email: res.user.email, role: "user" }, { merge: true });
    emit('notify', "Signed in with Google", "success"); router.push("/");
  } catch { emit('notify', "Google sign-in failed", "error"); }
};
</script>

<style src="Signin.css" scoped></style>