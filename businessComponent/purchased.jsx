import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/hooks/firebase"; 
import styles from "./purchased.module.css"; // reuse same styling

const MostPurchasedItem = ({ storeId }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMostPurchased = async () => {
      try {
        setLoading(true);

        // Get business orders array
        const bizRef = doc(db, "businesses", storeId);
        const bizSnap = await getDoc(bizRef);
        if (!bizSnap.exists()) {
          setItem(null);
          setLoading(false);
          return;
        }

        const ordersMeta = bizSnap.data().orders || [];
        if (ordersMeta.length === 0) {
          setItem(null);
          setLoading(false);
          return;
        }

        const purchaseMap = {};

        for (let o of ordersMeta) {
          const orderRef = doc(db, "orders", o.orderId);
          const orderSnap = await getDoc(orderRef);
          if (!orderSnap.exists()) continue;

          const orderData = orderSnap.data();
          if (orderData.cancelled === true || orderData.completed !== true) continue;

          (orderData.products || []).forEach((product) => {
            const key = product._ft === "service" ? product.serviceId : product.prodId;
            if (!key) return;
            if (!purchaseMap[key]) purchaseMap[key] = { ...product, totalQuantity: 0 };
            purchaseMap[key].totalQuantity += product.quantity || 1;
          });
        }

        const sortedItems = Object.values(purchaseMap).sort(
          (a, b) => b.totalQuantity - a.totalQuantity
        );

        setItem(sortedItems[0] || null);
      } catch (err) {
        console.error(err);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    if (storeId) fetchMostPurchased();
  }, [storeId]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <i className="fa-solid fa-spinner fa-spin"></i> Loading most purchased item...
      </div>
    );
  }

  if (!item) {
    return (
      <div className={styles.empty}>
        <i className="fa-solid fa-box-open"></i>
        <p>No purchases to display yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Most Purchased Item</h3>
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.rank}>#1</div>
          <div className={styles.imageWrapper}>
            <img src={item.images?.[0]} alt={item.name} />
          </div>
          <div className={styles.info}>
            <h4>{item.name}</h4>
            <p className={styles.category}>{item.category}</p>
            <p className={styles.views}> purchased {item.totalQuantity} times</p>
            <span className={styles.tag}>
              {item._ft === "product" ? "Product" : "Service"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MostPurchasedItem;
