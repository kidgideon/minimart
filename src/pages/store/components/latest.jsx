import { useEffect, useState } from "react";
import styles from "./latest.module.css";
import ProductCard from "./productCard";
import { db } from "../../../hooks/firebase";
import { doc, getDoc } from "firebase/firestore";

const Latest = ({ storeId }) => {
  const [latestItems, setLatestItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestItems = async () => {
      if (!storeId) return;

      setLoading(true);
      try {
        const bizRef = doc(db, "businesses", storeId);
        const snap = await getDoc(bizRef);

        if (snap.exists()) {
          const data = snap.data();
          const products = (data.products || []).map(p => ({ ...p, _ft: "product" }));
          const services = (data.services || []).map(s => ({ ...s, _ft: "service" }));

          const combined = [...products, ...services];

          const sorted = combined
            .filter(item => item.dateAdded)
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 10);

          setLatestItems(sorted);
        } else {
          setLatestItems([]);
        }
      } catch (err) {
        console.error("Failed to fetch latest items:", err);
        setLatestItems([]);
      }
      setLoading(false);
    };

    fetchLatestItems();
  }, [storeId]);

  return (
    <div className={styles.latestWrapper}>
      <h1 className={styles.heading}>Latest Items</h1>

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : latestItems.length > 0 ? (
        <div className={styles.scrollContainer}>
          {latestItems.map((item) => (
            <ProductCard key={item.prodId || item.serviceId} storeId={storeId} item={item} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No latest items available.</p>
      )}
    </div>
  );
};

export default Latest;
