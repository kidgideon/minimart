
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/hooks/firebase"; // adjust path if needed
import styles from "./viewed.module.css";

const fetchMostViewed = async (storeId) => {
  if (!storeId) return [];

  const businessRef = doc(db, "businesses", storeId);
  const snapshot = await getDoc(businessRef);

  if (!snapshot.exists()) return [];

  const data = snapshot.data();
  const products = (data.products || []).map((p) => ({
    ...p,
    _type: "product",
    id: p.prodId,
  }));
  const services = (data.services || []).map((s) => ({
    ...s,
    _type: "service",
    id: s.serviceId,
  }));

  return [...products, ...services]
    .filter((item) => item.views && item.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);
};

const MostViewedProducts = ({ storeId }) => {
  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["mostViewed", storeId],
    queryFn: () => fetchMostViewed(storeId),
    enabled: !!storeId, // prevents fetching if storeId is not set
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <i className="fa-solid fa-spinner fa-spin"></i> Loading most viewed items...
      </div>
    );
  }

  if (isError) {
    console.error("Error fetching most viewed items:", error);
    return (
      <div className={styles.empty}>
        <i className="fa-solid fa-circle-exclamation"></i>
        <p>Failed to load viewed items.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <i className="fa-solid fa-box-open"></i>
        <p>No viewed items to display yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Most Viewed Items</h3>
      <div className={styles.cards}>
        {items.map((item, index) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.rank}>#{index + 1}</div>
            <div className={styles.imageWrapper}>
              <img src={item.images?.[0]} alt={item.name} />
            </div>
            <div className={styles.info}>
              <h4>{item.name}</h4>
              <p className={styles.category}>{item.category}</p>
              <p className={styles.views}>{item.views} views</p>
              <span className={styles.tag}>
                {item._type === "product" ? "Product" : "Service"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MostViewedProducts;
