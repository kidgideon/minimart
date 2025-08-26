import { useEffect, useState } from "react";
import styles from "./appearance.module.css";
import Navbar from "../businessComponent/navbar";
import Banner from "../businessComponent/adminBanner";
import MidBannerOne from "../businessComponent/midBannerOne";
import { auth, db, storage } from "../src/hooks/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import Logo  from  "../src/images/no_bg.png";
import { toast } from "sonner";

const Appearance = () => {
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [showColorModal, setShowColorModal] = useState(false);
  const [businessId, setBusinessId] = useState(null);

  // Fetch user → businessId → business customTheme
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        // 1. Get user document
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const bizId = userData.businessId;
        if (!bizId) return;

        setBusinessId(bizId);

        // 2. Get business document
        const businessDoc = await getDoc(doc(db, "businesses", bizId));
        if (!businessDoc.exists()) return;

        const bizData = businessDoc.data();
        const theme = bizData.customTheme || {};

        setLogoUrl(theme.logo || Logo);
        setPrimaryColor(theme.primaryColor || "#223016");
        setSecondaryColor(theme.secondaryColor || "#578c51");

      } catch (error) {
        console.error("Error fetching theme:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
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

  const saveColors = async () => {
    if (!businessId) return;
    try {
      await updateDoc(doc(db, "businesses", businessId), {
        "customTheme.primaryColor": primaryColor,
        "customTheme.secondaryColor": secondaryColor,
      });

      document.documentElement.style.setProperty("--primary-color", primaryColor);
      document.documentElement.style.setProperty("--secondary-color", secondaryColor);
      toast.success("Theme colors updated!");
      setShowColorModal(false);
    } catch (error) {
      toast.error("Failed to update colors");
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
          {/* Logo and color area */}
          <div className={styles.logoArea}>
            <div className={styles.imageArea}>
              <img src={logoUrl || Logo} alt="Logo" />
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
                  ></div>
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
                  ></div>
                </div>
              </div>
              <button className={styles.editBtn} onClick={() => setShowColorModal(true)}>
                <i className="fa-solid fa-pen-to-square"></i>
              </button>
            </div>
          </div>

          {/* Banner sections */}
          <p className={styles.storeText}>store banner</p>
          <Banner showEdit={true} />
          <MidBannerOne showEdit={true} />

          {/* Color picker modal */}
          {showColorModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <h3>Choose your theme colors</h3>
                <p className={styles.warningText}>
                  ⚠️ Make sure your primary color is dark, classy, and complements your logo.
                  Your secondary color should be lighter and blend well. If unsure, stick to default.
                </p>
                <div className={styles.pickers}>
                  <div>
                    <label>Primary Color</label>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Secondary Color</label>
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.modalActions}>
                  <button onClick={saveColors} className={styles.saveBtn}>
                    Save
                  </button>
                  <button onClick={() => setShowColorModal(false)} className={styles.cancelBtn}>
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
