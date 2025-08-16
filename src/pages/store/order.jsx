import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Receipt from "./components/reciept";

import Navbar from "./components/navbar";
import Footer from "./components/footer";
import styles from "./order.module.css";

import useStoreTheme from "../../hooks/useStoreTheme";
import fallback from "../../images/no_bg.png";

const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const applyThemeToRoot = (primary, secondary) => {
  document.documentElement.style.setProperty("--storePrimary", primary || DEFAULT_PRIMARY);
  document.documentElement.style.setProperty("--storeSecondary", secondary || DEFAULT_SECONDARY);
};

const Order = ({ storeId: propStoreId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const storeId = propStoreId || params.storeid;
  const orderId =  params.orderId;

  const { biz, loading, error } = useStoreTheme(storeId);

  useEffect(() => {
    if (!storeId) navigate("/");
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
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32 }}></i>
      </div>
    );
  }

  if (!biz) return null;

  const title = `${biz.businessName || "Minimart Store"} - Order`;
  const description = biz.otherInfo?.description || "Track your orders and view status";
  const logo = biz.customTheme.logo || fallback;
  const url = `https://${storeId}.minimart.ng/order`;
 
  return (
    <div className={styles.interface}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={logo} />
        <meta property="og:url" content={url} />
        <meta name="theme-color" content={biz.customTheme?.primaryColor || DEFAULT_PRIMARY} />
        <link rel="icon" type="image/png" href={logo}/>
      </Helmet>
      <Navbar storeId={storeId} />
    
     <Receipt  storeId={storeId} orderId={orderId} showInfo={true}/>

      <Footer storeId={storeId} />
    </div>
  );
};

export default Order;
