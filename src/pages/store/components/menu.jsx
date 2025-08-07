import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { db } from "../../../hooks/firebase";
import { doc, getDoc } from "firebase/firestore";
import styles from "./menu.module.css";
import { toast } from "sonner";

const Menu = ({ storeId }) => {
  const [showModal, setShowModal] = useState(false);
  const [business, setBusiness] = useState(null);
  const [liked, setLiked] = useState(false);
  const localLikeKey = `liked_store_${storeId}`;
  const starRefs = [];

  useEffect(() => {
    const onPopState = () => {
      if (showModal) {
        setShowModal(false);
        window.history.pushState(null, "");
      }
    };

    if (showModal) {
      window.history.pushState(null, "");
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
          { transform: "rotate(0deg)" },
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
        return `https://wa.me/${value.replace(/\D/g, "")}`;
      case "instagram":
        return `https://instagram.com/${value.replace(/^@/, "")}`;
      case "facebook":
        return value.startsWith("http") ? value : `https://facebook.com/${value}`;
      case "tiktok":
        return `https://www.tiktok.com/@${value.replace(/^@/, "")}`;
      default:
        return "#";
    }
  };

  const modalContent = showModal ? (
    createPortal(
      <div
        className={styles.popupOverlay}
        onClick={() => setShowModal(false)}
      >
        <div
          className={styles.popupBox}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <span>{business?.businessName || "Business"}</span>
            <i className="fa-solid fa-xmark" onClick={() => setShowModal(false)}></i>
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
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
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
      </div>

      {modalContent}
    </>
  );
};

export default Menu;
