// pages/store/Storefront.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../hooks/firebase"; // adjust path if needed
import { toast } from "sonner";
import Navbar from "./components/navbar";
import Banner from "./components/banner";
import Menu from "./components/menu";
import Featured from "./components/featured";
import styles from "./storefront.module.css"
import Latest from "./components/latest";
import Products from "./components/products";
import Services from "./components/services";
import Footer from "./components/footer";

const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const applyThemeToRoot = (primary, secondary) => {
  document.documentElement.style.setProperty("--storePrimary", primary || DEFAULT_PRIMARY);
  document.documentElement.style.setProperty("--storeSecondary", secondary || DEFAULT_SECONDARY);
};

const Storefront = ({ storeId: propStoreId }) => {
  const navigate = useNavigate();
  const params = useParams();
  // support both subdomain and /store/:storeId path
  const storeId = propStoreId || params.storeid;
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    if (!storeId) {
      navigate("/");
      return;
    }

    const fetch = async () => {
      try {
        const bizRef = doc(db, "businesses", storeId);
        const snap = await getDoc(bizRef);
        if (!snap.exists()) {
          toast.error("Store not found.");
          navigate("/");
          return;
        }
        const data = snap.data();
        setBusiness(data);

        // Determine theme colors: if pro with colors, use theirs; else fallback to defaults
        let primary = DEFAULT_PRIMARY;
        let secondary = DEFAULT_SECONDARY;

        if (data.plan?.plan === "pro" && data.customTheme) {
          if (data.customTheme.primaryColor?.trim()) primary = data.customTheme.primaryColor;
          if (data.customTheme.secondaryColor?.trim()) secondary = data.customTheme.secondaryColor;
        }

        applyThemeToRoot(primary, secondary);
      } catch (err) {
        console.error("Error loading storefront:", err);
        toast.error("Failed to load store.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [storeId, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32 }}></i>
      </div>
    );
  }

  if (!business) return null; // redirection already handled

  return (
    <div storeId={storeId} className={styles.storeInterface}>
      {/* Example usage: show store name */}
      <Navbar storeId={storeId}/>
      <Banner storeId={storeId}/>
      <Menu storeId={storeId}/>
      <Featured storeId={storeId}/>
      <Latest storeId={storeId}/>
      <Products storeId={storeId}/>
      <Services storeId={storeId}/>
      <Footer storeId={storeId}/>
    </div>
  );
};

export default Storefront;
