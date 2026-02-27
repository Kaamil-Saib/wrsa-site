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
                v-for="img in mediaLibrary"
                :key="img.id"
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
                <p v-if="!uploading">Click to upload — select multiple images at once</p>
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
      <h1>Admin Command Center</h1>
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

      <!-- CATEGORY MANAGER -->
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
                  <font-awesome-icon icon="fa-solid fa-edit" />
                </button>
                <button @click="deleteCategory(cat.id)" class="delete-btn" title="Delete">
                  <font-awesome-icon icon="fa-solid fa-trash" />
                </button>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- PRODUCT FORM -->
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

          <!-- SIZES MULTI-SELECT -->
          <div class="size-selector-area full-width">
            <label class="field-label">Available Sizes</label>
            <div v-if="sizes.length === 0" class="sizes-loading">Loading sizes...</div>
            <div v-else class="size-pill-group">
              <button
                v-for="s in sizes"
                :key="s.id"
                type="button"
                class="size-pill"
                :class="{ selected: prod.sizes.includes(s.size) }"
                @click="toggleSize(s.size)"
              >
                {{ s.size }}
              </button>
            </div>
            <p v-if="prod.sizes.length > 0" class="sizes-selected-hint">
              Selected: {{ prod.sizes.join(', ') }}
            </p>
          </div>

          <textarea v-model="prod.description" placeholder="Product Description" class="full-width text-area"></textarea>

          <!-- MULTI-IMAGE SELECTION -->
          <div class="media-selection-area full-width">
            <button type="button" class="media-trigger-btn" @click="openMediaModal">
              <font-awesome-icon icon="images" />
              {{ prod.images.length > 0 ? `Manage Images (${prod.images.length} selected)` : 'Choose Product Images' }}
            </button>

            <div v-if="prod.images.length > 0" class="image-preview-strip">
              <div
                v-for="(url, index) in prod.images"
                :key="url"
                class="preview-thumb"
                draggable="true"
                @dragstart="onDragStart(index)"
                @dragover.prevent
                @drop="onDrop(index)"
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

      <!-- PRODUCT TABLE -->
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
                <span v-else style="color:#ccc; font-size:0.8rem;">No image</span>
              </td>
              <td style="font-size:0.85rem; color:#888;">
                {{ p.images?.length || 0 }} image(s)
              </td>
              <td><strong>{{ p.name }}</strong></td>
              <td><span class="category-tag">{{ p.category }}</span></td>
              <td>
                <div class="table-size-pills">
                  <span v-for="sz in (p.sizes || [])" :key="sz" class="table-size-pill">{{ sz }}</span>
                  <span v-if="!p.sizes?.length" style="color:#ccc; font-size:0.8rem;">—</span>
                </div>
              </td>
              <td>R{{ p.cost }}</td>
              <td>R{{ p.price }}</td>
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
  </div>
</template>


<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import {
  getFirestore, collection, addDoc, getDocs, doc, deleteDoc,
  updateDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const db = getFirestore();
const storage = getStorage();
const emit = defineEmits(['notify']);

/* --- UI STATES --- */
const activeTab = ref('Inventory');
const loading = ref(false);
const isMediaModalOpen = ref(false);
const mediaTab = ref('library');
const uploadProgress = ref(0);
const uploading = ref(false);

/* --- DATA STATES --- */
const products = ref([]);
const categories = ref([]);
const colors = ref([]);
const sizes = ref([]);
const mediaLibrary = ref([]);
const newCatName = ref("");
const editingCatId = ref(null);
const editingId = ref(null);

const prod = reactive({
  name: '',
  price: null,
  cost: null,
  category: '',
  color: '',
  description: '',
  tags: '',
  sizes: [],   // e.g. ["S", "M", "L", "XL"]
  images: []
});

/* --- SIZE TOGGLE --- */
const toggleSize = (size) => {
  const idx = prod.sizes.indexOf(size);
  if (idx === -1) {
    prod.sizes.push(size);
  } else {
    prod.sizes.splice(idx, 1);
  }
};

/* --- DRAG TO REORDER IMAGES --- */
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

/* --- IMAGE SELECTION --- */
const toggleImageSelection = (url) => {
  const idx = prod.images.indexOf(url);
  if (idx === -1) prod.images.push(url);
  else prod.images.splice(idx, 1);
};

const removeImage = (index) => { prod.images.splice(index, 1); };

/* --- MEDIA MANAGER --- */
const openMediaModal = () => { fetchMedia(); isMediaModalOpen.value = true; };

const fetchMedia = async () => {
  const q = query(collection(db, "media"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  mediaLibrary.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const handleLibraryUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  uploading.value = true;
  uploadProgress.value = 0;

  let completed = 0;

  // Upload all files in parallel
  await Promise.all(files.map((file) => {
    return new Promise((resolve, reject) => {
      const storageRef = sRef(storage, `library/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snap) => {
          // Show overall progress based on completed + this file's progress
          const fileProgress = snap.bytesTransferred / snap.totalBytes;
          uploadProgress.value = Math.round(((completed + fileProgress) / files.length) * 100);
        },
        (err) => {
          emit('notify', `Failed to upload ${file.name}`, "error");
          reject(err);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, "media"), { url, createdAt: serverTimestamp() });
          if (!prod.images.includes(url)) prod.images.push(url);
          completed++;
          resolve();
        }
      );
    });
  }));

  uploading.value = false;
  uploadProgress.value = 0;
  mediaTab.value = 'library';
  fetchMedia();
  emit('notify', `${files.length} image${files.length > 1 ? 's' : ''} uploaded!`, "success");

  // Reset input so same files can be re-selected if needed
  e.target.value = '';
};

/* --- CATEGORIES --- */
const fetchCategories = async () => {
  const q = query(collection(db, "categories"), orderBy("name"));
  const snap = await getDocs(q);
  categories.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const saveCategory = async () => {
  if (!newCatName.value) return;
  if (editingCatId.value) {
    await updateDoc(doc(db, "categories", editingCatId.value), { name: newCatName.value });
  } else {
    await addDoc(collection(db, "categories"), { name: newCatName.value });
  }
  newCatName.value = "";
  editingCatId.value = null;
  fetchCategories();
};

const editCategory = (cat) => { newCatName.value = cat.name; editingCatId.value = cat.id; };

const deleteCategory = async (id) => {
  if (confirm("Delete category?")) {
    await deleteDoc(doc(db, "categories", id));
    fetchCategories();
  }
};

/* --- PRODUCTS --- */
const fetchProducts = async () => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  products.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const saveProduct = async () => {
  if (!prod.name || prod.images.length === 0) {
    emit('notify', "Product name and at least one image are required", "error");
    return;
  }
  loading.value = true;
  try {
    const data = {
      name: prod.name,
      price: prod.price,
      cost: prod.cost,
      category: prod.category,
      color: prod.color,
      description: prod.description,
      sizes: prod.sizes,
      images: prod.images,
      tags: typeof prod.tags === 'string'
        ? prod.tags.split(',').map(t => t.trim()).filter(Boolean)
        : prod.tags,
      updatedAt: serverTimestamp()
    };

    if (editingId.value) {
      await updateDoc(doc(db, "products", editingId.value), data);
      emit('notify', "Product updated!", "success");
    } else {
      await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
      emit('notify', "Product added!", "success");
    }
    resetForm();
    fetchProducts();
  } catch (e) {
    console.error(e);
    emit('notify', "Error saving product", "error");
  } finally {
    loading.value = false;
  }
};

const editProduct = (p) => {
  editingId.value = p.id;
  Object.assign(prod, {
    name: p.name,
    price: p.price,
    cost: p.cost,
    category: p.category,
    color: p.color,
    description: p.description,
    tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
    sizes: Array.isArray(p.sizes) ? [...p.sizes] : [],
    // Backwards compat: handle old string `image` field
    images: Array.isArray(p.images) ? [...p.images] : (p.image ? [p.image] : [])
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const deleteProduct = async (id) => {
  if (confirm("Delete this product?")) {
    await deleteDoc(doc(db, "products", id));
    fetchProducts();
    emit('notify', "Product removed", "info");
  }
};

const resetForm = () => {
  editingId.value = null;
  Object.assign(prod, {
    name: '', price: null, cost: null, category: '',
    color: '', description: '', tags: '', sizes: [], images: []
  });
};

onMounted(async () => {
  fetchProducts();
  fetchCategories();

  const colorSnap = await getDocs(collection(db, "colors"));
  colors.value = colorSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Fetch and sort sizes in logical clothing order
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const sizeSnap = await getDocs(collection(db, "sizes"));
  const rawSizes = sizeSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  sizes.value = rawSizes.sort((a, b) => {
    const ai = sizeOrder.indexOf(a.size);
    const bi = sizeOrder.indexOf(b.size);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
});

/* --- FILTER & SORT --- */
const filterCategory = ref("");
const searchQuery = ref("");
const sortKey = ref("createdAt");
const sortOrder = ref("desc");

const filteredProducts = computed(() => {
  let temp = [...products.value];
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    temp = temp.filter(p => p.name && p.name.toLowerCase().includes(q));
  }
  if (filterCategory.value) {
    temp = temp.filter(p => p.category === filterCategory.value);
  }
  temp.sort((a, b) => {
    const modifier = sortOrder.value === 'desc' ? -1 : 1;
    const valA = a[sortKey.value] || 0;
    const valB = b[sortKey.value] || 0;
    if (valA < valB) return -1 * modifier;
    if (valA > valB) return 1 * modifier;
    return 0;
  });
  return temp;
});

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};
</script>


<style scoped>
/* ---- SIZE SELECTOR ---- */
.field-label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--gray-text);
  margin-bottom: 10px;
}

.size-pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.size-pill {
  padding: 8px 18px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  background: white;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
}

.size-pill:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.size-pill.selected {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.sizes-selected-hint {
  margin: 8px 0 0 0;
  font-size: 0.8rem;
  color: #888;
}

.sizes-loading {
  font-size: 0.85rem;
  color: #aaa;
  padding: 8px 0;
}

/* ---- TABLE SIZE PILLS ---- */
.table-size-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.table-size-pill {
  background: #f0f0f0;
  border: 1px solid #ddd;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #555;
}

/* ---- IMAGE PREVIEW STRIP ---- */
.image-preview-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
  align-items: flex-start;
}

.preview-thumb {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: visible;
  cursor: grab;
  flex-shrink: 0;
}

.preview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #ddd;
  display: block;
}

.thumb-badge {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: #555;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  white-space: nowrap;
}

.thumb-badge.preview-badge { background: var(--primary); }

.thumb-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.drag-hint {
  width: 100%;
  font-size: 0.75rem;
  color: #aaa;
  margin: 4px 0 0 0;
}

.check-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background: var(--primary);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}
</style>