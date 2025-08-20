import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Receipt from "./components/reciept";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import styles from "./order.module.css";

import useStoreTheme from "../../hooks/useStoreTheme";
import fallback from "../../images/no_bg.png";

import { db } from "../../hooks/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import axios from "axios";
import { toast } from "sonner";

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
  const orderId = params.orderId;

  const { biz, loading, error } = useStoreTheme(storeId);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [orderSaved, setOrderSaved] = useState(false);
  const [savingOrder, setSavingOrder] = useState(true); // NEW: track saving/loading

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
  }, [error, navigate]);

  // 🔑 Verify payment and sync order
  useEffect(() => {
    const verifyPaymentAndSaveOrder = async () => {
      setSavingOrder(true); // Start loading
      try {
        const res = await axios.get(
          `https://minimart-backend.vercel.app/api/paystack/verify/${orderId}`
        );
        const paystackData = res.data?.data;

        let newStatus = "declined";
        if (paystackData?.status === "success") {
          newStatus = "paid";
        } else if (paystackData?.status === "pending") {
          newStatus = "pending";
        }

        setPaymentStatus(newStatus);

        // 🔍 Check if order already exists
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
          // --- Reconstruct products and total price from cart ---
          const cartKey = `cart_${storeId}`;
          const cartObj = JSON.parse(localStorage.getItem(cartKey)) || {};
          const bizProducts = Array.isArray(biz?.products) ? biz.products : [];
          const products = Object.entries(cartObj).map(([prodId, qty]) => {
            const prod = bizProducts.find(p => p.prodId === prodId);
            if (!prod) return null;
            return {
              prodId,
              name: prod.name,
              price: prod.price,
              quantity: qty,
            };
          }).filter(Boolean);
          const amount = products.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          // --- Save order with products and amount ---
          await setDoc(orderRef, {
            orderId,
            storeId,
            date: new Date().toISOString(),
            status: newStatus,
            paymentInfo: paystackData || null,
            products,
            amount,
          });

          // Push to business orders + notifications
          const bizRef = doc(db, "businesses", storeId);
          await updateDoc(bizRef, {
            orders: arrayUnion({ orderId, date: new Date().toISOString() }),
            notifications: arrayUnion({
              date: new Date().toISOString(),
              link: `/orders/order/${orderId}`,
              read: false,
              text: `New order ${orderId} has been placed`,
            }),
          });
        } else {
          // --- Update existing order ---
          await updateDoc(orderRef, {
            status: newStatus,
            paymentInfo: paystackData || null,
            updatedAt: new Date().toISOString(),
          });
        }

        // 🎯 Clear localStorage if successful
        if (newStatus === "paid") {
          localStorage.removeItem(`cart_${storeId}`);
          localStorage.removeItem(`checkout_${storeId}`);
        }

        setOrderSaved(true); // Only show receipt after order is saved
      } catch (err) {
        console.error("Payment verification failed", err);
        setPaymentStatus("declined");

        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
          status: "declined",
          updatedAt: new Date().toISOString(),
        });

        setOrderSaved(true); // Still allow status page to show
      } finally {
        setSavingOrder(false); // Done loading
      }
    };

    if (orderId && biz) verifyPaymentAndSaveOrder();
  }, [orderId, storeId, biz]);

  // Show spinner while loading store or saving order
  if (loading || savingOrder) {
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
  const description =
    biz.otherInfo?.description || "Track your orders and view status";
  const logo = biz.customTheme?.logo || fallback;
  const url = `https://${storeId}.minimart.ng/order/${orderId}`;

  return (
    <div className={styles.interface}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={logo} />
        <meta property="og:url" content={url} />
        <meta
          name="theme-color"
          content={biz.customTheme?.primaryColor || DEFAULT_PRIMARY}
        />
        <link rel="icon" type="image/png" href={logo} />
      </Helmet>

      <Navbar storeId={storeId} />

      {orderSaved && paymentStatus === "paid" ? (
        <Receipt storeId={storeId} orderId={orderId} showInfo={true} status={paymentStatus} />
      ) : (
        <div className={styles.orderStatus}>
          {orderSaved && paymentStatus === "declined" ? (
            <>
              <i className="fa-solid fa-circle-xmark" style={{ fontSize: 64, color: "red" }}></i>
              <p>Your order was declined. Please try again.</p>
              <button
                onClick={() => navigate(`/checkout/${orderId}`)}
                className={styles.retryBtn}
              >
                Retry Payment
              </button>
            </>
          ) : null}
        </div>
      )}

      <Footer storeId={storeId} />
    </div>
  );
};

export default Order;
