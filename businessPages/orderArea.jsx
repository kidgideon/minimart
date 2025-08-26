import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../src/hooks/firebase";
import styles from "./orderArea.module.css";
import Navbar from "../businessComponent/navbar";

function WarningModal({ onConfirm, onCancel }) {
return (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContainer}>
      <div className={styles.modalIcon}>
        <i className="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 className={styles.modalTitle}>Heads Up!</h3>
      <p className={styles.modalText}>
        Cancelling an order without refunding the buyer is considered unethical.<br />
        Provide a clear reason to the buyer if you cancel.<br />
        <b>If the buyer has paid, refund the money.</b>
      </p>
      <div className={styles.modalButtons}>
        <button className={styles.confirmBtn} onClick={onConfirm}>
          Proceed with Cancellation
        </button>
        <button className={styles.cancelBtn} onClick={onCancel}>
          Go Back
        </button>
      </div>
    </div>
  </div>
);

}

const OrderArea = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoadingCustomer(false);
        setLoadingProducts(false);
        setLoadingPayment(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const businessId = userDoc.data()?.businessId;

      const orderDoc = await getDoc(doc(db, "orders", orderId));
      if (orderDoc.exists()) {
        const data = orderDoc.data();
        setOrder(data);

        // Section-wise loading complete
        setLoadingCustomer(false);
        setLoadingProducts(false);
        setLoadingPayment(false);
      } else {
        setLoadingCustomer(false);
        setLoadingProducts(false);
        setLoadingPayment(false);
      }
    });
    return () => unsub();
  }, [orderId]);

  const handleCompleteOrder = async () => {
    if (!order || order.completed) return;
    setActionLoading(true);
    await updateDoc(doc(db, "orders", orderId), {
      completed: true,
      cancelled: false,
    });
    setOrder(o => ({ ...o, completed: true, cancelled: false }));
    setActionLoading(false);
  };

  const handleCancelOrder = async () => {
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    setActionLoading(true);
    await updateDoc(doc(db, "orders", orderId), {
      cancelled: true,
      completed: false,
    });
    setOrder(o => ({ ...o, cancelled: true, completed: false }));
    setShowCancelModal(false);
    setActionLoading(false);
  };

  if (!order && !loadingCustomer && !loadingProducts && !loadingPayment) 
    return <div>Order not found</div>;

  const customer = order?.customerInfo || {};
  const products = order?.products || [];
  const payment = order?.paymentInfo || {};
  const shipping = { state: customer.state, street: customer.street };

  return (
    <div className="container">
      <Navbar />

      <div className="displayArea">
        {/* Customer Info */}
      
        <div className={styles.customerInfo}>
          {loadingCustomer ? (
            <>
              <div className="skeleton skeletonImage"></div>
              <div className="skeleton skeletonText"></div>
              <div className="skeleton skeletonText"></div>
            </>
          ) : (
            <>
              <div className={styles.imageArea}>
                <i className="fa-solid fa-circle-user"></i>
                <p>{customer.firstName} {customer.lastName}</p>
              </div>
              <div className={styles.detailsArea}>
                <p><i className="fa-solid fa-file"></i> Attachment</p>
                <p><i className="fa-solid fa-envelope"></i> {customer.email}</p>
                <p><i className="fa-solid fa-phone"></i> {customer.whatsapp}</p>
              </div>
            </>
          )}
        </div>

        {/* Shipping Info */}
        <div className={styles.shippingInfo}>
          <p className={styles.infoText}>Shipping Info</p>
          {loadingCustomer ? (
            <>
              <div className="skeleton skeletonText"></div>
              <div className="skeleton skeletonText"></div>
            </>
          ) : (
            <>
              <p><i className="fa-solid fa-location-dot"></i> {shipping.state}</p>
              <p><i className="fa-solid fa-truck-fast"></i> {shipping.street}</p>
            </>
          )}
        </div>

        {/* Products */}
        <p className={styles.infoTextP}>Product Details</p>
        <div className={styles.purchaseDetails}>
          <div className={styles.products}>
            {loadingProducts ? (
              [...Array(2)].map((_, idx) => (
                <div className={styles.product} key={idx}>
                  <div className="skeleton skeletonImage"></div>
                  <div>
                    <div className="skeleton skeletonText"></div>
                    <div className="skeleton skeletonText"></div>
                  </div>
                </div>
              ))
            ) : (
              products.map((prod, idx) => (
                <div className={styles.product} key={idx}>
                  <div className={styles.image}>
                    {prod.images && prod.images[0] && (
                      <img src={prod.images[0]} alt={prod.name} />
                    )}
                  </div>
                  <div className={styles.details}>
                    <div className={styles.name}>{prod.name}</div>
                    <div className={styles.quantity}>x{prod.quantity}</div>
                    <div className={styles.price}>
                      ₦{(prod.price * prod.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className={styles.paymentDetails}>
          <p className={styles.header}><i className="fa-solid fa-credit-card"></i> Payment Details</p>
          {loadingPayment ? (
            <>
              <div className="skeleton skeletonText"></div>
              <div className="skeleton skeletonText"></div>
              <div className="skeleton skeletonText"></div>
            </>
          ) : (
            <>
              <p><span className={styles.label}>Amount:</span> ₦{(order.amount || 0).toLocaleString()}</p>
              <p><span className={styles.label}>Status:</span> {order.status}</p>
              <p><span className={styles.label}>Paid At:</span> {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "N/A"}</p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionBtn}>
          <button
            onClick={handleCancelOrder}
            disabled={actionLoading || order?.cancelled || order?.completed}
            className={`${styles.btn} ${actionLoading || order?.cancelled || order?.completed ? styles.disabledBtn : styles.cancelBtn}`}
          >
            {actionLoading && showCancelModal ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : "Cancel Order"}
          </button>

          <button
            onClick={handleCompleteOrder}
            disabled={actionLoading || order?.completed || order?.cancelled}
            className={`${styles.btn} ${actionLoading || order?.completed || order?.cancelled ? styles.disabledBtn : styles.completeBtn}`}
          >
            {actionLoading && !showCancelModal ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : "Complete Order"}
          </button>
        </div>

        {showCancelModal && (
          <WarningModal
            onConfirm={confirmCancelOrder}
            onCancel={() => setShowCancelModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default OrderArea;
