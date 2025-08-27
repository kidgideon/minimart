import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/hooks/firebase";
import styles from "./purchased.module.css";

const fetchMostPurchased = async (storeId) => {
  // Get business orders array
  const bizRef = doc(db, "businesses", storeId);
  const bizSnap = await getDoc(bizRef);

  if (!bizSnap.exists()) return null;

  const ordersMeta = bizSnap.data().orders || [];
  if (ordersMeta.length === 0) return null;

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

  return sortedItems.length > 0 ? sortedItems[0] : null;
};

const MostPurchasedItem = ({ storeId }) => {
  const {
    data: item,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["mostPurchased", storeId],
    queryFn: () => fetchMostPurchased(storeId),
    enabled: !!storeId, // only fetch if storeId is available
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: false, // avoid refetching on tab change
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <i className="fa-solid fa-spinner fa-spin"></i> Loading most purchased item...
      </div>
    );
  }

  if (isError || !item) {
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
            <p className={styles.views}>purchased {item.totalQuantity} times</p>
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
