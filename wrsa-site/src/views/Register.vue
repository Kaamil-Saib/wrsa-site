<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <h1>Create an Account</h1>
      
      <div class="input-group">
        <div class="name-row">
          <input 
            type="text" 
            placeholder="First Name" 
            v-model.trim="firstName"
          >
          <input 
            type="text" 
            placeholder="Surname" 
            v-model.trim="surname"
          >
        </div>
        <input 
          type="email" 
          placeholder="Email Address" 
          v-model.trim="email"
          @keyup.enter="register"
        >
        <input 
          type="password" 
          placeholder="Password" 
          v-model="password"
          @keyup.enter="register"
        >
      </div>

      <button class="action-btn" @click="register">Create Account</button>
      
      <div class="divider">or</div>
      
      <button class="google-btn" @click="signInWithGoogle">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18">
        Sign in with Google
      </button>

      <p class="footer-text">
        Already have an account? <router-link to="/signin">Sign In</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from "vue";
import { useRouter } from "vue-router";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const emit = defineEmits(['notify']);

const firstName = ref("");
const surname = ref("");
const email = ref("");
const password = ref("");
const router = useRouter();
const db = getFirestore();

const createUserDoc = async (user, first, last) => {
  await setDoc(doc(db, "uid", user.uid), {
    firstName: first,
    surname: last,
    email: user.email,
    role: "user",
    createdAt: new Date()
  });
};

const register = async () => {
  if (!firstName.value || !surname.value || !email.value || !password.value) {
    emit('notify', "Please fill in all fields", "error");
    return;
  }
  
  try {
    const res = await createUserWithEmailAndPassword(getAuth(), email.value, password.value);
    await createUserDoc(res.user, firstName.value, surname.value);
    
    emit('notify', `Welcome, ${firstName.value}!`, "success");
    router.push("/");
  } catch (error) {
    let friendlyMsg = "Registration failed.";
    if (error.code === 'auth/weak-password') friendlyMsg = "Password is too weak.";
    if (error.code === 'auth/email-already-in-use') friendlyMsg = "Email already in use.";
    emit('notify', friendlyMsg, "error");
  }
};

const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(getAuth(), new GoogleAuthProvider());
    // For Google sign-in, pull name from the Google profile
    const nameParts = (res.user.displayName || "").split(" ");
    const first = nameParts[0] || "";
    const last = nameParts.slice(1).join(" ") || "";

    await setDoc(doc(db, "uid", res.user.uid), {
      firstName: first,
      surname: last,
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

<style scoped>
.name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
</style>