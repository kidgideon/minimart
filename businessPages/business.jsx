import { useEffect, useState } from "react";
import styles from "./business.module.css";
import Navbar from "../businessComponent/navbar";
import { auth, db } from "../src/hooks/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

const Business = () => {
  const [business, setBusiness] = useState({});
  const [loadingData, setLoadingData] = useState(true); // still track fetching internally
  const [savingSection, setSavingSection] = useState("");
  const [error, setError] = useState("");

  const user = auth.currentUser;
  const [storeId, setStoreId] = useState(null);

  // Fetch businessId from user
  useEffect(() => {
    if (!user) return;
    const fetchUserBiz = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const bizId = userDoc.exists() ? userDoc.data().businessId : null;
        if (bizId) setStoreId(bizId);
      } catch {
        setError("Failed to load user businessId");
      }
    };
    fetchUserBiz();
  }, [user]);

  // Fetch business data
  useEffect(() => {
    if (!storeId) return;
    const fetchBusiness = async () => {
      try {
        const docRef = doc(db, "businesses", storeId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setBusiness(snap.data());
        } else {
          setError("Business not found");
        }
      } catch {
        setError("Failed to load business data");
      } finally {
        setLoadingData(false);
      }
    };
    fetchBusiness();
  }, [storeId]);

  const handleChange = (field, value) => {
    setBusiness((prev) => ({ ...prev, [field]: value }));
  };

  const handleOtherInfoChange = (field, value) => {
    setBusiness((prev) => ({
      ...prev,
      otherInfo: { ...prev.otherInfo, [field]: value },
    }));
  };

  const saveSection = async (fields, sectionName) => {
    if (!storeId) return;
    try {
      setSavingSection(sectionName);
      const docRef = doc(db, "businesses", storeId);
      await updateDoc(docRef, fields);
      toast.success(`${sectionName} updated successfully!`);
    } catch {
      toast.error(`Error updating ${sectionName}`);
    } finally {
      setSavingSection("");
    }
  };

  return (
    <div className="container">
      <Navbar />
      <div className="displayArea">
        <h2>Business Information</h2>
        {error && <p className={styles.error}>{error}</p>}

        {/* Business ID + Email (readonly) */}
        <div className={styles.section}>
          <div className={styles.inputGroup}>
            <i className="fa-solid fa-id-card-clip"></i>
            <input
              type="text"
              value={business.businessId || ""}
              disabled
              placeholder="Business ID"
            />
          </div>
          <div className={styles.inputGroup}>
            <i className="fa-solid fa-envelope"></i>
            <input
              type="email"
              value={business.businessEmail || ""}
              disabled
              placeholder="Business Email"
            />
          </div>
        </div>

        {/* Business Name */}
        <div className={styles.section}>
          <div className={styles.inputGroup}>
            <i className="fa fa-briefcase"></i>
            <input
              type="text"
              value={business.businessName || ""}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="Business Name"
            />
          </div>
          <div className={styles.btnArea}>
            <button
              onClick={() =>
                saveSection({ businessName: business.businessName || "" }, "Business Name")
              }
              disabled={savingSection === "Business Name"}
            >
              {savingSection === "Business Name" ? (
                <i className="fa fa-spinner fa-spin"></i>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>

        {/* Contact & Social Links */}
        <div className={styles.section}>
          <h3>Contact & Social Links</h3>

          {/* WhatsApp - required */}
          <div className={styles.inputGroup}>
            <i class="fa-brands fa-whatsapp"></i>
            <input
              type="tel"
              value={business.whatsappNumber || ""}
              onChange={(e) => handleChange("whatsappNumber", e.target.value)}
              placeholder="WhatsApp Number (required)"
              required
            />
          </div>

          {/* Instagram */}
          <div className={styles.inputGroup}>
           <i class="fa-brands fa-instagram"></i>
            <input
              type="url"
              value={business.instagramLink || ""}
              onChange={(e) => handleChange("instagramLink", e.target.value)}
              placeholder="Instagram Profile Link"
            />
          </div>

          {/* YouTube */}
          <div className={styles.inputGroup}>
          <i class="fa-brands fa-youtube"></i>
            <input
              type="url"
              value={business.youtubeLink || ""}
              onChange={(e) => handleChange("youtubeLink", e.target.value)}
              placeholder="YouTube Profile Link"
            />
          </div>

          {/* TikTok */}
          <div className={styles.inputGroup}>
           <i class="fa-brands fa-tiktok"></i>
            <input
              type="url"
              value={business.tikTokLink || ""}
              onChange={(e) => handleChange("tikTokLink", e.target.value)}
              placeholder="TikTok Profile Link"
            />
          </div>

          <div className={styles.btnArea}>
            <button
              onClick={() =>
                saveSection(
                  {
                    whatsappNumber: business.whatsappNumber || "",
                    instagramLink: business.instagramLink || "",
                    youtubeLink: business.youtubeLink || "",
                    tikTokLink: business.tikTokLink || "",
                  },
                  "Contact & Social Links"
                )
              }
              disabled={savingSection === "Contact & Social Links"}
            >
              {savingSection === "Contact & Social Links" ? (
                <i className="fa fa-spinner fa-spin"></i>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>

        {/* Other Info */}
        <div className={styles.section}>
          <h3>Other Information</h3>

          <div className={styles.inputGroup}>
            <i className="fa fa-info-circle"></i>
            <input
              type="text"
              value={business.otherInfo?.description || ""}
              onChange={(e) => handleOtherInfoChange("description", e.target.value)}
              placeholder="Description"
            />
          </div>

          <div className={styles.inputGroup}>
            <i className="fa fa-map-marker-alt"></i>
            <input
              type="text"
              value={business.otherInfo?.storeLocation || ""}
              onChange={(e) => handleOtherInfoChange("storeLocation", e.target.value)}
              placeholder="Store Location"
            />
          </div>

          <div className={styles.inputGroup}>
            <i className="fa fa-shipping-fast"></i>
            <input
              type="text"
              value={business.otherInfo?.shippingInformation || ""}
              onChange={(e) =>
                handleOtherInfoChange("shippingInformation", e.target.value)
              }
              placeholder="Shipping Information"
            />
          </div>

          <div className={styles.inputGroup}>
            <i className="fa fa-phone-alt"></i>
            <input
              type="tel"
              value={business.otherInfo?.phoneNumber || ""}
              onChange={(e) => handleOtherInfoChange("phoneNumber", e.target.value)}
              placeholder="Phone Number"
            />
          </div>

          {/* Opening Hours */}
          <div className={styles.inputGroup}>
            <label>Opening Hours</label>
            <input style={{margin: "10px 0px"}}
              type="time"
              value={business.otherInfo?.openingHours?.from || ""}
              onChange={(e) =>
                handleOtherInfoChange("openingHours", {
                  ...business.otherInfo?.openingHours,
                  from: e.target.value,
                })
              }
            />
            <input
              type="time"
              value={business.otherInfo?.openingHours?.to || ""}
              onChange={(e) =>
                handleOtherInfoChange("openingHours", {
                  ...business.otherInfo?.openingHours,
                  to: e.target.value,
                })
              }
            />
          </div>

          <div className={styles.btnArea}>
            <button
              onClick={() => saveSection({ otherInfo: business.otherInfo || {} }, "Other Info")}
              disabled={savingSection === "Other Info"}
            >
              {savingSection === "Other Info" ? (
                <i className="fa fa-spinner fa-spin"></i>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Business;
