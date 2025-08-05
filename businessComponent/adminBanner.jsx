import { useEffect, useState, useRef } from "react";
import styles from "./adminBanner.module.css";
import { db, storage } from "../src/hooks/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "../src/hooks/firebase";
import bannerFallback from "../src/images/banner.jpeg";
import { motion, AnimatePresence } from "framer-motion";

const Banner = ({ showEdit = false }) => {
  const [bannerData, setBannerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formState, setFormState] = useState({
    image: "",
    mainText: "",
    subText: "",
    extraText: "",
    darkOverlay: true,
    align: "left"
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const businessId = userDoc.data()?.businessId;
        if (!businessId) return;

        const bizDoc = await getDoc(doc(db, "businesses", businessId));
        const topBanner = bizDoc.data()?.layoutThemes?.topBanner || {};

        setBannerData(topBanner);
        setFormState({
          image: topBanner.image || "",
          mainText: topBanner.mainText || "",
          subText: topBanner.subText || "",
          extraText: topBanner.extraText || "",
          darkOverlay: topBanner.darkOverlay !== false,
          align: topBanner.align || "left"
        });
        setImagePreview(topBanner.image || "");
      } catch (err) {
        console.error("Error loading banner:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const businessId = userDoc.data()?.businessId;
      if (!businessId) return;

      let imageUrl = formState.image;

      // If a new image file is selected, upload it to Firebase Storage
      if (imageFile) {
        const storageRef = ref(
          storage,
          `banners/${businessId}/banner_${Date.now()}_${imageFile.name}`
        );
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const bannerRef = doc(db, "businesses", businessId);
      const updatedBanner = {
        ...formState,
        image: imageUrl
      };

      await updateDoc(bannerRef, {
        "layoutThemes.topBanner": updatedBanner
      });

      setBannerData(updatedBanner);
      setEditMode(false);
      setImageFile(null);
    } catch (err) {
      console.error("Failed to update banner:", err);
    } finally {
      setSaving(false);
    }
  };

  const bannerImage = bannerData?.image || bannerFallback;

  // Helper for text alignment styles
  const getTextAlignStyles = (align) => {
    if (align === "center") {
      return {
        width: "100%",
        textAlign: "center",
        left: "50%",
        right: "auto",
        transform: "translate(-50%, -50%)"
      };
    }
    if (align === "right") {
      return {
        textAlign: "right",
        left: "auto",
        right: "5%",
        transform: "translateY(-50%)"
      };
    }
    // Default: left
    return {
      textAlign: "left",
      left: "5%",
      right: "auto",
      transform: "translateY(-50%)"
    };
  };

  // Open file dialog when edit icon is clicked
  const handleEditImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={styles.bannerWrapper}>
      {loading ? (
        <div className={styles.loading}>
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>
      ) : (
        <div className={styles.banner}>
          <div className={styles.bannerImg}>
            <img src={bannerImage} alt="banner" />
            {bannerData?.darkOverlay && <div className={styles.darkOverlay}></div>}
            <div
              className={styles.texts}
              style={getTextAlignStyles(bannerData?.align || "left")}
            >
              {bannerData?.mainText && <h1>{bannerData.mainText}</h1>}
              {bannerData?.subText && <p>{bannerData.subText}</p>}
              {bannerData?.extraText && (
                <p className={styles.extraText}>{bannerData.extraText}</p>
              )}
            </div>
          </div>
          {showEdit && (
            <button className={styles.editBtn} onClick={() => setEditMode(true)}>
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {editMode && (
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
          >
            <div className={styles.modalContentModern}>
              <h2 className={styles.modalTitle}>Edit Banner</h2>
              <div className={styles.imageEditSection}>
                <div className={styles.imageEditPreview}>
                  <img
                    src={imagePreview || bannerFallback}
                    alt="Preview"
                    style={{ objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    className={styles.imageEditBtn}
                    onClick={handleEditImageClick}
                    disabled={saving}
                    aria-label="Change banner image"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    disabled={saving}
                    style={{ display: "none" }}
                  />
                </div>
                <span className={styles.imageEditHint}>Change banner image</span>
              </div>
              <div className={styles.formGrid}>
                <label>
                  Main Text
                  <input
                    type="text"
                    value={formState.mainText}
                    onChange={(e) =>
                      setFormState({ ...formState, mainText: e.target.value })
                    }
                    disabled={saving}
                  />
                </label>
                <label>
                  Sub Text
                  <input
                    type="text"
                    value={formState.subText}
                    onChange={(e) =>
                      setFormState({ ...formState, subText: e.target.value })
                    }
                    disabled={saving}
                  />
                </label>
                <label>
                  Extra Text
                  <input
                    type="text"
                    value={formState.extraText}
                    onChange={(e) =>
                      setFormState({ ...formState, extraText: e.target.value })
                    }
                    disabled={saving}
                  />
                </label>
                <label>
                  Text Alignment
                  <select
                    value={formState.align}
                    onChange={(e) =>
                      setFormState({ ...formState, align: e.target.value })
                    }
                    disabled={saving}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formState.darkOverlay}
                    onChange={(e) =>
                      setFormState({ ...formState, darkOverlay: e.target.checked })
                    }
                    disabled={saving}
                  />
                  <span>Show dark overlay</span>
                </label>
              </div>
              <div className={styles.modalActionsModern}>
                <button onClick={handleEditSubmit} disabled={saving}>
                  {saving && (
                    <i
                      className="fa-solid fa-spinner fa-spin"
                      style={{ marginRight: 8 }}
                    ></i>
                  )}
                  Save
                </button>
                <button
                  className={styles.cancelBtnModern}
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                >
                  {saving && (
                    <i
                      className="fa-solid fa-spinner fa-spin"
                      style={{ marginRight: 8 }}
                    ></i>
                  )}
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Banner;
