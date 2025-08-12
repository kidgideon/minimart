import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import styles from "./checkout.module.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { db } from "../../hooks/firebase";
import { toast } from "sonner";
import { doc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import useStoreTheme from "../../hooks/useStoreTheme";
import fallback from "../../images/no_bg.png";

const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const applyThemeToRoot = (primary, secondary) => {
  document.documentElement.style.setProperty("--storePrimary", primary || DEFAULT_PRIMARY);
  document.documentElement.style.setProperty("--storeSecondary", secondary || DEFAULT_SECONDARY);
};

const Checkout = ({ storeId: propStoreId }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const storeId = propStoreId || useParams().storeid;

  const { biz, loading, error } = useStoreTheme(storeId);

  const [checkoutData, setCheckoutData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [modalStage, setModalStage] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!storeId) navigate("/");

    if (biz) {
      const primary = biz.customTheme?.primaryColor?.trim() || DEFAULT_PRIMARY;
      const secondary = biz.customTheme?.secondaryColor?.trim() || DEFAULT_SECONDARY;
      applyThemeToRoot(primary, secondary);
    }
  }, [storeId, biz]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load store.");
      navigate("/");
    }
  }, [error]);

  useEffect(() => {
    const checkoutLS = localStorage.getItem(`checkout_${storeId}`);
    if (checkoutLS) {
      const parsedData = JSON.parse(checkoutLS);
      setCheckoutData(parsedData);

      const amount = parsedData.reduce((sum, item) => {
        const price = item.price || 0;
        const qty = item.quantity || 1;
        return sum + price * qty;
      }, 0);
      setTotalAmount(amount);
    }
  }, [storeId]);

  const handleSelectMethod = (method) => {
    setSelectedMethod(method);
    setModalStage("userinfo");
  };

  const handleUserInfoNext = () => {
    if (!fullName || !phoneNumber) {
      toast.error("Please fill in your full name and phone number");
      return;
    }
    setModalStage("transfer");
  };

  const handleTransferNext = () => {
    toast.info("Please upload a picture of the payment receipt");
    setModalStage("proof");
  };

  const handleProofUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(URL.createObjectURL(file));
    }
  };

  const handleFinalSubmit = async () => {
    if (!proofImage) {
      toast.info("Please upload your payment proof");
      return;
    }

    setIsSubmitting(true);

    try {
      localStorage.removeItem(`cart_${storeId}`);
      localStorage.removeItem(`checkout_${storeId}`);

      const bizRef = doc(db, "businesses", storeId);
      await updateDoc(bizRef, {
        orders: arrayUnion({
          orderId,
          date: new Date().toISOString()
        }),
        notifications: arrayUnion({
          date: new Date().toISOString(),
          link: "/orders",
          read: false,
          text: `New order ${orderId} has been placed`
        })
      });

      const orderRef = doc(db, "orders", orderId);
      await setDoc(orderRef, {
        orderId,
        storeId,
        user: { fullName, phoneNumber },
        products: checkoutData,
        date: new Date().toISOString(),
        amount: totalAmount,
        status: "pending",
        paymentMethod: selectedMethod
      });

      navigate(`/order/${orderId}`);
    } catch (err) {
      toast.error("Failed to submit order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32 }}></i>
      </div>
    );
  }

  if (!biz) return null;

  const title = `${biz.businessName || "Minimart Store"} - Checkout`;
  const description = biz.otherInfo?.description || "Complete your purchase of quality products and services";
  const logo = biz.customTheme?.logo || fallback;
  const url = `https://${storeId}.minimart.ng/checkout`;

  return (
    <div className={styles.checkoutInterface}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={logo} />
        <meta property="og:url" content={url} />
        <meta name="theme-color" content={biz.customTheme?.primaryColor || DEFAULT_PRIMARY} />
        <link rel="icon" type="image/png" href={logo || fallback} />
      </Helmet>

      <Navbar storeId={storeId} />

      <div className={styles.warningTemplate}>
        Note: You must transfer the exact amount to one of the listed accounts below
        and upload proof of payment. Your payment information must match the name
        used for the transfer.
      </div>

      <div className={styles.top}>
        What account do you want to pay to?
      </div>

      <div className={styles.paymentAccounts}>
        {biz?.paymentMethods?.map((method, idx) => (
          <div
            key={idx}
            className={styles.method}
            onClick={() => handleSelectMethod(method)}
          >
            <div className={styles.icon}>
              <i className="fa-solid fa-credit-card"></i>
            </div>
            <div className={styles.bankName}>
              {method.bankName}
            </div>
          </div>
        ))}
      </div>

      {modalStage === "userinfo" && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Enter Your Details</h2>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <button onClick={handleUserInfoNext}>Next</button>
          </div>
        </div>
      )}

      {modalStage === "transfer" && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Transfer Details</h2>
            <p>Amount: ₦{totalAmount.toLocaleString()}</p>
            <p>
              Account Name: {selectedMethod?.accName}
              <button
                className={styles.copyBtn}
                onClick={() =>
                  navigator.clipboard.writeText(selectedMethod?.accName)
                }
              >
                Copy
              </button>
            </p>
            <p>
              Account Number: {selectedMethod?.accNo}
              <button
                className={styles.copyBtn}
                onClick={() =>
                  navigator.clipboard.writeText(selectedMethod?.accNo)
                }
              >
                Copy
              </button>
            </p>
            <p className={styles.warningTemplate}>
              Please make sure you have sent payment before clicking below.
            </p>
            <button onClick={handleTransferNext}>I Have Sent</button>
          </div>
        </div>
      )}

      {modalStage === "proof" && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Upload Payment Proof</h2>
            <div className={styles.uploadBox}>
              {proofImage ? (
                <img src={proofImage} alt="Proof Preview" />
              ) : (
                <label>
                  Click to upload proof
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofUpload}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <i className="fa fa-spinner fa-spin"></i> : "Done"}
            </button>
          </div>
        </div>
      )}

      <Footer storeId={storeId} />
    </div>
  );
};

export default Checkout;
