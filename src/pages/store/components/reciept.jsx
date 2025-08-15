import { useEffect, useState, useRef } from "react";
import styles from "./reciept.module.css";
import Navbar from "./navbar";
import Footer from "./footer";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../hooks/firebase";
import { toPng } from "html-to-image";
import fallback from "../../../images/no_bg.png";

const statusMap = {
  pending: { color: "#000000ff", icon: "fa-solid fa-hourglass-half", label: "Pending" },
  successful: { color: "#000000ff", icon: "fa-solid fa-check", label: "Successful" },
  declined: { color: "#000000ff", icon: "fa-solid fa-circle-xmark", label: "Declined" },
};

const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const Receipt = ({ storeId, orderId }) => {
  const [biz, setBiz] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bizSnap = await getDoc(doc(db, "businesses", storeId));
        const orderSnap = await getDoc(doc(db, "orders", orderId));

        if (bizSnap.exists()) setBiz(bizSnap.data());
        if (orderSnap.exists()) setOrder(orderSnap.data());
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId, orderId]);

  const formatDate = (value) => {
    if (!value) return "";
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    const dataUrl = await toPng(receiptRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      quality: 1,
      canvasWidth: receiptRef.current.offsetWidth * 3,
      canvasHeight: receiptRef.current.offsetHeight * 3
    });

    const link = document.createElement("a");
    link.download = `receipt-${orderId}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share && receiptRef.current) {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        quality: 1,
        canvasWidth: receiptRef.current.offsetWidth * 3,
        canvasHeight: receiptRef.current.offsetHeight * 3
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `receipt-${orderId}.png`, { type: "image/png" });

      try {
        await navigator.share({
          title: `Receipt from ${biz?.businessName}`,
          files: [file],
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      alert("Sharing not supported on this device");
    }
  };


  if (loading) {
    return (
      <div className={styles.interface}>
        <Navbar storeId={storeId} />
        <div className={styles.loading}>Loading receipt...</div>
        <Footer storeId={storeId} />
      </div>
    );
  }

  if (!biz || !order) {
    return (
      <div className={styles.interface}>
        <Navbar storeId={storeId} />
        <div className={styles.error}>Receipt not found.</div>
        <Footer storeId={storeId} />
      </div>
    );
  }

  const statusData = statusMap[order.status?.toLowerCase()] || { color: "#ccc", icon: "", label: order.status };

  return (
    <div
      className={styles.interface}
      style={{
        '--storeP': biz?.customTheme?.primaryColor || DEFAULT_PRIMARY,
        '--storeS': biz?.customTheme?.secondaryColor || DEFAULT_SECONDARY,
      }}
    >
      <Navbar storeId={storeId} />

      <div className={styles.receiptContainer}>
        <div  ref={receiptRef} className={styles.receiptWrapper}>
         <div className={styles.receiptTop}></div>
     {/* Watermark */}
<div className={styles.watermark} >
  <img src={biz.customTheme.logo || fallback} alt="Logo" className={styles.logo} />
</div>


          <div className={styles.receipt}>
            {/* HEADER */}
            <div className={styles.top}>
 <div className={styles.header}>
   <div className={styles.imgDiv}><img src={biz.customTheme.logo || fallback} alt="Logo" className={styles.logo} /></div>
              <p className={styles.bizName}>{biz.businessName}</p>
              <p className={styles.bizEmail}>{biz.businessEmail}</p>
            </div>

            {/* ORDER INFO */}
            <div className={styles.meta}>
              <div>{formatDate(order.date)}</div>
              <div> {orderId}</div>
              <div className={styles.status}>
                <i className={statusData.icon} style={{ color: statusData.color, marginRight: "6px" }}></i>
                <p>{statusData.label}</p>
              </div>
            </div>

            </div>
            <hr className={styles.divider} />

            {/* ITEMS */}
            <div className={styles.items}>
              {order.products?.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <div className={styles.itemName}>
                    {item.name} <small>(x{item.quantity})</small>
                  </div>
                  <div className={styles.itemPrice}>₦{item.price.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div className={styles.total}>
              <strong>Total:</strong>
              <strong>₦{order.amount.toLocaleString()}</strong>
            </div>

            <hr className={styles.divider} />

            <div >
 {/* CUSTOMER INFO */}
            {order.user && (
              <div className={styles.customer}>
                <h3>Customer</h3>
                <p>{order.user.fullName}</p>
                <p>{order.user.phoneNumber}</p>
              </div>
            )}

            <div className={styles.receiptFooter}>
              Thank you for shopping with {biz.businessName}
            </div>
            </div>
          </div>

            <div className={styles.receiptBottom}></div>
        </div>

        {/* ACTIONS */}
        <div className={styles.actions}>
          <button onClick={handleDownload}>Download</button>
          <button onClick={handleShare}>Share</button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
