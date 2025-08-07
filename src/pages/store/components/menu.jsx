import { useState, useEffect } from "react";
import { db } from "../../../hooks/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./menu.module.css";
import { toast } from "sonner";

const Menu = ({ storeId }) => {
  const [showModal, setShowModal] = useState(false);
  const [business, setBusiness] = useState(null);
  const [liked, setLiked] = useState(false);
  const localLikeKey = `liked_store_${storeId}`;

  const starRefs = [];

  useEffect(() => {
  const onPopState = (e) => {
    if (showModal) {
      setShowModal(false);
      window.history.pushState(null, ""); // Stay on page
    }
  };

  if (showModal) {
    window.history.pushState(null, ""); // Push fake page state
    window.addEventListener("popstate", onPopState);
  }

  return () => {
    window.removeEventListener("popstate", onPopState);
  };
}, [showModal]);


  useEffect(() => {
    const fetchBusiness = async () => {
      const docRef = doc(db, "businesses", storeId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBusiness(docSnap.data());
      }
    };

    fetchBusiness();
    setLiked(localStorage.getItem(localLikeKey) === "true");
  }, [storeId]);

  const toggleLike = () => {
    const newLikeState = !liked;
    setLiked(newLikeState);
    localStorage.setItem(localLikeKey, newLikeState);
    animateStars();
  };

  const animateStars = () => {
    starRefs.forEach((ref, i) => {
      if (!ref) return;
      ref.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(360deg)" },
          { transform: "rotate(0deg)" }
        ],
        {
          duration: 0.6,
          delay: i * 0.1,
          easing: "ease-in-out",
        }
      );
    });
  };

  const handleShare = () => {
    const link = `https://${storeId}.minimart.ng`;
    if (navigator.share) {
      navigator.share({
        title: business?.businessName || "Business",
        url: link,
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, "_blank");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${storeId}.minimart.ng`);
      toast.success("Link copied!");
    } catch (e) {
       toast.error("Failed to copy");
    }
  };
const getContactLink = () => {
  const platform = business?.mainContactPlatform?.toLowerCase();
  const value = business?.mainContactValue?.trim();

  if (!platform || !value) return "#";

  switch (platform) {
    case "whatsapp":
      // Remove any non-numeric and prepend country code if needed
      const number = value.replace(/\D/g, "");
      return `https://wa.me/${number}`;

    case "instagram":
      const igUsername = value.replace(/^@/, "");
      return `https://instagram.com/${igUsername}`;

    case "facebook":
      if (value.startsWith("http")) return value;
      return `https://facebook.com/${value}`;

    case "tiktok":
      const tiktokUsername = value.replace(/^@/, "");
      return `https://www.tiktok.com/@${tiktokUsername}`;

    default:
      return "#";
  }
};


  return (
    <div className={styles.menuArea}>
      <div className={styles.starArea} onClick={toggleLike}>
        {[...Array(5)].map((_, i) => (
          <i
            key={i}
            ref={(el) => (starRefs[i] = el)}
            className={`fa-solid fa-star ${liked ? styles.liked : ""}`}
          ></i>
        ))}
      </div>

      <div className={styles.menu} onClick={() => setShowModal(true)}>
        <i className="fa-solid fa-ellipsis"></i>
      </div>
        <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              className={styles.overlay}
              onClick={() => setShowModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.modalHeader}>
                <span>{business?.businessName || "Business"}</span>
                <i
                  className="fa-solid fa-xmark"
                  onClick={() => setShowModal(false)}
                ></i>
              </div>

              <div className={styles.menuItems}>
                <a href={getContactLink()} target="_blank" rel="noreferrer">
                  <i className="fa-solid fa-comment-dots"></i> Message Business
                </a>

                <button>
                  <i className="fa-solid fa-flag"></i> Report Page
                </button>

                <div className={styles.shareArea}>
                  <div>
                    <b>Share {business?.businessName || "Business"}’s page:</b>
                    <p>https://{storeId}.minimart.ng</p>
                  </div>
                  <div className={styles.shareButtons}>
                    <button onClick={copyLink}>
                      <i className="fa-solid fa-copy"></i> Copy Link
                    </button>
                    <button onClick={handleShare}>
                      <i className="fa-solid fa-share-nodes"></i> Share
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Menu;
