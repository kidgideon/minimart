import { useEffect, useState } from "react";
import { ChromePicker } from "react-color";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./appearance.module.css";
import Navbar from "../businessComponent/navbar";
import Banner from "../businessComponent/adminBanner";
import MidBannerOne from "../businessComponent/midBannerOne";
import { auth, db, storage } from "../src/hooks/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import Logo from "../src/images/logo.png";
import { toast } from "sonner";

// Lightness calculation
function hexToLightness(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  return ((max + min) / 2) * 100;
}

const MAX_PRIMARY_LIGHTNESS = 50;
const MAX_SECONDARY_LIGHTNESS = 85;

const Appearance = () => {
  const [businessId, setBusinessId] = useState(null);
  const [logoUrl, setLogoUrl] = useState(Logo);
  const [primaryColor, setPrimaryColor] = useState("#1C2230");
  const [secondaryColor, setSecondaryColor] = useState("#43B5F4");
  const [showColorModal, setShowColorModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1 = primary, 2 = secondary

  // Auth -> get businessId
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setBusinessId(userDoc.data().businessId || null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch theme
  useEffect(() => {
    if (!businessId) return;
    const fetchTheme = async () => {
      try {
        const snap = await getDoc(doc(db, "businesses", businessId));
        if (!snap.exists()) return;
        const theme = snap.data().customTheme || {};
        setLogoUrl(theme.logo || Logo);
        setPrimaryColor(theme.primaryColor || "#1C2230");
        setSecondaryColor(theme.secondaryColor || "#43B5F4");
      } catch (err) {
        console.error("Error fetching theme:", err);
      }
    };
    fetchTheme();
  }, [businessId]);

  // Logo change
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

    const fileRef = ref(storage, `logos/${businessId}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      null,
      () => toast.error("Logo upload failed"),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await updateDoc(doc(db, "businesses", businessId), {
          "customTheme.logo": url,
        });
        setLogoUrl(url);
        toast.success("Logo updated!");
      }
    );
  };

  // Validation
  const validatePrimary = (color) => {
    const l = hexToLightness(color);
    if (color.toLowerCase() === "#ffffff") {
      toast.error("Primary cannot be white");
      return false;
    }
    if (l > MAX_PRIMARY_LIGHTNESS) {
      toast.error(`Primary too light (max ${MAX_PRIMARY_LIGHTNESS})`);
      return false;
    }
    return true;
  };

  const validateSecondary = (color) => {
    const primaryLight = hexToLightness(primaryColor);
    const l = hexToLightness(color);
    if (color.toLowerCase() === "#ffffff") {
      toast.error("Secondary cannot be white");
      return false;
    }
    if (l <= primaryLight) {
      toast.error("Secondary must be lighter than primary");
      return false;
    }
    if (l > MAX_SECONDARY_LIGHTNESS) {
      toast.error(`Secondary too light (max ${MAX_SECONDARY_LIGHTNESS})`);
      return false;
    }
    return true;
  };

  // Step navigation
  const nextPrimary = () => {
    if (!validatePrimary(primaryColor)) return;
    setStep(2);
  };
  const backSecondary = () => setStep(1);

  const handleSaveColors = async () => {
    if (!validatePrimary(primaryColor) || !validateSecondary(secondaryColor)) return;

    try {
      setSaving(true);
      await updateDoc(doc(db, "businesses", businessId), {
        "customTheme.primaryColor": primaryColor,
        "customTheme.secondaryColor": secondaryColor,
      });
      document.documentElement.style.setProperty("--primary-color", primaryColor);
      document.documentElement.style.setProperty("--secondary-color", secondaryColor);
      toast.success("Theme colors updated!");
      setShowColorModal(false);
      setStep(1);
    } catch (err) {
      toast.error("Failed to update colors");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <Navbar />
      <div className="displayArea">
        <p className={styles.pageTitle}>
          <i className="fa-solid fa-palette"></i> Store Appearance
        </p>

        <div className={styles.interface}>
          <div className={styles.logoArea}>
            <div className={styles.imageArea}>
              <img src={logoUrl} alt="Logo" />
              <label className={styles.editBtn}>
                <i className="fa-solid fa-pen-to-square"></i>
                <input
                  type="file"
                  onChange={handleLogoChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <div className={styles.colorArea}>
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <p>Primary</p>
                  <div
                    style={{
                      width: 60,
                      height: 30,
                      borderRadius: 6,
                      background: primaryColor,
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <p>Secondary</p>
                  <div
                    style={{
                      width: 60,
                      height: 30,
                      borderRadius: 6,
                      background: secondaryColor,
                      border: "1px solid #ccc",
                    }}
                  />
                </div>
              </div>
              <button className={styles.editBtn} onClick={() => setShowColorModal(true)}>
                <i className="fa-solid fa-pen-to-square"></i>
              </button>
            </div>
          </div>

          <p className={styles.storeText}>store banner</p>
          <Banner showEdit={true} />
          {/* <MidBannerOne showEdit={true} /> */}

       {showColorModal && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h3>Choose your theme colors</h3>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="primary"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <label>Primary Color</label>
            <div className={styles.colorPickerArea}>
              <ChromePicker
                className={styles.pickerColor}
                color={primaryColor}
                onChange={(c) => setPrimaryColor(c.hex)}
              />
            </div>
            <p className={styles.warningText}>
              Pick a dark primary color. Leave default if unsure.
            </p>
            <div className={styles.btnArea}>
              <button className={styles.nextBn} onClick={nextPrimary}>
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="secondary"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <label>Secondary Color</label>
            <div className={styles.colorPickerArea}>
              <ChromePicker
                className={styles.pickerColor}
                color={secondaryColor}
                onChange={(c) => setSecondaryColor(c.hex)}
              />
            </div>
            <p className={styles.warningText}>
              Pick a secondary color lighter than primary. Avoid too light. Leave default if unsure.
            </p>
            <div className={styles.btnArea}>
              <button  className={styles.backBtn} onClick={backSecondary}>← Back</button>
              <button className={styles.saveBtnS} onClick={handleSaveColors} disabled={saving}>
                {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : "Save"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.btnAreaEnd}>
        <button
          onClick={() => { setShowColorModal(false); setStep(1); }}
          className={styles.cancelBtn}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default Appearance;
