<template>
  <div class="page-container">

    <!-- ===== MEDIA MODAL ===== -->
    <div v-if="isMediaModalOpen" class="media-modal-overlay">
      <div class="media-modal">
        <div class="modal-header">
          <div>
            <h3>Media Manager</h3>
            <small style="color: #888;">
              {{ prod.images.length }} image(s) selected · First image is the preview thumbnail
            </small>
          </div>
          <button @click="isMediaModalOpen = false" class="close-btn">✕</button>
        </div>
        <div class="modal-tabs">
          <button :class="{ active: mediaTab === 'library' }" @click="mediaTab = 'library'">Library</button>
          <button :class="{ active: mediaTab === 'upload' }" @click="mediaTab = 'upload'">Upload New</button>
        </div>
        <div class="modal-body">
          <div v-if="mediaTab === 'library'" class="library-view">
            <div v-if="mediaLibrary.length === 0" class="empty-media">No images found.</div>
            <div class="media-grid">
              <div
                v-for="img in mediaLibrary" :key="img.id"
                class="media-item"
                :class="{ selected: prod.images.includes(img.url) }"
                @click="toggleImageSelection(img.url)"
              >
                <img :src="img.url" alt="Media">
                <div class="check-badge" v-if="prod.images.includes(img.url)">
                  {{ prod.images.indexOf(img.url) + 1 }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="mediaTab === 'upload'" class="upload-view">
            <label class="drop-zone">
              <input type="file" @change="handleLibraryUpload" accept="image/*" multiple hidden />
              <div class="upload-prompt">
                <font-awesome-icon icon="cloud-upload-alt" size="3x" />
                <p v-if="!uploading">Click to upload - select multiple images at once</p>
                <p v-else>Uploading {{ uploadProgress }}%...</p>
              </div>
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn" style="width: auto;" @click="isMediaModalOpen = false">
            Confirm Selection ({{ prod.images.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- ===== PAGE HEADER & TABS ===== -->
    <div class="page-header">
      <h1>Admin Panel</h1>
      <div class="admin-tabs">
        <button v-for="tab in ['Inventory', 'Orders', 'Reports']"
                :key="tab" @click="activeTab = tab"
                :class="{ active: activeTab === tab }">
          {{ tab }}
        </button>
      </div>
    </div>

    <!-- ===== INVENTORY TAB ===== -->
    <div v-if="activeTab === 'Inventory'" class="admin-content">

      <section class="admin-zone mb-20">
        <h3>Manage Categories</h3>
        <div class="category-manager">
          <div class="input-group">
            <input v-model="newCatName" type="text" placeholder="New Category Name" @keyup.enter="saveCategory">
            <button class="action-btn" @click="saveCategory">{{ editingCatId ? 'Update' : 'Add' }}</button>
          </div>
          <div class="tag-list mt-10">
            <div v-for="cat in categories" :key="cat.id" class="category-pill">
              {{ cat.name }}
              <span class="pill-actions">
                <button @click="editCategory(cat)" class="edit-btn" title="Edit">
                  <font-awesome-icon icon="edit" />
                </button>
                <button @click="deleteCategory(cat.id)" class="delete-btn" title="Delete">
                  <font-awesome-icon icon="trash" />
                </button>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="admin-zone">
        <h3>{{ editingId ? 'Edit Product' : 'Add New Product' }}</h3>
        <div class="admin-form-grid">
          <input v-model="prod.name" type="text" placeholder="Product Name" class="full-width">

          <div class="input-wrapper">
            <span class="currency-label">R</span>
            <input v-model.number="prod.price" type="number" placeholder="Selling Price">
          </div>
          <div class="input-wrapper">
            <span class="currency-label">R</span>
            <input v-model.number="prod.cost" type="number" placeholder="Cost Price">
          </div>

          <select v-model="prod.category" class="select-input">
            <option value="" disabled>Select Category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
          </select>

          <select v-model="prod.color" class="select-input">
            <option value="" disabled>Select Color</option>
            <option v-for="col in colors" :key="col.id" :value="col.name">{{ col.name }}</option>
          </select>

          <div class="size-selector-area full-width">
            <label class="field-label">Available Sizes</label>
            <div v-if="sizes.length === 0" class="sizes-loading">Loading sizes...</div>
            <div v-else class="size-pill-group">
              <button
                v-for="s in sizes" :key="s.id" type="button"
                class="size-pill" :class="{ selected: prod.sizes.includes(s.size) }"
                @click="toggleSize(s.size)"
              >{{ s.size }}</button>
            </div>
            <p v-if="prod.sizes.length > 0" class="sizes-selected-hint">
              Selected: {{ prod.sizes.join(', ') }}
            </p>
          </div>

          <div class="description-area full-width">
            <textarea
              v-model="prod.description"
              placeholder="Product Description"
              class="text-area"
              :class="{ 'ai-typing': aiLoading }"
            ></textarea>
            <div class="ai-generate-row">
              <button
                type="button"
                class="ai-generate-btn"
                :class="{ loading: aiLoading }"
                :disabled="aiLoading || prod.images.length === 0"
                @click="generateDescription"
              >
                <span v-if="aiLoading" class="ai-spinner"></span>
                <font-awesome-icon v-else icon="wand-magic-sparkles" />
                {{ aiLoading ? 'Generating...' : 'AI Generate Description' }}
              </button>
              <span v-if="prod.images.length === 0" class="ai-hint">Add images first to enable AI generation</span>
              <span v-else-if="aiError" class="ai-error">{{ aiError }}</span>
              <span v-else-if="aiSuccess" class="ai-success">
                <font-awesome-icon icon="check" /> Description generated!
              </span>
            </div>
          </div>

          <div class="media-selection-area full-width">
            <button type="button" class="media-trigger-btn" @click="openMediaModal">
              <font-awesome-icon icon="images" />
              {{ prod.images.length > 0 ? `Manage Images (${prod.images.length} selected)` : 'Choose Product Images' }}
            </button>
            <div v-if="prod.images.length > 0" class="image-preview-strip">
              <div
                v-for="(url, index) in prod.images" :key="url"
                class="preview-thumb" draggable="true"
                @dragstart="onDragStart(index)" @dragover.prevent @drop="onDrop(index)"
              >
                <img :src="url" :alt="`Image ${index + 1}`">
                <span class="thumb-badge" :class="{ 'preview-badge': index === 0 }">
                  {{ index === 0 ? '★ Preview' : index + 1 }}
                </span>
                <button class="thumb-remove" @click="removeImage(index)">✕</button>
              </div>
              <p class="drag-hint">Drag to reorder · First image is the shop preview</p>
            </div>
          </div>
        </div>

        <button @click="saveProduct" class="action-btn mt-20">
          {{ editingId ? 'Update Product' : 'Add Product' }}
        </button>
      </section>

      <section class="admin-zone mt-20">
        <div class="filter-bar">
          <input v-model="searchQuery" type="text" placeholder="Search products..." class="search-input">
          <select v-model="filterCategory" class="select-input small">
            <option value="">All Categories</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
          </select>
        </div>

        <table class="admin-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Images</th>
              <th @click="toggleSort('name')" class="sortable">Product Name ↕</th>
              <th>Category</th>
              <th>Sizes</th>
              <th @click="toggleSort('cost')" class="sortable">Cost ↕</th>
              <th @click="toggleSort('price')" class="sortable">Price ↕</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProducts" :key="p.id">
              <td>
                <img :src="p.images?.[0]" class="table-img" :alt="p.name" v-if="p.images?.[0]">
                <span v-else style="color:#ccc; font-size:0.8rem;">-</span>
              </td>
              <td style="font-size:0.85rem; color:#888;">{{ p.images?.length || 0 }} img</td>
              <td><strong>{{ p.name }}</strong></td>
              <td><span class="category-tag">{{ p.category }}</span></td>
              <td>
                <div class="table-size-pills">
                  <span v-for="sz in (p.sizes || [])" :key="sz" class="table-size-pill">{{ sz }}</span>
                  <span v-if="!p.sizes?.length" style="color:#ccc; font-size:0.8rem;">-</span>
                </div>
              </td>
              <td>R{{ p.cost }}</td>
              <td><strong>R{{ p.price }}</strong></td>
              <td>
                <div class="pill-actions">
                  <button @click="editProduct(p)" class="edit-btn"><font-awesome-icon icon="edit" /></button>
                  <button @click="deleteProduct(p.id)" class="delete-btn"><font-awesome-icon icon="trash" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredProducts.length === 0" class="empty-media">
          No products match your filters.
        </div>
      </section>
    </div>

    <!-- ===== ORDERS TAB ===== -->
    <div v-if="activeTab === 'Orders'" class="admin-content">
      <section class="admin-zone">

        <div class="orders-toolbar">
          <h3 style="margin:0;">All Orders</h3>
          <div class="orders-filters">
            <select v-model="orderStatusFilter" class="select-input small">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
            </select>
            <button @click="fetchOrders" class="refresh-btn" title="Refresh">
              <font-awesome-icon icon="rotate-left" />
            </button>
          </div>
        </div>

        <div v-if="ordersLoading" class="empty-media" style="padding:40px 0;">Loading orders...</div>
        <div v-else-if="filteredOrders.length === 0" class="empty-media">No orders found.</div>

        <!-- ORDER CARDS -->
        <div v-else class="orders-list">
          <div v-for="order in filteredOrders" :key="order.id" class="order-card">

            <!-- Card header: ID + date + delete -->
            <div class="order-card-header">
              <div class="order-card-meta">
                <code class="order-id-cell" :title="order.id">{{ order.id.slice(0, 8) }}…</code>
                <span class="order-date">{{ formatDate(order.createdAt) }}</span>
              </div>
              <button @click="deleteOrder(order.id)" class="delete-btn" title="Delete order">
                <font-awesome-icon icon="trash" />
              </button>
            </div>

            <!-- Customer info -->
            <div class="order-card-customer">
              <span class="order-customer-name">{{ order.customerName }}</span>
              <span class="order-customer-email">{{ order.email }}</span>
            </div>

            <!-- Items list -->
            <div class="order-items-list">
              <div
                v-for="item in order.items"
                :key="`${item.productId}-${item.size}`"
                class="order-item-row"
              >
                <img v-if="item.image" :src="item.image" class="order-thumb" :alt="item.name" />
                <div v-else class="order-thumb-placeholder"></div>
                <div class="order-item-info">
                  <span class="order-item-name">{{ item.name }}</span>
                  <span class="order-item-meta">
                    <span v-if="item.size" class="order-item-size">{{ item.size }}</span>
                    × {{ item.quantity }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Card footer: total + status switcher -->
            <div class="order-card-footer">
              <span class="order-total">R{{ order.total }}</span>
              <div class="status-switcher">
                <button
                  v-for="s in ORDER_STATUSES" :key="s"
                  class="status-switch-btn" :class="[s, { active: order.status === s }]"
                  @click="setStatus(order, s)"
                >{{ s }}</button>
              </div>
            </div>

          </div>
        </div>

      </section>
    </div>


    <!-- ===== REPORTS TAB ===== -->
    <div v-if="activeTab === 'Reports'" class="admin-content">

      <!-- Summary Cards -->
      <div class="report-cards">
        <div class="report-card">
          <div class="report-card-icon revenue">
            <font-awesome-icon icon="money-bill-wave" />
          </div>
          <div class="report-card-body">
            <span class="report-card-label">Total Revenue</span>
            <span class="report-card-value">R{{ reportStats.totalRevenue.toLocaleString() }}</span>
          </div>
        </div>
        <div class="report-card">
          <div class="report-card-icon orders">
            <font-awesome-icon icon="bag-shopping" />
          </div>
          <div class="report-card-body">
            <span class="report-card-label">Total Orders</span>
            <span class="report-card-value">{{ reportStats.totalOrders }}</span>
          </div>
        </div>
        <div class="report-card">
          <div class="report-card-icon avg">
            <font-awesome-icon icon="chart-line" />
          </div>
          <div class="report-card-body">
            <span class="report-card-label">Avg Order Value</span>
            <span class="report-card-value">R{{ reportStats.avgOrderValue }}</span>
          </div>
        </div>
        <div class="report-card">
          <div class="report-card-icon items">
            <font-awesome-icon icon="box" />
          </div>
          <div class="report-card-body">
            <span class="report-card-label">Items Sold</span>
            <span class="report-card-value">{{ reportStats.totalItemsSold }}</span>
          </div>
        </div>
      </div>

      <div class="report-row">

        <!-- Monthly Revenue Chart -->
        <section class="admin-zone report-zone">
          <h3>Revenue by Month</h3>
          <div v-if="monthlyRevenue.length === 0" class="empty-media">No data yet.</div>
          <div v-else class="bar-chart">
            <div
              v-for="m in monthlyRevenue" :key="m.label"
              class="bar-group"
            >
              <div class="bar-wrap">
                <span class="bar-amount">R{{ m.revenue.toLocaleString() }}</span>
                <div
                  class="bar"
                  :style="{ height: (m.revenue / maxMonthlyRevenue * 140) + 'px' }"
                ></div>
              </div>
              <span class="bar-label">{{ m.label }}</span>
            </div>
          </div>
        </section>

        <!-- Status Breakdown -->
        <section class="admin-zone report-zone">
          <h3>Orders by Status</h3>
          <div class="status-breakdown">
            <div v-for="s in statusBreakdown" :key="s.status" class="status-breakdown-row">
              <div class="status-breakdown-info">
                <span class="status-dot" :class="s.status"></span>
                <span class="status-breakdown-label">{{ s.status }}</span>
                <span class="status-breakdown-count">{{ s.count }}</span>
              </div>
              <div class="status-breakdown-bar-wrap">
                <div
                  class="status-breakdown-bar"
                  :class="s.status"
                  :style="{ width: (s.count / reportStats.totalOrders * 100) + '%' }"
                ></div>
              </div>
              <span class="status-breakdown-pct">
                {{ reportStats.totalOrders ? Math.round(s.count / reportStats.totalOrders * 100) : 0 }}%
              </span>
            </div>
          </div>
        </section>

      </div>

      <!-- Top Products -->
      <section class="admin-zone">
        <h3>Top Products by Revenue</h3>
        <div v-if="topProducts.length === 0" class="empty-media">No order data yet.</div>
        <div v-else class="top-products-list">
          <div v-for="(p, i) in topProducts" :key="p.name" class="top-product-row">
            <span class="top-product-rank">#{{ i + 1 }}</span>
            <img v-if="p.image" :src="p.image" class="top-product-img" :alt="p.name" />
            <div v-else class="top-product-img-placeholder"></div>
            <div class="top-product-info">
              <span class="top-product-name">{{ p.name }}</span>
              <span class="top-product-meta">{{ p.qty }} units sold</span>
            </div>
            <div class="top-product-bar-wrap">
              <div
                class="top-product-bar"
                :style="{ width: (p.revenue / topProducts[0].revenue * 100) + '%' }"
              ></div>
            </div>
            <span class="top-product-revenue">R{{ p.revenue.toLocaleString() }}</span>
          </div>
        </div>
      </section>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import {
  getFirestore, collection, addDoc, getDocs, doc, deleteDoc,
  updateDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAI } from '@/composables/useAI';

const db      = getFirestore();
const storage = getStorage();
const emit    = defineEmits(['notify']);

/* AI */
const { generate, loading: aiLoading, error: aiErrorRef } = useAI();
const aiError   = ref('');
const aiSuccess = ref(false);

const generateDescription = async () => {
  if (prod.images.length === 0) return;
  aiError.value = ''; aiSuccess.value = false;
  const context = [
    prod.name     ? `Product name: ${prod.name}`         : null,
    prod.category ? `Category: ${prod.category}`         : null,
    prod.color    ? `Color: ${prod.color}`               : null,
    prod.sizes.length ? `Available sizes: ${prod.sizes.join(', ')}` : null,
    prod.price    ? `Price: R${prod.price}`              : null,
  ].filter(Boolean).join('\n');
  const imageList = prod.images.map((url, i) => `Image ${i + 1}: ${url}`).join('\n');
  const prompt =
    `You are a copywriter for Wild Rhino SA, a South African outdoor apparel brand.\n\n` +
    `Product details:\n${context}\n\nProduct images:\n${imageList}\n\n` +
    `Write a compelling product description (2–3 sentences, max 60 words). ` +
    `Focus on the look, material feel, and ideal use case. ` +
    `Tone: rugged, authentic, proudly South African. No fluff. Return only the description text.`;
  const result = await generate(prompt, { maxTokens: 1000 });
  if (result) {
    prod.description = result.trim(); aiSuccess.value = true;
    setTimeout(() => { aiSuccess.value = false; }, 3000);
    emit('notify', 'Description generated!', 'success');
  } else {
    aiError.value = aiErrorRef.value || 'Generation failed - try again.';
  }
};

/*  UI STATES  */
const activeTab        = ref('Inventory');
const loading          = ref(false);
const isMediaModalOpen = ref(false);
const mediaTab         = ref('library');
const uploadProgress   = ref(0);
const uploading        = ref(false);

/*  INVENTORY DATA  */
const products     = ref([]);
const categories   = ref([]);
const colors       = ref([]);
const sizes        = ref([]);
const mediaLibrary = ref([]);
const newCatName   = ref('');
const editingCatId = ref(null);
const editingId    = ref(null);

const prod = reactive({
  name: '', price: null, cost: null, category: '',
  color: '', description: '', tags: '', sizes: [], images: []
});

/*  ORDERS DATA  */
const orders            = ref([]);
const ordersLoading     = ref(false);
const orderStatusFilter = ref('');

const filteredOrders = computed(() => {
  if (!orderStatusFilter.value) return orders.value;
  return orders.value.filter(o => o.status === orderStatusFilter.value);
});

/*  SIZE TOGGLE  */
const toggleSize = (size) => {
  const idx = prod.sizes.indexOf(size);
  if (idx === -1) prod.sizes.push(size); else prod.sizes.splice(idx, 1);
};

/*  DRAG TO REORDER  */
let dragFromIndex = null;
const onDragStart = (index) => { dragFromIndex = index; };
const onDrop = (toIndex) => {
  if (dragFromIndex === null || dragFromIndex === toIndex) return;
  const arr = [...prod.images];
  const [moved] = arr.splice(dragFromIndex, 1);
  arr.splice(toIndex, 0, moved);
  prod.images = arr;
  dragFromIndex = null;
};

/*  IMAGE SELECTION  */
const toggleImageSelection = (url) => {
  const idx = prod.images.indexOf(url);
  if (idx === -1) prod.images.push(url); else prod.images.splice(idx, 1);
};
const removeImage = (index) => { prod.images.splice(index, 1); };

/*  MEDIA MANAGER  */
const openMediaModal = () => { fetchMedia(); isMediaModalOpen.value = true; };
const fetchMedia = async () => {
  const snap = await getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc')));
  mediaLibrary.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
const handleLibraryUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  uploading.value = true; uploadProgress.value = 0; let completed = 0;
  await Promise.all(files.map((file) => new Promise((resolve, reject) => {
    const storageRef = sRef(storage, `library/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on('state_changed',
      (snap) => { uploadProgress.value = Math.round(((completed + snap.bytesTransferred / snap.totalBytes) / files.length) * 100); },
      (err) => { emit('notify', `Failed to upload ${file.name}`, 'error'); reject(err); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, 'media'), { url, createdAt: serverTimestamp() });
        if (!prod.images.includes(url)) prod.images.push(url);
        completed++; resolve();
      }
    );
  })));
  uploading.value = false; uploadProgress.value = 0; mediaTab.value = 'library';
  fetchMedia();
  emit('notify', `${files.length} image${files.length > 1 ? 's' : ''} uploaded!`, 'success');
  e.target.value = '';
};

/*  CATEGORIES  */
const fetchCategories = async () => {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('name')));
  categories.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
const saveCategory = async () => {
  if (!newCatName.value) return;
  if (editingCatId.value) await updateDoc(doc(db, 'categories', editingCatId.value), { name: newCatName.value });
  else await addDoc(collection(db, 'categories'), { name: newCatName.value });
  newCatName.value = ''; editingCatId.value = null; fetchCategories();
};
const editCategory = (cat) => { newCatName.value = cat.name; editingCatId.value = cat.id; };
const deleteCategory = async (id) => {
  if (confirm('Delete category?')) { await deleteDoc(doc(db, 'categories', id)); fetchCategories(); }
};

/*  PRODUCTS  */
const fetchProducts = async () => {
  const snap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  products.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
const saveProduct = async () => {
  if (!prod.name || prod.images.length === 0) {
    emit('notify', 'Product name and at least one image are required', 'error'); return;
  }
  loading.value = true;
  try {
    const data = {
      name: prod.name, price: prod.price, cost: prod.cost,
      category: prod.category, color: prod.color, description: prod.description,
      sizes: prod.sizes, images: prod.images,
      tags: typeof prod.tags === 'string'
        ? prod.tags.split(',').map(t => t.trim()).filter(Boolean)
        : prod.tags,
      updatedAt: serverTimestamp()
    };
    if (editingId.value) {
      await updateDoc(doc(db, 'products', editingId.value), data);
      emit('notify', 'Product updated!', 'success');
    } else {
      await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });
      emit('notify', 'Product added!', 'success');
    }
    resetForm(); fetchProducts();
  } catch (e) {
    console.error(e); emit('notify', 'Error saving product', 'error');
  } finally {
    loading.value = false;
  }
};
const editProduct = (p) => {
  editingId.value = p.id;
  Object.assign(prod, {
    name: p.name, price: p.price, cost: p.cost, category: p.category, color: p.color,
    description: p.description,
    tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
    sizes: Array.isArray(p.sizes) ? [...p.sizes] : [],
    images: Array.isArray(p.images) ? [...p.images] : (p.image ? [p.image] : [])
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
const deleteProduct = async (id) => {
  if (confirm('Delete this product?')) {
    await deleteDoc(doc(db, 'products', id)); fetchProducts();
    emit('notify', 'Product removed', 'info');
  }
};
const resetForm = () => {
  editingId.value = null;
  Object.assign(prod, { name: '', price: null, cost: null, category: '', color: '', description: '', tags: '', sizes: [], images: [] });
  aiError.value = ''; aiSuccess.value = false;
};

/*  ORDERS  */
const fetchOrders = async () => {
  ordersLoading.value = true;
  try {
    const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
    orders.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('[Admin] fetchOrders error:', e);
    emit('notify', 'Failed to load orders', 'error');
  } finally {
    ordersLoading.value = false;
  }
};
const ORDER_STATUSES = ['pending', 'confirmed', 'completed'];
const setStatus = async (order, newStatus) => {
  if (order.status === newStatus) return;
  await updateDoc(doc(db, 'orders', order.id), { status: newStatus });
  order.status = newStatus;
  emit('notify', `Order marked as ${newStatus}`, 'success');
};
const deleteOrder = async (id) => {
  if (confirm('Delete this order permanently?')) {
    await deleteDoc(doc(db, 'orders', id));
    orders.value = orders.value.filter(o => o.id !== id);
    emit('notify', 'Order deleted', 'info');
  }
};
const formatDate = (ts) => {
  if (!ts) return '-';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/*  ON MOUNT  */
onMounted(async () => {
  fetchProducts(); fetchCategories(); fetchOrders();
  const colorSnap = await getDocs(collection(db, 'colors'));
  colors.value = colorSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const sizeSnap  = await getDocs(collection(db, 'sizes'));
  sizes.value = sizeSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ai = sizeOrder.indexOf(a.size), bi = sizeOrder.indexOf(b.size);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
});

/*  FILTER & SORT  */
const filterCategory = ref('');
const searchQuery    = ref('');
const sortKey        = ref('createdAt');
const sortOrder      = ref('desc');

const filteredProducts = computed(() => {
  let temp = [...products.value];
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    temp = temp.filter(p => p.name && p.name.toLowerCase().includes(q));
  }
  if (filterCategory.value) temp = temp.filter(p => p.category === filterCategory.value);
  temp.sort((a, b) => {
    const mod = sortOrder.value === 'desc' ? -1 : 1;
    const vA = a[sortKey.value] || 0, vB = b[sortKey.value] || 0;
    return vA < vB ? -1 * mod : vA > vB ? mod : 0;
  });
  return temp;
});
const toggleSort = (key) => {
  if (sortKey.value === key) sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  else { sortKey.value = key; sortOrder.value = 'asc'; }
};

/* REPORTS \ */
const reportStats = computed(() => {
  const totalRevenue    = orders.value.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders     = orders.value.length;
  const avgOrderValue   = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const totalItemsSold  = orders.value.reduce((s, o) =>
    s + (o.items || []).reduce((si, i) => si + (i.quantity || 0), 0), 0
  );
  return { totalRevenue, totalOrders, avgOrderValue, totalItemsSold };
});

const monthlyRevenue = computed(() => {
  const map = {};
  orders.value.forEach(o => {
    const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    // Use a sortable key (YYYY-MM) and a display label separately
    const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label   = date.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
    if (!map[sortKey]) map[sortKey] = { label, revenue: 0 };
    map[sortKey].revenue += (o.total || 0);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))   // sort by YYYY-MM ascending
    .slice(-6)
    .map(([, v]) => v);
});

const maxMonthlyRevenue = computed(() =>
  Math.max(...monthlyRevenue.value.map(m => m.revenue), 1)
);

const statusBreakdown = computed(() => {
  const map = { pending: 0, confirmed: 0, completed: 0 };
  orders.value.forEach(o => { if (map[o.status] !== undefined) map[o.status]++; });
  return Object.entries(map).map(([status, count]) => ({ status, count }));
});

const topProducts = computed(() => {
  const map = {};
  orders.value.forEach(o => {
    (o.items || []).forEach(item => {
      if (!map[item.name]) {
        map[item.name] = { name: item.name, image: item.image || null, qty: 0, revenue: 0 };
      }
      map[item.name].qty += item.quantity || 0;
      map[item.name].revenue += (item.price || 0) * (item.quantity || 0);
    });
  });
  return Object.values(map)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
});

</script>

<style src="./Admin.css" scoped></style>