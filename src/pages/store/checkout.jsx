import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./checkout.module.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { db } from "../../hooks/firebase";
import { toast } from "sonner";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  setDoc
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const Checkout = ({ storeId }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [bizData, setBizData] = useState(null);
  const [checkoutData, setCheckoutData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [modalStage, setModalStage] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch business + checkout data
  useEffect(() => {
    const fetchData = async () => {
      const bizSnap = await getDoc(doc(db, "businesses", storeId));
      if (bizSnap.exists()) {
        setBizData(bizSnap.data());
      }

      // ✅ Always load from persistent checkout key
      const checkoutLS = localStorage.getItem(`checkout_${storeId}`);
      if (checkoutLS) {
        const parsedData = JSON.parse(checkoutLS);
        setCheckoutData(parsedData);

        // ✅ Calculate total dynamically
        const amount = parsedData.reduce((sum, item) => {
          const price = item.price || 0;
          const qty = item.quantity || 1;
          return sum + price * qty;
        }, 0);
        setTotalAmount(amount);
      }
    };

    fetchData();
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
      setProofImage(URL.createObjectURL(file)); // preview only
    }
  };

  const handleFinalSubmit = async () => {
    if (!proofImage) {
      toast.info("Please upload your payment proof");
      return;
    }

    setIsSubmitting(true);

    // ✅ 1. Remove local storage items (cart + checkout)
    localStorage.removeItem(`cart_${storeId}`);
    localStorage.removeItem(`checkout_${storeId}`);

    // ✅ 2. Save orderId to businesses.orders
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

    // ✅ 3. Save full order in orders collection
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

    // ✅ 4. Navigate to receipt
    navigate(`/order/${orderId}`);
  };

  return (
    <div className={styles.checkoutInterface}>
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
        {bizData?.paymentMethods?.map((method, idx) => (
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

      {/* User Info Modal */}
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

      {/* Transfer Details Modal */}
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

      {/* Proof Modal */}
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