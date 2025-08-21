// src/pages/store/components/reciept.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./reciept.module.css";
import Navbar from "./navbar";
import Footer from "./footer";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../hooks/firebase";
import { toPng } from "html-to-image";
import fallback from "../../../images/no_bg.png";
import { toast } from "sonner";

const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const CONTACT_ICONS = {
  whatsapp: "fa-brands fa-whatsapp",
  facebook: "fa-brands fa-facebook",
  instagram: "fa-brands fa-instagram",
  tiktok: "fa-brands fa-tiktok",
};

// Map any backend variants into 3 canonical UI states
function normalizeStatus(raw) {
  const v = String(raw || "").toLowerCase();
  if (["success", "successful", "paid"].includes(v)) return "successful";
  if (["failed", "declined", "cancelled"].includes(v)) return "declined";
  return "pending";
}

const STATUS_META = {
  pending:    { color: "#666", icon: "fa-solid fa-hourglass-half", label: "Pending" },
  successful: { color: "#12B76A", icon: "fa-solid fa-check",        label: "Successful" },
  declined:   { color: "#E11D48", icon: "fa-solid fa-circle-xmark", label: "Declined" },
};

const numberFmt = (currencyCode = "NGN", locale = "en-NG") =>
  new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode, maximumFractionDigits: 2 });

const formatDate = (value) => {
  if (!value) return "";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const Receipt = ({ storeId, orderId, showInfo }) => {
  const [biz, setBiz] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgBusy, setImgBusy] = useState(false);
  const receiptRef = useRef(null);

  // Fetch Business + Order (with crash-proof guards)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (!storeId || !orderId) {
          setLoading(false);
          return;
        }

        const [bizSnap, orderSnap] = await Promise.all([
          getDoc(doc(db, "businesses", storeId)),
          getDoc(doc(db, "orders", orderId)),
        ]);

        if (!alive) return;

        if (bizSnap.exists()) setBiz(bizSnap.data());
        if (orderSnap.exists()) setOrder(orderSnap.data());
      } catch (err) {
        console.error("Receipt fetch error:", err);
        toast.error("Unable to load receipt. Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [storeId, orderId]);

  // Derived theming
  const themeVars = useMemo(() => {
    const primary = biz?.customTheme?.primaryColor?.trim() || DEFAULT_PRIMARY;
    const secondary = biz?.customTheme?.secondaryColor?.trim() || DEFAULT_SECONDARY;
    return { "--storeP": primary, "--storeS": secondary };
  }, [biz]);

  // Currency formatter (fallback to NGN)
  const currencyCode = useMemo(() => {
    // If you save an explicit ISO currency code on business, prefer it.
    // Otherwise fallback to NGN (since you’re processing naira now).
    return biz?.currencyCode || "NGN";
  }, [biz]);

  const formatMoney = useMemo(() => numberFmt(currencyCode), [currencyCode]);

  const statusKey = normalizeStatus(order?.status);
  const statusData = STATUS_META[statusKey] || STATUS_META.pending;

  // Defensive: reconstruct products if missing or not an array
  const reconstructedProducts = useMemo(() => {
    // If order.products is a valid array with items, use it
    if (Array.isArray(order?.products) && order.products.length > 0) {
      return order.products;
    }
    // Defensive fallback: try reconstructing from cart and business products
    if (biz && order?.cart) {
      // order.cart should be an object: { [prodId]: quantity }
      const cartObj = order.cart;
      const bizProducts = Array.isArray(biz.products) ? biz.products : [];
      return Object.entries(cartObj).map(([prodId, qty]) => {
        const prod = bizProducts.find(p => p.prodId === prodId);
        if (!prod) return null;
        return {
          name: prod.name,
          price: prod.price,
          quantity: qty,
        };
      }).filter(Boolean);
    }
    // If nothing, return empty array
    return [];
  }, [order, biz]);

  const safeProducts = reconstructedProducts;
  const safeAmount = Number(order?.amount || 0);

  // Actions
  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      setImgBusy(true);
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `receipt-${orderId}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Receipt downloaded");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to generate image");
    } finally {
      setImgBusy(false);
    }
  };

  const handleShare = async () => {
    if (!navigator.share || !receiptRef.current) {
      toast.info("Sharing is not supported on this device/browser.");
      return;
    }
    try {
      setImgBusy(true);
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `receipt-${orderId}.png`, { type: "image/png" });
      await navigator.share({ title: `Receipt from ${biz?.businessName || "Store"}`, files: [file] });
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Share failed:", err);
        toast.error("Share failed");
      }
    } finally {
      setImgBusy(false);
    }
  };

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast.success("Order ID copied");
    } catch {
      toast.error("Failed to copy Order ID");
    }
  };

  const handleContactClick = () => {
    if (!biz?.mainContactPlatform || !biz?.mainContactValue) return;
    const platform = String(biz.mainContactPlatform).toLowerCase();
    let url = "";
    if (platform === "whatsapp") {
      url = `https://wa.me/${String(biz.mainContactValue).replace(/\D/g, "")}`;
    } else {
      url = String(biz.mainContactValue).startsWith("http")
        ? biz.mainContactValue
        : `https://${biz.mainContactValue}`;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getContactMessage = () => {
    if (statusKey === "successful") {
      return "Your order is approved! Tap to message the business for updates or inquiries.";
    }
    if (statusKey === "declined") {
      return "Your order was declined. Tap to contact the business for clarification.";
    }
    return "Your order is pending. Tap to contact the business now to speed up approval.";
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={styles.interface} style={themeVars}>
        <Navbar storeId={storeId} />
        <div className={styles.receiptContainer} style={{ padding: "32px" }}>
          <div className={styles.receiptWrapper}>
            <div className={styles.receipt} aria-busy="true">
              <div style={{ height: 16, width: "40%", margin: "8px 0", background: "#f3f3f3" }} />
              <div style={{ height: 12, width: "60%", margin: "8px 0", background: "#f3f3f3" }} />
              <div style={{ height: 180, width: "100%", margin: "16px 0", background: "#f3f3f3" }} />
              <div style={{ height: 12, width: "50%", margin: "8px 0", background: "#f3f3f3" }} />
              <div style={{ height: 12, width: "30%", margin: "8px 0", background: "#f3f3f3" }} />
            </div>
          </div>
        </div>
        <Footer storeId={storeId} />
      </div>
    );
  }

  // Hard error state
  if (!biz || !order) {
    return (
      <div className={styles.interface} style={themeVars}>
        <Navbar storeId={storeId} />
        <div className={styles.receiptContainer} style={{ padding: 32, textAlign: "center" }}>
          <i className="fa-regular fa-file-lines" style={{ fontSize: 36, marginBottom: 12 }} />
          <div className={styles.error}>Receipt not found.</div>
        </div>
        <Footer storeId={storeId} />
      </div>
    );
  }

  const logoSrc = biz?.customTheme?.logo || fallback;

  return (
    <div
      className={styles.interface}
      style={themeVars}
    >
      <Navbar storeId={storeId} />

      {showInfo && (
        <>
          {/* Order ID copy */}
          <div className={styles.businessInfo} onClick={handleCopyOrderId} role="button" tabIndex={0}>
            <div className={styles.icon}><i className="fa-solid fa-circle-info" /></div>
            <div className={styles.text}>
              <p>
                This is your Order ID: <strong>{orderId}</strong>. Tap here to copy it for tracking anytime.
              </p>
            </div>
          </div>

          {/* Contact business */}
          <div className={styles.businessInfo} onClick={handleContactClick} role="button" tabIndex={0}>
            <div className={styles.icon}>
              <i className={CONTACT_ICONS[biz?.mainContactPlatform?.toLowerCase()] || "fa-solid fa-circle-info"} />
            </div>
            <div className={styles.text}><p>{getContactMessage()}</p></div>
          </div>
        </>
      )}

      <div className={styles.receiptContainer}>
        <div ref={receiptRef} className={styles.receiptWrapper}>
          <div className={styles.receiptTop} />

          {/* Watermark */}
          <div className={styles.watermark}>
            <img src={logoSrc} alt={`${biz?.businessName || "Store"} watermark`} className={styles.logo} />
          </div>

          <div className={styles.receipt}>
            {/* HEADER */}
            <div className={styles.top}>
              <div className={styles.header}>
                <div className={styles.imgDiv}>
                  <img src={logoSrc} alt={`${biz?.businessName || "Store"} logo`} className={styles.logo} />
                </div>
                <p className={styles.bizName}>{biz?.businessName || "Store"}</p>
                {biz?.businessEmail ? <p className={styles.bizEmail}>{biz.businessEmail}</p> : null}
              </div>

              {/* ORDER META */}
              <div className={styles.meta}>
                <div>{formatDate(order?.date)}</div>
                <div>{orderId}</div>
                <div className={styles.status}>
                  <i className={statusData.icon} style={{ color: statusData.color, marginRight: 6 }} />
                  <p>{statusData.label}</p>
                </div>
              </div>
            </div>

            <hr className={styles.divider} />

            {/* ITEMS */}
            <div className={styles.items}>
              {safeProducts.length === 0 ? (
                <div style={{ opacity: 0.75, fontStyle: "italic" }}>No items recorded for this order.</div>
              ) : (
                safeProducts.map((item, idx) => {
                  const qty = Number(item?.quantity || 0);
                  const unitPrice = Number(item?.price || 0);
                  const name = String(item?.name || "Item");
                  const totalPrice = unitPrice * qty; // <-- Calculate total price for this item
                  return (
                    <div key={`${name}-${idx}`} className={styles.itemRow}>
                      <div className={styles.itemName}>
                        {name} {qty > 0 && <small>(x{qty})</small>}
                      </div>
                      <div className={styles.itemPrice}>
                        {formatMoney.format(totalPrice)} {/* <-- Show total price for this item */}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* TOTAL */}
            <div className={styles.total}>
              <strong>Total:</strong>
              <strong>{formatMoney.format(safeAmount)}</strong>
            </div>

            <hr className={styles.divider} />

            {/* CUSTOMER */}
            {order?.user && (order?.user?.fullName || order?.user?.phoneNumber) && (
              <div className={styles.customer}>
                <h3>Customer</h3>
                {order?.user?.fullName && <p>{order.user.fullName}</p>}
                {order?.user?.phoneNumber && <p>{order.user.phoneNumber}</p>}
              </div>
            )}

            <div className={styles.receiptFooter}>
              Thank you for shopping with {biz?.businessName || "our store"}
            </div>
          </div>

          <div className={styles.receiptBottom} />
        </div>

        {/* ACTIONS */}
        <div className={styles.actions}>
          <button onClick={handleDownload} disabled={imgBusy}>
            {imgBusy ? <i className="fa-solid fa-spinner fa-spin" /> : "Download"}
          </button>
          <button onClick={handleShare} disabled={imgBusy || !navigator.share}>
            {imgBusy ? <i className="fa-solid fa-spinner fa-spin" /> : "Share"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default Receipt;
