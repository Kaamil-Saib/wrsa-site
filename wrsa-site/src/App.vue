<template>
  <Transition name="toast">
    <div v-if="notification.show" :class="['notification-window', notification.type]">
      {{ notification.text }}
    </div>
  </Transition>

  <nav id="app-nav">
    <div class="nav-left">
      <router-link to="/">Home</router-link>
      <router-link to="/shop">Shop</router-link>
      
      <router-link v-if="userRole === 'admin'" to="/admin" class="admin-link">
        Admin <span class="admin-badge">Staff</span>
      </router-link>
    </div>

    <div class="nav-right">
      <router-link to="/wishlist" title="Wishlist">
        <font-awesome-icon icon="heart" class="nav-icon"/>
      </router-link>
      <router-link to="/cart" title="Cart">
        <font-awesome-icon icon="bag-shopping" class="nav-icon"/>
      </router-link>

      <div class="user-dropdown">
        <button @click="toggleDropdown" class="user-btn">
          <font-awesome-icon icon="user" class="nav-icon"/>
          <span v-if="isLoggedIn && userDoc" class="hi-username"> 
            Hi, {{ userDoc.firstName || 'User' }}
          </span>
        </button>

        <div v-if="showDropdown" class="dropdown-menu">
          <template v-if="!isLoggedIn">
            <router-link to="/signin" @click="showDropdown = false">Sign In</router-link>
            <router-link to="/register" @click="showDropdown = false">Register</router-link>
          </template>
          <template v-else>
            <button @click="handleSignOut" class="dropdown-item">Sign Out</button>
          </template>
        </div>
      </div>
    </div>
  </nav>

  <router-view @notify="triggerNotification" />
</template>

<script setup>
import { onMounted, ref, reactive, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const router = useRouter();
const route = useRoute();
const db = getFirestore();

const isLoggedIn = ref(false);
const userDoc = ref(null);      // Stores the actual user data object
const userRole = ref(null);     // Stores 'admin' or 'user'
const showDropdown = ref(false);

const notification = reactive({ show: false, text: '', type: 'info' });

const triggerNotification = (text, type = 'info') => {
  notification.text = text;
  notification.type = type;
  notification.show = true;
  setTimeout(() => { notification.show = false; }, 3000);
};

// Handle unauthorized access redirects from the router guard
watch(() => route.query.auth_error, (newError) => {
  if (newError === 'admin_only') {
    triggerNotification("Access Denied: Admin privileges required.", "error");
    router.replace({ query: {} }); // Clean URL
  }
});

onMounted(() => {
  onAuthStateChanged(getAuth(), async (user) => {
    isLoggedIn.value = !!user;
    
    if (user) {
      try {
        const userDocRef = doc(db, "uid", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          // Store the DATA object so we can access .firstName directly
          userDoc.value = userDocSnap.data();
          userRole.value = userDoc.value.role;
        } else {
          userRole.value = 'user';
          userDoc.value = { firstName: 'User' };
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        userRole.value = 'user';
      }
    } else {
      // Reset states on logout
      userRole.value = null;
      userDoc.value = null;
    }
  });
});

const toggleDropdown = () => { 
  showDropdown.value = !showDropdown.value; 
};

const handleSignOut = () => {
  showDropdown.value = false;
  signOut(getAuth()).then(() => {
    triggerNotification("Successfully signed out", "info");
    router.push("/");
  });
};
</script>

<style>
/* Notification Window Styles */
.notification-window {
  position: fixed; 
  top: 20px; 
  left: 50%; 
  transform: translateX(-50%);
  z-index: 9999; 
  padding: 12px 24px; 
  border-radius: 8px; 
  color: white;
  font-weight: bold; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.success { background: #2ecc71; }
.error { background: #e74c3c; }
.info { background: #34495e; }

/* Transitions */
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -20px); }

/* Navigation Styling */
.user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.hi-username {
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
}

.admin-link {
  color: #d6a62d !important; /* Your primary gold/yellow */
  font-weight: 700 !important;
}

.admin-badge {
  background: #d6a62d;
  color: white;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 5px;
  vertical-align: middle;
  text-transform: uppercase;
}
</style>