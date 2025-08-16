import { useEffect, useState } from "react";
import styles from "./business.module.css";
import Navbar from "../businessComponent/navbar";
import { auth, db } from "../src/hooks/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {toast} from "sonner"

const Business = () => {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingSection, setSavingSection] = useState(""); // track section being saved
  const [error, setError] = useState("");

  const user = auth.currentUser;
  const [storeId, setStoreId] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Assume businessId is saved in user profile under custom claim or Firestore users/{uid}
    const fetchUserBiz = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const bizId = userDoc.exists() ? userDoc.data().businessId : null;
        if (bizId) setStoreId(bizId);
      } catch {
        setError("Failed to load user businessId");
      } finally {
        setLoading(false);
      }
    };
    fetchUserBiz();
  }, [user]);

  useEffect(() => {
    if (!storeId) return;
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "businesses", storeId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setBusiness(snap.data());
        } else {
          setError("Business not found");
        }
      } catch (err) {
        setError("Failed to load business data");
      } finally {
        setLoading(false);
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
    if (!business || !storeId) return;
    try {
      setSavingSection(sectionName);
      const docRef = doc(db, "businesses", storeId);
      await updateDoc(docRef, fields);
      toast.success(`${sectionName} updated successfully!`);
    } catch {
      toast.success(`Error updating ${sectionName}`);
    } finally {
      setSavingSection("");
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <i className="fa fa-spinner fa-spin"></i>
      </div>
    );
  }
  if (error) return <p className={styles.error}>{error}</p>;
  if (!business) return null;

  return (
    <div className="container">
      <Navbar />
      <div className="displayArea">
        <h2>Business Information</h2>

        <div className={styles.section}>

             {/* Business ID + Email (readonly) */}
        <div className={styles.inputGroup}>
            <i class="fa-solid fa-id-card-clip"></i>
         <input
            type="text"
            value={business.businessId}
            disabled
            placeholder="Business ID"
          />
        </div>

        <div className={styles.inputGroup}>
            <i class="fa-solid fa-envelope"></i>
             <input
            type="email"
            value={business.businessEmail}
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
              value={business.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="Business Name"
            />
          </div>
          <div className={styles.btnArea}>
             <button
            onClick={() =>
              saveSection({ businessName: business.businessName }, "Business Name")
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

        {/* Main Contact */}
        <div className={styles.section}>
          <div className={styles.inputGroup}>
            <i className="fa fa-phone"></i>
            <select
              value={business.mainContactPlatform}
              onChange={(e) => handleChange("mainContactPlatform", e.target.value)}
            >
              <option value="">Select Platform</option>
              <option value="Whatsapp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>

          {business.mainContactPlatform && (
            <div className={styles.inputGroup}>
              <i className="fa fa-link"></i>
              <input
                type={business.mainContactPlatform === "Whatsapp" ? "tel" : "url"}
                value={business.mainContactValue}
                onChange={(e) => handleChange("mainContactValue", e.target.value)}
                placeholder={
                  business.mainContactPlatform === "Whatsapp"
                    ? "Enter phone number"
                    : "Enter profile link"
                }
              />
            </div>
          )}

 <div className={styles.btnArea}>
<button
            onClick={() =>
              saveSection(
                {
                  mainContactPlatform: business.mainContactPlatform,
                  mainContactValue: business.mainContactValue,
                },
                "Main Contact"
              )
            }
            disabled={savingSection === "Main Contact"}
          >
            {savingSection === "Main Contact" ? (
              <i className="fa fa-spinner fa-spin"></i>
            ) : (
              "Save"
            )}
          </button>
 </div>
        </div>

        {/* Other Info */}
        <div className={styles.section}>
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
            onClick={() => saveSection({ otherInfo: business.otherInfo }, "Other Info")}
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
