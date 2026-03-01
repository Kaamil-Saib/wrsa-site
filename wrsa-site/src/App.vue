<template>
  <Transition name="toast">
    <div v-if="notification.show" :class="['notification-window', notification.type]">
      {{ notification.text }}
    </div>
  </Transition>

  <nav id="app-nav">
    <div class="nav-left">
      <router-link to="/" class="nav-brand">
        <img :src="blackLogo" alt="Wild Rhino logo" class="nav-logo-img" />
        Wild Rhino
      </router-link>
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

      <div class="user-dropdown" v-click-outside="() => showDropdown = false">
        <button @click="toggleDropdown" class="user-btn">
          <font-awesome-icon icon="user" class="nav-icon"/>
          <span v-if="isLoggedIn && userDoc" class="hi-username">
            Hi, {{ userDoc.firstName || 'User' }}
          </span>
        </button>

        <Transition name="dropdown-fade">
          <div v-if="showDropdown" class="dropdown-menu">
            <template v-if="!isLoggedIn">
              <router-link to="/signin" @click="showDropdown = false" class="dropdown-item">
                <font-awesome-icon icon="sign-in-alt" /> Sign In
              </router-link>
              <router-link to="/register" @click="showDropdown = false" class="dropdown-item">
                <font-awesome-icon icon="user-plus" /> Register
              </router-link>
            </template>

            <template v-else>
              <div class="dropdown-user-info">
                <div class="dropdown-avatar">{{ avatarInitial }}</div>
                <div>
                  <div class="dropdown-name">{{ userDoc?.firstName }} {{ userDoc?.surname }}</div>
                  <div class="dropdown-email">{{ userDoc?.email }}</div>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <router-link to="/my-orders" @click="showDropdown = false" class="dropdown-item">
                <font-awesome-icon icon="clipboard-list" /> My Orders
              </router-link>
              <router-link to="/wishlist" @click="showDropdown = false" class="dropdown-item">
                <font-awesome-icon icon="heart" /> Wishlist
              </router-link>
              <div class="dropdown-divider"></div>
              <button @click="handleSignOut" class="dropdown-item danger">
                <font-awesome-icon icon="sign-out-alt" /> Sign Out
              </button>
            </template>
          </div>
        </Transition>
      </div>
    </div>
  </nav>

  <router-view @notify="triggerNotification" />
</template>

<script setup>
import { onMounted, ref, reactive, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import blackLogo from '@/assets/black-logo.png';

const router = useRouter();
const route  = useRoute();
const db     = getFirestore();

const isLoggedIn   = ref(false);
const userDoc      = ref(null);
const userRole     = ref(null);
const showDropdown = ref(false);

const notification = reactive({ show: false, text: '', type: 'info' });

const avatarInitial = computed(() =>
  (userDoc.value?.firstName || '').charAt(0).toUpperCase() || '?'
);

const triggerNotification = (text, type = 'info') => {
  notification.text = text;
  notification.type = type;
  notification.show = true;
  setTimeout(() => { notification.show = false; }, 3000);
};

watch(() => route.query.auth_error, (err) => {
  if (err === 'admin_only') {
    triggerNotification('Access Denied: Admin privileges required.', 'error');
    router.replace({ query: {} });
  }
});

watch(() => route.path, () => { showDropdown.value = false; });

onMounted(() => {
  onAuthStateChanged(getAuth(), async (user) => {
    isLoggedIn.value = !!user;
    if (user) {
      try {
        const snap = await getDoc(doc(db, 'uid', user.uid));
        if (snap.exists()) {
          userDoc.value  = snap.data();
          userRole.value = userDoc.value.role;
        } else {
          userRole.value = 'user';
          userDoc.value  = { firstName: 'User' };
        }
      } catch (e) {
        console.error('Error fetching user data:', e);
        userRole.value = 'user';
      }
    } else {
      userRole.value = null;
      userDoc.value  = null;
    }
  });
});

const toggleDropdown = () => { showDropdown.value = !showDropdown.value; };

const handleSignOut = () => {
  showDropdown.value = false;
  signOut(getAuth()).then(() => {
    triggerNotification('Successfully signed out', 'info');
    router.push('/');
  });
};

const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => {
      if (!el.contains(e.target)) binding.value(e);
    };
    document.addEventListener('mousedown', el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el._clickOutside);
  }
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

/* NOTIFICATION TOAST*/
.notification-window {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 11px 24px;
  border-radius: 6px;
  color: white;
  font-family: 'Oswald', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  white-space: nowrap;
}
.success { background: #2d8c4e; }
.error   { background: #c0392b; }
.info    { background: #1a1a1a; }

.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -16px); }

/* NAV */
#app-nav {
  padding: 0 5%;
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
  background: white;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-left,
.nav-right {
  display: flex;
  align-items: center;
  gap: 28px;
}

.nav-brand {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  font-family: 'Oswald', sans-serif !important;
  font-size: 1.75rem !important;
  font-weight: 700 !important;
  letter-spacing: 2.5px !important;
  text-transform: uppercase !important;
  color: #1a1a1a !important;  
  text-decoration: none !important;
}
.nav-brand:hover { opacity: 0.8; }

.nav-logo-img {
  height: 50px;
  width: auto;
  display: block;
  flex-shrink: 0;
}

#app-nav a:not(.nav-brand):not(.admin-link) {
  text-decoration: none;
  font-family: 'Oswald', sans-serif;
  font-weight: 500;
  font-size: 0.8rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #1a1a1a;
  transition: color 0.2s;
}
#app-nav a:not(.nav-brand):not(.admin-link):hover,
#app-nav a:not(.nav-brand).router-link-active { color: #d6a62d; }

.nav-icon {
  font-size: 1rem;
  color: #333;
  transition: color 0.2s;
  cursor: pointer;
}
.nav-icon:hover { color: #d6a62d; }

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
  font-family: 'Oswald', sans-serif;
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #1a1a1a;
}

.admin-link {
  color: #d6a62d !important;
  font-family: 'Oswald', sans-serif !important;
  font-weight: 700 !important;
  font-size: 0.8rem !important;
  letter-spacing: 1.5px !important;
  text-transform: uppercase !important;
  text-decoration: none !important;
}
.admin-badge {
  background: #d6a62d;
  color: #0f0f0f;
  font-family: 'Oswald', sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 4px;
  vertical-align: middle;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-dropdown { position: relative; }

.dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  min-width: 220px;
  overflow: hidden;
  z-index: 1000;
  border: 1.5px solid #f0f0f0;
}

.dropdown-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f5f4;
}
.dropdown-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #d6a62d;
  color: #0f0f0f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Oswald', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}
.dropdown-name {
  font-family: 'Oswald', sans-serif;
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #1a1a1a;
}
.dropdown-email { font-size: 0.72rem; color: #aaa; margin-top: 1px; }

.dropdown-divider { height: 1px; background: #f0f0f0; margin: 0; }

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  color: #333;
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.dropdown-item:hover { background: #f5f5f4; color: #d6a62d; }
.dropdown-item svg   { color: #ccc; width: 14px; }
.dropdown-item.danger       { color: #e74c3c; }
.dropdown-item.danger svg   { color: #e74c3c; }
.dropdown-item.danger:hover { background: #fff5f5; color: #e74c3c; }

.dropdown-fade-enter-active,
.dropdown-fade-leave-active { transition: all 0.18s ease; }
.dropdown-fade-enter-from,
.dropdown-fade-leave-to { opacity: 0; transform: translateY(-6px); }

@media (max-width: 768px) {

  #app-nav {
    height: 58px;
    padding: 0 4%;
  }

  .nav-left,
  .nav-right {
    gap: 16px;
  }

  .nav-brand {
    font-size: 1.25rem !important; 
    letter-spacing: 1.5px !important;
    gap: 6px !important; 
    line-height: 1 !important; 
  }

  .nav-logo-img {
    height: 38px; 
  }

  #app-nav a:not(.nav-brand):not(.admin-link) {
    font-size: 0.7rem;
    letter-spacing: 1px;
  }

  .hi-username {
    display: none; 
  }

}
</style>