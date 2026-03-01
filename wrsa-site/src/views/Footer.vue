<template>
  <footer class="site-footer">
    <div class="footer-top">

      <div class="footer-col brand-col">
        <div class="footer-logo">Wild Rhino</div>
        <p class="footer-tagline">Hard-wearing gear for the bush,<br>the farm, and the trail.</p>
        <div class="footer-socials">
          <a href="https://instagram.com" target="_blank" aria-label="Instagram" class="social-btn">
            <font-awesome-icon :icon="['fab', 'instagram']" />
          </a>
          <a href="https://facebook.com" target="_blank" aria-label="Facebook" class="social-btn">
            <font-awesome-icon :icon="['fab', 'facebook-f']" />
          </a>
          <a href="https://tiktok.com" target="_blank" aria-label="TikTok" class="social-btn">
            <font-awesome-icon :icon="['fab', 'tiktok']" />
          </a>
          <a href="https://twitter.com" target="_blank" aria-label="X / Twitter" class="social-btn">
            <font-awesome-icon :icon="['fab', 'x-twitter']" />
          </a>
        </div>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Shop</h4>
        <ul class="footer-links">
          <li><router-link to="/shop">All Products</router-link></li>
          <li><router-link to="/shop">New Arrivals</router-link></li>
          <li><router-link to="/shop">Sale</router-link></li>
          <li><router-link to="/wishlist">Wishlist</router-link></li>
          <li><router-link to="/cart">Cart</router-link></li>
        </ul>
      </div>

      <div class="footer-col">
        <h4 class="footer-heading">Account</h4>
        <ul class="footer-links">
          <li><router-link to="/signin">Sign In</router-link></li>
          <li><router-link to="/register">Register</router-link></li>
          <li><router-link to="/my-orders">My Orders</router-link></li>
        </ul>
      </div>

      <div class="footer-col contact-col">
        <h4 class="footer-heading">Get in Touch</h4>
        <ul class="footer-contact">
          <li>
            <font-awesome-icon icon="map-marker-alt" class="contact-icon" />
            <span>12 Rhino Street, Cape Town<br>Western Cape, 8001</span>
          </li>
          <li>
            <font-awesome-icon icon="phone" class="contact-icon" />
            <a href="tel:+27211234567">+27 21 123 4567</a>
          </li>
          <li>
            <font-awesome-icon icon="envelope" class="contact-icon" />
            <a href="mailto:hello@wildrhino.co.za">hello@wildrhino.co.za</a>
          </li>
        </ul>
      </div>

    </div>

    <div class="footer-bottom">
      <p class="copyright">© {{ year }} Wild Rhino Apparel (Pty) Ltd. All rights reserved.</p>
      <div class="footer-legal">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Shipping Info</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear();
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

.site-footer {
  background: #111111;
  color: #a8a8a8;
  font-family: 'DM Sans', sans-serif;
}

.footer-top {
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr 1.4fr;
  gap: 48px;
  padding: 60px 6vw 48px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

/*  Brand col  */
.footer-logo {
  font-family: 'Oswald', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: #d6a62d;
  margin-bottom: 14px;
}
.footer-tagline {
  font-size: 0.82rem;
  line-height: 1.7;
  color: rgba(168,168,168,0.65);
  margin: 0 0 24px;
  max-width: 220px;
  font-weight: 300;
}

/*  Socials  */
.footer-socials { display: flex; gap: 10px; }
.social-btn {
  width: 38px; height: 38px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.08);
  display: flex; align-items: center; justify-content: center;
  color: rgba(168,168,168,0.6);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.social-btn:hover { background: #d6a62d; border-color: #d6a62d; color: #0f0f0f; transform: translateY(-2px); }

/*  Headings  */
.footer-heading {
  font-family: 'Oswald', sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.85);
  margin: 0 0 18px;
}

/*  Links  */
.footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.footer-links a {
  color: rgba(168,168,168,0.6);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 400;
  transition: color 0.2s;
}
.footer-links a:hover { color: #d6a62d; }

/*  Contact  */
.footer-contact { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
.footer-contact li { display: flex; align-items: flex-start; gap: 12px; font-size: 0.85rem; color: rgba(168,168,168,0.6); line-height: 1.55; }
.contact-icon { color: #d6a62d; margin-top: 3px; flex-shrink: 0; font-size: 0.78rem; }
.footer-contact a { color: rgba(168,168,168,0.6); text-decoration: none; transition: color 0.2s; }
.footer-contact a:hover { color: #d6a62d; }

/*  Bottom bar  */
.footer-bottom {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 6vw; flex-wrap: wrap; gap: 12px;
}
.copyright { font-size: 0.75rem; color: rgba(168,168,168,0.35); margin: 0; }
.footer-legal { display: flex; gap: 20px; }
.footer-legal a { font-size: 0.72rem; color: rgba(168,168,168,0.35); text-decoration: none; transition: color 0.2s; }
.footer-legal a:hover { color: rgba(168,168,168,0.7); }

@media (max-width: 900px) {
  .footer-top { grid-template-columns: 1fr 1fr; gap: 36px; }
  .brand-col { grid-column: span 2; }
}
@media (max-width: 520px) {
  .footer-top { grid-template-columns: 1fr; }
  .brand-col { grid-column: span 1; }
  .footer-bottom { flex-direction: column; align-items: flex-start; }
}
</style>