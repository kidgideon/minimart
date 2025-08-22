import styles from "./products.module.css"
import design from "./itemDesign.module.css"
import {auth, db , storage} from "../src/hooks/firebase"
import testImage1 from "../src/images/prod1.jpeg"
import React, { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Toaster, toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";


function ModalOverlay({ children }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.18)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {children}
    </div>
  );
}

const Products = () => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);


// Fetch user and business (without handling store colors/themes)
useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
    setUser(firebaseUser);

    if (firebaseUser) {
      try {
        // Get user doc
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;

        if (userData?.businessId) {
          // Get business doc
          const businessDoc = await getDoc(doc(db, "businesses", userData.businessId));
          const businessData = businessDoc.exists() ? businessDoc.data() : null;

          setBusiness(businessData);

          // Set products only (skip theme completely)
          setProducts(
            businessData?.products
              ? [...businessData.products].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
              : []
          );
        }
      } catch (error) {
        console.error("Error fetching user or business data:", error);
      }
    } else {
      // Reset if user logs out
      setBusiness(null);
      setProducts([]);
    }

    setLoading(false);
  });

  return () => unsub();
}, []);



  // Search and category filter state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [imgIndexes, setImgIndexes] = useState({}); // {prodId: index}
  const [imgTimers, setImgTimers] = useState({});
  const [menuOpen, setMenuOpen] = useState(null); // prodId
  const [modalOpen, setModalOpen] = useState(false); // add/edit modal
  const [editProduct, setEditProduct] = useState(null); // product being edited
  const [modalLoading, setModalLoading] = useState(false);
  const [modalImages, setModalImages] = useState([null, null, null]); // File or url
  const [modalPreview, setModalPreview] = useState([null, null, null]);
  const [modalFields, setModalFields] = useState({ name: '', description: '', price: '', category: '', availability: true });
  const [modalCategoryInput, setModalCategoryInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null); // prodId

  // Get all categories from products
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => p.category && cats.add(p.category));
    return Array.from(cats);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (category && category !== "all") filtered = filtered.filter((p) => p.category === category);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(s) ||
        (p.description && p.description.toLowerCase().includes(s))
      );
    }
    return filtered;
  }, [products, search, category]);

  // Image slider logic
  useEffect(() => {
    // For each product, set interval for image slider
    filteredProducts.forEach((prod) => {
      if (!prod.images || prod.images.length <= 1) return;
      if (imgTimers[prod.prodId]) return; // already set
      const timer = setInterval(() => {
        setImgIndexes((prev) => ({
          ...prev,
          [prod.prodId]: ((prev[prod.prodId] || 0) + 1) % Math.min(prod.images.length, 3),
        }));
      }, 10000);
      setImgTimers((prev) => ({ ...prev, [prod.prodId]: timer }));
    });
    // Cleanup on unmount
    return () => {
      Object.values(imgTimers).forEach(clearInterval);
    };
    // eslint-disable-next-line
  }, [filteredProducts]);

  // Truncate description
  const truncate = (str, n) => (str && str.length > n ? str.slice(0, n) + "..." : str);

  // Currency
  const currency = business && business.currency ? business.currency : "₦";

  // Card hover effect (CSS only for now)


// --- Modal Handlers ---
function handleImageChange(e, idx, setModalImages, setModalPreview) {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  setModalImages(prev => {
    const arr = [...prev];
    arr[idx] = file;
    return arr;
  });
  setModalPreview(prev => {
    const arr = [...prev];
    arr[idx] = url;
    return arr;
  });
}

function handleEditProduct(prod, setEditProduct, setModalFields, setModalImages, setModalPreview, setModalOpen) {
  setEditProduct(prod);
  setModalFields({
    name: prod.name || '',
    description: prod.description || '',
    price: prod.price || '',
    category: prod.category || '',
    availability: prod.availability !== false,
  });
  setModalImages([null, null, null]);
  setModalPreview([
    prod.images && prod.images[0] ? prod.images[0] : null,
    prod.images && prod.images[1] ? prod.images[1] : null,
    prod.images && prod.images[2] ? prod.images[2] : null,
  ]);
  setModalOpen(true);
}

async function handleModalSave({
  modalFields, modalPreview, modalImages, editProduct, user, business, products, setModalLoading, setProducts, setModalOpen, toast, db, storage
}) {
  if (!modalFields.name.trim() || !modalFields.price || !modalFields.category) {
    toast.error('Name, price, and category are required.');
    return;
  }
  if (!modalPreview[0] && !modalImages[0]) {
    toast.error('At least the first photo is required.');
    return;
  }
  setModalLoading(true);
  try {
    // Upload images to storage if new
    let imageLinks = [...modalPreview];
    for (let i = 0; i < 3; i++) {
      if (modalImages[i]) {
        const file = modalImages[i];
        const storagePath = `products/${user.uid}/${Date.now()}_${i}_${file.name}`;
        const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const ref = storageRef(storage, storagePath);
        await uploadBytes(ref, file);
        imageLinks[i] = await getDownloadURL(ref);
      }
    }
    // Remove empty
    imageLinks = imageLinks.filter(Boolean);
    // Generate prodId if new
    let prodId = editProduct ? editProduct.prodId : `prod${Math.random().toString().slice(2, 12)}`;
    // Prepare product object
    const newProduct = {
      prodId,
      name: modalFields.name.trim(),
      description: modalFields.description.trim(),
      price: Number(modalFields.price),
      category: modalFields.category,
      images: imageLinks,
      availability: modalFields.availability,
      featured: editProduct ? editProduct.featured : false,
      dateAdded: editProduct ? editProduct.dateAdded : new Date().toISOString(),
    };
    // Update Firestore
    const businessRef = doc(db, 'businesses', business.id || business.businessId);
    let updatedProducts;
    if (editProduct) {
      updatedProducts = products.map((p) => (p.prodId === prodId ? newProduct : p));
    } else {
      updatedProducts = [newProduct, ...products];
    }
    await import('firebase/firestore').then(({ updateDoc }) => updateDoc(businessRef, { products: updatedProducts }));
    setProducts(updatedProducts);
    setModalOpen(false);
    toast.success(editProduct ? 'Product updated!' : 'Product added!');
  } catch (err) {
    toast.error('Error saving product.');
  }
  setModalLoading(false);
}

async function handleFeatureProduct(prod, business, setBusiness, toast, db) {
  if (!business) return;
  const featuredArr = business.featured || [];
  const isFeatured = featuredArr.some(f => f.id === prod.prodId && f.type === 'product');
  let newArr;
  if (isFeatured) {
    newArr = featuredArr.filter(f => !(f.id === prod.prodId && f.type === 'product'));
  } else {
    newArr = [{ id: prod.prodId, type: 'product', dateAdded: new Date().toISOString() }, ...featuredArr];
  }
  const businessRef = doc(db, 'businesses', business.id || business.businessId);
  await import('firebase/firestore').then(({ updateDoc }) => updateDoc(businessRef, { featured: newArr }));
  setBusiness(b => ({ ...b, featured: newArr }));
  toast.success(isFeatured ? 'Product unfeatured.' : 'Product featured!');
}

async function handleAvailableProduct(prod, business, products, setProducts, toast, db) {
  const updatedProducts = products.map(p => p.prodId === prod.prodId ? { ...p, availability: !p.availability } : p);
  const businessRef = doc(db, 'businesses', business.id || business.businessId);
  await import('firebase/firestore').then(({ updateDoc }) => updateDoc(businessRef, { products: updatedProducts }));
  setProducts(updatedProducts);
  toast.success('Product availability updated.');
}

async function handleDeleteProduct(deleteConfirm, business, products, setProducts, setDeleteConfirm, toast, db) {
  const updatedProducts = products.filter(p => p.prodId !== deleteConfirm);
  const businessRef = doc(db, 'businesses', business.id || business.businessId);
  await import('firebase/firestore').then(({ updateDoc }) => updateDoc(businessRef, { products: updatedProducts }));
  setProducts(updatedProducts);
  setDeleteConfirm(null);
  toast.success('Product deleted.');
}

  // Render
  return (
    <div className={styles.productsInterface}>
      <Toaster position="top-right" richColors />
      <div className={styles.productsTop}>
        <p className={styles.tag}>Products</p>
        <div
          className={styles.addingProducts}
          title="Add Product"
          onClick={() => {
            setEditProduct(null);
            setModalFields({ name: '', description: '', price: '', category: '', availability: true });
            setModalImages([null, null, null]);
            setModalPreview([null, null, null]);
            setModalOpen(true);
          }}
        >
          <i className="fa-solid fa-plus"></i>
        </div>
      </div>

      <div className={styles.searchArea}>
        <div>
          <select className={styles.bgInput}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ minWidth: 140 }}
          >
            <option value="">Sort by category</option>
            <option value="all">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <input

             className={styles.bgInput}
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 180 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32, color: "#888" }}></i>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.noProducts}>
          <i className="fa-solid fa-inbox"></i>
          <p>No Products</p>
        </div>
      ) : (
        <div className={styles.Products}>
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.prodId}
              prod={prod}
              currency={currency}
              imgIndex={imgIndexes[prod.prodId] || 0}
              setImgIndex={(idx) => setImgIndexes((prev) => ({ ...prev, [prod.prodId]: idx }))}
              menuOpen={menuOpen === prod.prodId}
              setMenuOpen={setMenuOpen}
              featuredArr={business && business.featured ? business.featured : []}
              onEdit={() => handleEditProduct(prod, setEditProduct, setModalFields, setModalImages, setModalPreview, setModalOpen)}
              onFeature={() => handleFeatureProduct(prod, business, setBusiness, toast, db)}
              onAvailable={() => handleAvailableProduct(prod, business, products, setProducts, toast, db)}
              onDelete={() => setDeleteConfirm(prod.prodId)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ModalOverlay>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{
                background: '#fff',
                borderRadius: 12,
                maxWidth: 400,
                margin: '60px auto',
                padding: 24,
                boxShadow: '0 4px 32px rgba(0,0,0,0.13)',
                position: 'relative',
              }}
            >
              <h3 style={{ marginBottom: 18 }}>{editProduct ? 'Edit Product' : 'Add Product'}</h3>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 18 }}>
                {[0, 1, 2].map((idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <label htmlFor={`img-upload-${idx}`} style={{
                      width: 64, height: 64, borderRadius: '50%', background: '#eee',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      overflow: 'hidden', border: '2px solid #ccc', position: 'relative',
                    }}>
                      {modalPreview[idx] ? (
                        <img src={modalPreview[idx]} alt={`preview${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#888', fontSize: 13 }}>Photo {idx + 1}</span>
                      )}
                      <input
                        id={`img-upload-${idx}`}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleImageChange(e, idx, setModalImages, setModalPreview)}
                      />
                    </label>
                    {idx === 0 && <span style={{ fontSize: 11, color: '#888', marginTop: 2 }}>*required</span>}
                  </div>
                ))}
              </div>
              <input
                type="text"
                placeholder="Product Name"
                value={modalFields.name}
                onChange={e => setModalFields(f => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 8, border: '1px solid #eee' }}
              />
              <textarea
                placeholder="Description"
                value={modalFields.description}
                onChange={e => setModalFields(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 8, border: '1px solid #eee', minHeight: 60 }}
              />
              <input
                type="number"
                placeholder="Price"
                value={modalFields.price}
                onChange={e => setModalFields(f => ({ ...f, price: e.target.value }))}
                style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 8, border: '1px solid #eee' }}
              />
              <div style={{ marginBottom: 10 }}>
                <select
                  value={modalFields.category}
                  onChange={e => setModalFields(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #eee' }}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__add_new__">+ Add new category</option>
                </select>
                {modalFields.category === "__add_new__" && (
                  <input
                    type="text"
                    placeholder="New Category"
                    value={modalCategoryInput}
                    onChange={e => setModalCategoryInput(e.target.value)}
                    style={{ width: '100%', marginTop: 6, padding: 8, borderRadius: 8, border: '1px solid #eee' }}
                    onBlur={() => {
                      if (modalCategoryInput.trim()) {
                        setModalFields(f => ({ ...f, category: modalCategoryInput.trim() }));
                      }
                    }}
                  />
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, color: '#555' }}>
                  <input
                    type="checkbox"
                    checked={modalFields.availability}
                    onChange={e => setModalFields(f => ({ ...f, availability: e.target.checked }))}
                    style={{ marginRight: 6 }}
                  />
                  Available
                </label>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => handleModalSave({
                    modalFields, modalPreview, modalImages, editProduct, user, business, products, setModalLoading, setProducts, setModalOpen, toast, db, storage
                  })}
                  disabled={modalLoading}
                  style={{
                    flex: 1,
                    background: 'var(--secondary-color)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 0',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: modalLoading ? 'not-allowed' : 'pointer',
                    opacity: modalLoading ? 0.7 : 1,
                    position: 'relative',
                  }}
                >
                  {modalLoading ? <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 16 }}></i> : 'Save'}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={modalLoading}
                  style={{
                    flex: 1,
                    background: '#eee',
                    color: '#333',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 0',
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: modalLoading ? 'not-allowed' : 'pointer',
                    opacity: modalLoading ? 0.7 : 1,
                  }}
                >Cancel</button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <ModalOverlay>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{ background: '#fff', borderRadius: 12, maxWidth: 340, margin: '80px auto', padding: 24, boxShadow: '0 4px 32px rgba(0,0,0,0.13)', textAlign: 'center' }}
            >
              <i className="fa-solid fa-triangle-exclamation" style={{ color: '#e74c3c', fontSize: 32, marginBottom: 12 }}></i>
              <h4>Delete Product?</h4>
              <p style={{ color: '#888', marginBottom: 18 }}>Are you sure you want to delete this product? This cannot be undone.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => handleDeleteProduct(deleteConfirm, business, products, setProducts, setDeleteConfirm, toast, db)}
                  style={{ flex: 1, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                >Delete</button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{ flex: 1, background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                >Cancel</button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );

  // --- ProductCard subcomponent ---
  function ProductCard({ prod, currency, imgIndex, setImgIndex, menuOpen, setMenuOpen, featuredArr, onEdit, onFeature, onAvailable, onDelete }) {
    const { prodId, name, price, description, category, images = [], availability } = prod;
    const featured = featuredArr.some((f) => f.id === prodId && f.type === "product");
    const imgs = images.slice(0, 3);
    const [direction, setDirection] = useState(0);
    const [isSliding, setIsSliding] = useState(false);

    // Preload next image
    React.useEffect(() => {
      if (imgs.length > 1) {
        const nextIdx = (imgIndex + 1) % imgs.length;
        const prevIdx = (imgIndex - 1 + imgs.length) % imgs.length;
        [nextIdx, prevIdx].forEach(idx => {
          if (imgs[idx]) {
            const img = new window.Image();
            img.src = imgs[idx];
          }
        });
      }
    }, [imgIndex, imgs]);

    // Handle image nav click
    const goToImg = (idx) => {
      if (isSliding || idx === imgIndex) return;
      setDirection(idx > imgIndex ? 1 : -1);
      setIsSliding(true);
      setTimeout(() => setIsSliding(false), 400);
      setImgIndex(idx);
    };

    // Arrow navigation
    const goNext = () => goToImg((imgIndex + 1) % imgs.length);
    const goPrev = () => goToImg((imgIndex - 1 + imgs.length) % imgs.length);

    // Menu overlay close on outside click
    React.useEffect(() => {
      if (!menuOpen) return;
      const handle = (e) => {
        if (!e.target.closest(`#menu-${prodId}`) && !e.target.closest(`#menu-btn-${prodId}`)) {
          setMenuOpen(null);
        }
      };
      document.addEventListener('mousedown', handle);

      return () => document.removeEventListener('mousedown', handle);
    }, [menuOpen, prodId, setMenuOpen]);

   return (
  <div
    className={`${design.card} ${featured ? design.featuredCard : ""}`}
    style={{
      opacity: availability === false ? 0.6 : 1,
      position: "relative",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
  >
    {/* Menu */}
    <div className={design.menu}>
      <i
        id={`menu-btn-${prodId}`}
        className="fa-solid fa-ellipsis"
        onClick={() => setMenuOpen(menuOpen ? null : prodId)}
        style={{ color: "#888" }}
      ></i>
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                background: "#000",
                zIndex: 100,
              }}
              onClick={() => setMenuOpen(null)}
            />
            <motion.div
              id={`menu-${prodId}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              style={{
                position: "absolute",
                top: 40,
                right: 10,
                zIndex: 101,
                fontSize: 12,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(116, 113, 113, 0.13)",
                minWidth: 170,
                padding: 8,
              }}
            >
              <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { setMenuOpen(null); onFeature(); }}>
                {featured ? "Unfeature" : "Feature"} product
              </div>
              <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { setMenuOpen(null); onEdit(); }}>
                Edit product
              </div>
              <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { setMenuOpen(null); onAvailable(); }}>
                {availability ? "Make unavailable" : "Make available"}
              </div>
              <div style={{ padding: 8, cursor: "pointer", color: "#e74c3c" }} onClick={() => { setMenuOpen(null); onDelete(); }}>
                Delete product
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>

    {/* Product Images (Auto-sliding only) */}
    <div className={design.productImages}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={imgIndex}
          initial={{ x: direction > 0 ? 120 : -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction < 0 ? 120 : -120, opacity: 0 }}
          transition={{ duration: 0.38, ease: "easeInOut" }}
          style={{ width: "100%", height: 200, borderRadius: 10, position: "absolute", top: 0, left: 0, background: "#fff" }}
        >
          <img
            src={imgs[imgIndex] || testImage1}
            alt={name}
            style={{ width: "100%", height: 200, borderRadius: 10, objectFit: "cover", display: "block" }}
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dots still remain */}
      <div className={design.sliderDots}>
        {imgs.map((_, idx) => (
          <span
            key={idx}
            onClick={() => goToImg(idx)}
            className={idx === imgIndex ? `${design.dot} ${design.activeDot}` : design.dot}
            style={{ cursor: isSliding ? "not-allowed" : "pointer" }}
          ></span>
        ))}
      </div>
    </div>

    {/* Product Info */}
    <div className={design.productInfo}>
      <p className={design.productName}>{truncate(name, 30)}</p>
      <p className={design.price}>{currency}{price?.toLocaleString()}</p>
      <p className={design.description}>{truncate(description, 60)}</p>

      <div className={design.shareable}>
        <p className={design.collection}>{category}</p>
        <p
          className={design.nodeShare}
          style={{ cursor: "pointer" }}
          onClick={async () => {
            const shareData = {
              title: name,
              text: `Check out this product: ${name}`,
              url: `https://${business.businessId}.minimart.ng/product/${prodId}`,
            };

            try {
              if (navigator.share) {
                await navigator.share(shareData);
                console.log("Shared successfully");
              } else {
                await navigator.clipboard.writeText(shareData.url);
                alert("Product link copied to clipboard!");
              }
            } catch (err) {
              console.error("Error sharing:", err);
            }
          }}
        >
          <i className="fa-solid fa-share-nodes"></i>
        </p>
      </div>
    </div>
  </div>
);

  }
};

export default Products;