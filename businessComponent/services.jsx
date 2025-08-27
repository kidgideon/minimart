import styles from "./services.module.css";
import design from "./itemDesign.module.css"
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState, useMemo } from "react";
import { auth, db, storage } from "../src/hooks/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import testImage1 from "../src/images/prod1.jpeg";
import { Toaster, toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

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

const Services = () => {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [imgIndexes, setImgIndexes] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editService, setEditService] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  // Modal state and handlers
  const [modalLoading, setModalLoading] = useState(false);
  const [modalFields, setModalFields] = useState({ name: '', description: '', price: '', duration: '', bookable: true, category: '' });
  const [modalImages, setModalImages] = useState([null, null, null]);
  const [modalPreview, setModalPreview] = useState([null, null, null]);
  const [modalCategoryInput, setModalCategoryInput] = useState(""); // Add this state

  function handleImageChange(e, idx) {
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

  function openAddServiceModal() {
    setEditService(null);
    setModalFields({ name: '', description: '', price: '', duration: '', bookable: true, category: '' });
    setModalImages([null, null, null]);
    setModalPreview([null, null, null]);
    setModalOpen(true);
  }

  function handleEditService(svc) {
    setEditService(svc);
    setModalFields({
      name: svc.name || '',
      description: svc.description || '',
      price: svc.price || '',
      duration: svc.duration || '',
      bookable: svc.bookable !== false,
      category: svc.category || '',
    });
    setModalImages([null, null, null]);
    setModalPreview([
      svc.images && svc.images[0] ? svc.images[0] : null,
      svc.images && svc.images[1] ? svc.images[1] : null,
      svc.images && svc.images[2] ? svc.images[2] : null,
    ]);
    setModalOpen(true);
  }

  // Feature/unfeature service
  async function handleFeatureService(svc) {
    if (!business) return;
    const featuredArr = business.featured || [];
    const isFeatured = featuredArr.some(f => f.id === svc.serviceId && f.type === 'service');
    let newArr;
    if (isFeatured) {
      newArr = featuredArr.filter(f => !(f.id === svc.serviceId && f.type === 'service'));
    } else {
      newArr = [{ id: svc.serviceId, type: 'service', dateAdded: new Date().toISOString() }, ...featuredArr];
    }
    const businessRef = doc(db, 'businesses', business.id || business.businessId);
    await import('firebase/firestore').then(({ updateDoc }) => updateDoc(businessRef, { featured: newArr }));
    setBusiness(b => ({ ...b, featured: newArr }));
    setFeatured(newArr);
    toast.success(isFeatured ? 'Service unfeatured.' : 'Service featured!');
  }

  async function handleModalSave() {
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
      // Upload images to Firebase Storage if new
      let imageLinks = [...modalPreview];
      for (let i = 0; i < 3; i++) {
        if (modalImages[i]) {
          const file = modalImages[i];
          const storagePath = `services/${user.uid}/${Date.now()}_${i}_${file.name}`;
          const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
          const refObj = storageRef(storage, storagePath);
          await uploadBytes(refObj, file);
          const url = await getDownloadURL(refObj);
          imageLinks[i] = url;
        }
      }
      imageLinks = imageLinks.filter(Boolean);
      // Generate serviceId if new
      let serviceId = editService ? editService.serviceId : `svc${Math.random().toString().slice(2, 12)}`;
      // Prepare service object
      const newService = {
        serviceId,
        name: modalFields.name.trim(),
        description: modalFields.description.trim(),
        price: Number(modalFields.price),
        duration: modalFields.duration,
        bookable: modalFields.bookable,
        category: modalFields.category,
        images: imageLinks,
        featured: editService ? editService.featured : false,
        dateAdded: editService ? editService.dateAdded : new Date().toISOString(),
      };
      // Update Firestore
      const businessRef = doc(db, 'businesses', business.id || business.businessId);
      let updatedServices;
      if (editService) {
        updatedServices = services.map((s) => s.serviceId === serviceId ? newService : s);
      } else {
        updatedServices = [newService, ...services];
      }
      await import('firebase/firestore').then(({ updateDoc }) => updateDoc(businessRef, { services: updatedServices }));
      setServices(updatedServices);
      setModalOpen(false);
      toast.success(editService ? 'Service updated!' : 'Service added!');
    } catch (err) {
      toast.error('Error saving service.');
    }
    setModalLoading(false);
  }

  // Delete service handler
  async function handleDeleteService(serviceId) {
    if (!business) return;
    const updatedServices = services.filter(s => s.serviceId !== serviceId);
    const businessRef = doc(db, 'businesses', business.id || business.businessId);
    await import('firebase/firestore').then(({ updateDoc }) => updateDoc(businessRef, { services: updatedServices }));
    setServices(updatedServices);
    setDeleteConfirm(null);
    toast.success('Service deleted!');
  }

 
  const { isLoading, isError, data, refetch } = useQuery({
    queryKey: ["services"],
    queryFn: () =>
      new Promise((resolve, reject) => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) {
            unsub();
            return reject(new Error("User not authenticated"));
          }
          try {
            setUser(firebaseUser);
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            const userData = userDoc.exists() ? userDoc.data() : null;
            if (!userData?.businessId) throw new Error("No business ID linked");

            const businessDoc = await getDoc(doc(db, "businesses", userData.businessId));
            const businessData = businessDoc.exists() ? businessDoc.data() : null;

            setBusiness(businessData);
            const sortedServices = businessData?.services
              ? [...businessData.services].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
              : [];

            resolve({ user: firebaseUser, business: businessData, services: sortedServices });
          } catch (err) {
            reject(err);
          } finally {
            unsub();
          }
        });
      }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data?.services) {
      setServices(data.services);
    }
    if (data?.business) {
      setBusiness(data.business);
    }
    if (data?.user) {
      setUser(data.user);
    }
  }, [data]);


  // --- Category logic ---
  // Get all categories from services
  const categories = useMemo(() => {
    const cats = new Set();
    services.forEach((s) => s.category && cats.add(s.category));
    return Array.from(cats);
  }, [services]);

  // Search and category filter state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // Filtered services
  const filteredServices = useMemo(() => {
    let filtered = services;
    if (category && category !== "all") filtered = filtered.filter(s => s.category === category);
    if (search.trim()) filtered = filtered.filter(s => s.name.toLowerCase().includes(search.trim().toLowerCase()));
    return filtered;
  }, [services, search, category]);

  // Featured items (services and products)
  const featuredServices = useMemo(() => {
    if (!featured || !services) return [];
    return featured.filter(f => f.type === "service").map(f => services.find(s => s.serviceId === f.id)).filter(Boolean);
  }, [featured, services]);

  // --- ServiceCard subcomponent ---
  function ServiceCard({ svc, imgIndex, setImgIndex, menuOpen, setMenuOpen, featuredArr }) {
    const { serviceId, name, price, description, images = [], featured, duration, bookable } = svc;
    const isFeatured = featuredArr.some((f) => f.id === serviceId && f.type === "service");
    const imgs = images.length ? images.slice(0, 3) : [testImage1];
    const [direction, setDirection] = useState(0);
    const [isSliding, setIsSliding] = useState(false);

    // Preload next/prev
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

    const goToImg = (idx) => {
      if (isSliding || idx === imgIndex) return;
      setDirection(idx > imgIndex ? 1 : -1);
      setIsSliding(true);
      setTimeout(() => setIsSliding(false), 400);
      setImgIndex(idx);
    };
    const goNext = () => goToImg((imgIndex + 1) % imgs.length);
    const goPrev = () => goToImg((imgIndex - 1 + imgs.length) % imgs.length);

    // Menu overlay close on outside click
    React.useEffect(() => {
      if (!menuOpen) return;
      const handle = (e) => {
        if (!e.target.closest(`#svc-menu-${serviceId}`) && !e.target.closest(`#svc-menu-btn-${serviceId}`)) {
          setMenuOpen(null);
        }
      };
      document.addEventListener('mousedown', handle);
      return () => document.removeEventListener('mousedown', handle);
    }, [menuOpen, serviceId, setMenuOpen]);


  return (
  <div
    className={`${design.card} ${isFeatured ? design.serviceCard : ""}`}
    style={{ position: "relative" }}
  >
    {/* Menu */}
    <div className={design.menu}>
      <i
        id={`svc-menu-btn-${serviceId}`}
        className="fa-solid fa-ellipsis"
        onClick={() => setMenuOpen(menuOpen ? null : serviceId)}
        style={{ color: "#888" }}
      ></i>
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="svc-menu-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "#000",
                zIndex: 100,
              }}
              onClick={() => setMenuOpen(null)}
            />
            <motion.div
              id={`svc-menu-${serviceId}`}
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
              <div
                style={{ padding: 8, cursor: "pointer" }}
                onClick={() => {
                  setMenuOpen(null);
                  handleFeatureService(svc);
                }}
              >
                {isFeatured ? "Unfeature" : "Feature"} service
              </div>
              <div
                style={{ padding: 8, cursor: "pointer" }}
                onClick={() => {
                  setMenuOpen(null);
                  handleEditService(svc);
                }}
              >
                Edit service
              </div>
              <div
                style={{ padding: 8, cursor: "pointer", color: "#e74c3c" }}
                onClick={() => {
                  setMenuOpen(null);
                  setDeleteConfirm(svc.serviceId);
                }}
              >
                Delete service
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>

    {/* Service Images (No Left/Right buttons) */}
    <div className={design.serviceImages}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={imgIndex}
          initial={{ x: direction > 0 ? 120 : -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction < 0 ? 120 : -120, opacity: 0 }}
          transition={{ duration: 0.38, ease: "easeInOut" }}
          style={{
            width: "100%",
            height: 200,
            borderRadius: 10,
            position: "absolute",
            top: 0,
            left: 0,
            background: "#fff",
          }}
        >
          <img
            src={imgs[imgIndex] || testImage1}
            alt={name}
            style={{
              width: "100%",
              height: 200,
              borderRadius: 10,
              objectFit: "cover",
              display: "block",
            }}
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>

      {/* Slider Dots */}
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

    {/* Service Info */}
    <div className={design.serviceCardInfo}>
      <p className={design.itemName}>{name}</p>
      <p className={design.itemPrice}>₦{price?.toLocaleString()}</p>
      <p className={design.itemDescription}>{description}</p>

      <div className={design.shareable}>
        <p className={design.collection}>{categories}</p>
        <p
          className={design.nodeShare}
          style={{ cursor: "pointer" }}
          onClick={async () => {
            const shareData = {
              url: `https://${business.businessId}.minimart.ng/product/${serviceId}`,
            };

            try {
              if (navigator.share) {
                await navigator.share(shareData);
                console.log("Shared successfully");
              } else {
                await navigator.clipboard.writeText(shareData.url);
                alert("Link copied to clipboard!");
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

  return (
    <div className={styles.servicesInterface}>
      <Toaster position="top-right" richColors />
      <div className={styles.servicesTop}>
        <p className={styles.tag}>Services</p>
        <div className={styles.addingServices} title="Add Service" onClick={openAddServiceModal}>
          <i className="fa-solid fa-plus"></i>
        </div>
      </div>
      {/* Search and category filter */}
      <div className={styles.searchArea}>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ minWidth: 140 }}
        >
          <option value="">Sort by category</option>
          <option value="all">All</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 180 }}
        />
      </div>
      <div className={styles.Services}>
        {isLoading  ? (
          <div className={styles.loadingElement}><i className="fa-solid fa-spinner fa-spin"></i></div>
        ) : filteredServices.length === 0 ? (
          <div className={styles.noServices}>
            <i className="fa-solid fa-inbox"></i>
            <p>No Services</p>
          </div>
        ) : (
          filteredServices.map((svc) => (
            <ServiceCard
              key={svc.serviceId}
              svc={svc}
              imgIndex={imgIndexes[svc.serviceId] || 0}
              setImgIndex={(idx) => setImgIndexes((prev) => ({ ...prev, [svc.serviceId]: idx }))}
              menuOpen={menuOpen === svc.serviceId}
              setMenuOpen={setMenuOpen}
              featuredArr={featured}
            />
          ))
        )}
      </div>
      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ModalOverlay>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className={styles.modalCard}
            >
              <h3 className={styles.modalTitle}>{editService ? 'Edit Service' : 'Add Service'}</h3>
              <div className={styles.modalFieldsWrap}>
                <input type="text" placeholder="Service name" value={modalFields.name} onChange={e => setModalFields(f => ({ ...f, name: e.target.value }))} className={styles.modalInput} />
                <textarea placeholder="Description" value={modalFields.description} onChange={e => setModalFields(f => ({ ...f, description: e.target.value }))} className={styles.modalTextarea} />
                <input type="number" placeholder="Price" value={modalFields.price} onChange={e => setModalFields(f => ({ ...f, price: e.target.value }))} className={styles.modalInput} />
                <input type="text" placeholder="Duration (optional)" value={modalFields.duration} onChange={e => setModalFields(f => ({ ...f, duration: e.target.value }))} className={styles.modalInput} />
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
                <label className={styles.modalCheckboxLabel}>
                  <input type="checkbox" checked={modalFields.bookable} onChange={e => setModalFields(f => ({ ...f, bookable: e.target.checked }))} /> Bookable
                </label>
                <div className={styles.modalImagesWrap}>
                  {[0, 1, 2].map(idx => (
                    <div key={idx} className={styles.modalImgCol}>
                      <input type="file" accept="image/*" className={styles.modalFileInput} id={`svc-img-upload-${idx}`} onChange={e => handleImageChange(e, idx)} />
                      <label htmlFor={`svc-img-upload-${idx}`} className={styles.modalImgLabel}>
                        {modalPreview[idx] ? <img src={modalPreview[idx]} alt="preview" className={styles.modalImgPreview} /> : <i className="fa-solid fa-image" />}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.modalBtnRow}>
                <button onClick={handleModalSave} disabled={modalLoading} className={styles.modalSaveBtn}>{modalLoading ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setModalOpen(false)} disabled={modalLoading} className={styles.modalCancelBtn}>Cancel</button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>
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
              <h4>Delete Service?</h4>
              <p style={{ color: '#888', marginBottom: 18 }}>Are you sure you want to delete this service? This cannot be undone.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  style={{ flex: 1, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                  onClick={() => handleDeleteService(deleteConfirm)}
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
};

export default Services;