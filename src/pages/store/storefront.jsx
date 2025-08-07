import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import Navbar from "./components/navbar";
import Banner from "./components/banner";
import Menu from "./components/menu";
import Featured from "./components/featured";
import Latest from "./components/latest";
import Products from "./components/products";
import Services from "./components/services";
import Footer from "./components/footer";
import styles from "./storefront.module.css";
import useStoreTheme from "../../hooks/useStoreTheme";

const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const applyThemeToRoot = (primary, secondary) => {
  document.documentElement.style.setProperty("--storePrimary", primary || DEFAULT_PRIMARY);
  document.documentElement.style.setProperty("--storeSecondary", secondary || DEFAULT_SECONDARY);
};

const Storefront = ({ storeId: propStoreId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const storeId = propStoreId || params.storeid;

  const { biz, loading, error } = useStoreTheme(storeId);

  useEffect(() => {
    if (!storeId) {
      navigate("/");
    }
  }, [storeId]);

  useEffect(() => {
    if (biz) {
      const primary = biz.customTheme?.primaryColor?.trim() || DEFAULT_PRIMARY;
      const secondary = biz.customTheme?.secondaryColor?.trim() || DEFAULT_SECONDARY;
      applyThemeToRoot(primary, secondary);
    }
  }, [biz]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load store.");
      navigate("/");
    }
  }, [error]);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", width: "100%"}}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32 }}></i>
      </div>
    );
  }

  if (!biz) return null;

  return (
    <div storeid={storeId} className={styles.storeInterface}>
      <Navbar storeId={storeId} />
      <Banner storeId={storeId} />
      <Menu storeId={storeId} />
      <Featured storeId={storeId} />
      <Latest storeId={storeId} />
      <Products storeId={storeId} />
      <Services storeId={storeId} />
      <Footer storeId={storeId} />
    </div>
  );
};

export default Storefront;
