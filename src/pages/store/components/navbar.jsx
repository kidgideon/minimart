import { useEffect, useState, useCallback } from "react";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../../hooks/firebase";
import defaultLogo from "../../../images/no_bg.png";
import styles from "./navbar.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

function useLocalCartCount(storeId) {
  const storageKey = `cart_${storeId}`;

  const parseCart = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return 0;
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        return Object.values(obj).reduce((sum, qty) => sum + qty, 0);
      }
    } catch {}
    return 0;
  };

  const [count, setCount] = useState(parseCart());

  const refresh = useCallback(() => {
    setCount(parseCart());
  }, [storeId]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === storageKey) refresh();
    };
    const onCartUpdated = (e) => {
      if (e.detail === storeId) refresh();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("cartUpdated", onCartUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cartUpdated", onCartUpdated);
    };
  }, [refresh, storageKey, storeId]);

  return count;
}

const Navbar = ({ storeId }) => {
  const [business, setBusiness] = useState(null);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [likedStore, setLikedStore] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);
  const [cartAnim, setCartAnim] = useState(false);

  const cartCount = useLocalCartCount(storeId);
  const localLikeKey = `liked_store_${storeId}`;

  useEffect(() => {
    if (localStorage.getItem(localLikeKey)) {
      setLikedStore(true);
    }
  }, [localLikeKey]);

  useEffect(() => {
    if (!storeId) return;
    setLoadingBiz(true);
    const bizRef = doc(db, "businesses", storeId);
    const unsub = onSnapshot(
      bizRef,
      (snap) => {
        if (snap.exists()) {
          setBusiness(snap.data());
        } else {
          setBusiness(null);
        }
        setLoadingBiz(false);
      },
      (err) => {
        console.error("Failed to load business for navbar:", err);
        setLoadingBiz(false);
      }
    );
    return () => unsub();
  }, [storeId]);

  const toggleStoreLike = async () => {
    if (likedStore) return;

    try {
      const bizRef = doc(db, "businesses", storeId);
      const snap = await getDoc(bizRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const currentLikes = data.storeLike || 0;

      await updateDoc(bizRef, {
        storeLike: currentLikes + 1,
      });

      localStorage.setItem(localLikeKey, "true");
      setLikedStore(true);
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
    } catch (err) {
      console.error("Error liking store:", err);
    }
  };

  // Animate cart when cartCount changes
  useEffect(() => {
    if (cartCount <= 0) return;
    setBadgeKey((prev) => prev + 1);
    setCartAnim(true);
    const t = setTimeout(() => setCartAnim(false), 600);
    return () => clearTimeout(t);
  }, [cartCount]);

  const displayName = business?.businessName || storeId;
  const logoSrc = business?.customTheme?.logo || defaultLogo;

  return (
    <div className={styles.navbarInterface}>
      <div className={styles.companyArea}>
        <div className={styles.imageDiv}>
          {loadingBiz ? (
            <i className="fa-solid fa-spinner fa-spin" />
          ) : (
            <img src={logoSrc} alt="store logo" />
          )}
        </div>
        <p className={styles.storeName}>{displayName}</p>
      </div>

      <div className={styles.cartArea}>
        <motion.div
          className={`${styles.heart} ${likedStore ? styles.heartLiked : ""}`}
          onClick={toggleStoreLike}
          animate={likeAnim ? { scale: [1, 1.4, 1] } : {}}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={likedStore ? { pointerEvents: "none", opacity: 0.75 } : {}}
        >
          <i className="fa-solid fa-heart" />
        </motion.div>

        <motion.div
          className={styles.cart}
          animate={
            cartAnim
              ? { rotate: [0, 15, -10, 0], scale: [1, 1.1, 0.95, 1] }
              : {}
          }
          transition={{ duration: 0.6 }}
        >
         <Link to={"/cart"}><i  className="fa-solid fa-cart-shopping" /></Link>
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.div
                key={badgeKey}
                initial={{ y: 20, scale: 0, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={styles.badge}
              >
                +{cartCount}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Navbar;
