import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import testImage1 from "../src/images/prod1.jpeg";

export default function ProductCard({
  prod,
  currency = "₦",
  imgIndex,
  setImgIndex,
  menuOpen,
  setMenuOpen,
  featuredArr = [],
  onEdit,
  onFeature,
  onAvailable,
  onDelete,
}) {
  const { prodId, name, price, description, category, images = [], availability } = prod;
  const featured = featuredArr.some(f => f.id === prodId && f.type === "product");
  const imgs = images.slice(0, 3);
  const [direction, setDirection] = useState(0);
  const [storeId, setStoreId] = useState(null);

  // Fetch storeId from logged-in user
  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setStoreId(userData.businessId || null);
          }
        } catch (error) {
          console.error("Error fetching user businessId:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    if (!menuOpen) return;
    const handler = e => {
      if (!e.target.closest(`#menu-${prodId}`) && !e.target.closest(`#menu-btn-${prodId}`)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, prodId, setMenuOpen]);

  const truncate = (str, n) => (str && str.length > n ? str.slice(0, n) + "..." : str);

  const handleShare = async () => {
    if (!storeId) {
      alert("Unable to share: Store ID not found");
      return;
    }

    const shareUrl = `https://${storeId}.minimart.ng/product/${prodId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: description || "Check out this product",
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share cancelled", err);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div
      style={{
        width: 350,
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
        boxShadow: featured ? "0 8px 30px rgba(43,108,176,0.12)" : "0 6px 18px rgba(0,0,0,0.06)",
        marginBottom: 18,
        opacity: availability === false ? 0.6 : 1,
        position: "relative",
      }}
    >
      {/* Menu */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 5 }}>
        <i
          id={`menu-btn-${prodId}`}
          className="fa-solid fa-ellipsis"
          onClick={() => setMenuOpen(menuOpen ? null : prodId)}
          style={{
            color: "#fff",
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            padding: "6px 8px",
            borderRadius: "50%",
            cursor: "pointer",
          }}
        />
        <AnimatePresence>
          {menuOpen === prodId && (
            <>
              <motion.div
                key="menu-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.12 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 30,
                }}
                onClick={() => setMenuOpen(null)}
              />
              <motion.div
                id={`menu-${prodId}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  top: 28,
                  right: -6,
                  zIndex: 31,
                  background: "white",
                  backdropFilter: "blur(12px)",
                  padding: 8,
                  borderRadius: 12,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                  minWidth: 160,
                  color: "black",
                  fontSize: 12,
                }}
              >
                <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { setMenuOpen(null); onFeature(prod); }}>
                  {featured ? "Unfeature" : "Feature"}
                </div>
                <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { setMenuOpen(null); onEdit(prod); }}>
                  Edit
                </div>
                <div style={{ padding: 8, cursor: "pointer" }} onClick={handleShare}>
                  Share
                </div>
                <div style={{ padding: 8, cursor: "pointer" }} onClick={() => { setMenuOpen(null); onAvailable(prod); }}>
                  {availability ? "Make unavailable" : "Make available"}
                </div>
                <div style={{ padding: 8, cursor: "pointer", color: "#ff8a8a" }} onClick={() => { setMenuOpen(null); onDelete(prod); }}>
                  Delete
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Images */}
      <div style={{ height: 200, position: "relative", background: "#f8f8f8" }}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={imgIndex}
            initial={{ x: direction > 0 ? 120 : -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction < 0 ? 120 : -120, opacity: 0 }}
            transition={{ duration: 0.36, ease: "easeInOut" }}
            style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
          >
            <img
              src={imgs[imgIndex] || testImage1}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* dots */}
        <div style={{ position: "absolute", left: 12, bottom: 12, display: "flex", gap: 6 }}>
          {imgs.map((_, idx) => (
            <span
              key={idx}
              onClick={() => goToIndex(setImgIndex, idx)}
              style={{
                width: 8,
                height: 8,
                borderRadius: 8,
                background: idx === imgIndex ? "#222" : "rgba(0,0,0,0.18)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#222", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ color: "#444", fontWeight: 700 }}>{currency}{Number(price || 0).toLocaleString()}</div>
        </div>

        <div style={{ color: "#666", marginTop: 6, fontSize: 13, height: 36, overflow: "hidden" }}>{truncate(description, 60)}</div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
          <div style={{ background: "var(--primary-color)", color: "white", padding: "6px 8px", borderRadius: 8, fontSize: 12 }}>{category}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{availability ? "In stock" : "Unavailable"}</div>
        </div>
      </div>
    </div>
  );
}

function goToIndex(setImgIndex, idx) {
  setImgIndex(idx);
}
