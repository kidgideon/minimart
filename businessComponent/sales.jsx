import { useNavigate } from "react-router-dom";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../src/hooks/firebase";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import styles from "./sales.module.css";

// Convert any date string or Date object to YYYY-MM-DD (UTC safe)
const formatDateOnly = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

const fetchSalesData = async (storeId) => {
  const today = formatDateOnly(new Date());
  const businessRef = doc(db, "businesses", storeId);
  const businessSnap = await getDoc(businessRef);
  if (!businessSnap.exists()) return null;

  const businessData = businessSnap.data();

  // Filter orders where the full date-time falls on today
  const todayOrders = (businessData.orders || []).filter(order => {
    return formatDateOnly(order.date) === today;
  });

  let totalAmount = 0;
  if (todayOrders.length > 0) {
    const ordersSnap = await getDocs(collection(db, "orders"));
    ordersSnap.forEach(docSnap => {
      if (todayOrders.some(o => o.orderId === docSnap.id)) {
        const orderData = docSnap.data();
        totalAmount += orderData.amount || 0;
      }
    });
  }

  // Page views for today (only date is used)
  const pageViewsToday = (businessData.pageViews || [])
    .filter(pv => formatDateOnly(pv.date) === today)
    .reduce((acc, pv) => acc + (pv.views || 0), 0);

  return {
    payoutTomorrow: totalAmount,
    salesToday: todayOrders.length,
    pageViewsToday,
    storeLikes: businessData.storeLike || 0,
  };
};

const Sales = ({ storeId }) => {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["salesData", storeId],
    queryFn: () => fetchSalesData(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const handleClick = (index) => {
    if (index === 0 || index === 1) {
      navigate("/orders");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <i className="fa-solid fa-spinner fa-spin"></i> Loading sales data...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={styles.loading}>
        <i className="fa-solid fa-triangle-exclamation"></i> Failed to load sales data.
      </div>
    );
  }

  const boxes = [
    { title: "Payout Tomorrow", value: `₦${data.payoutTomorrow.toLocaleString()}`, icon: "fa-money-bill-wave" },
    { title: "Sales Today", value: data.salesToday, icon: "fa-cart-shopping" },
    { title: "Page Views Today", value: data.pageViewsToday, icon: "fa-eye", tooltip: `Total views: ${data.pageViewsToday}` },
    { title: "Page Likes", value: data.storeLikes, icon: "fa-thumbs-up", tooltip: `Total likes: ${data.storeLikes}` },
  ];

  const boxClasses = [
    styles.salesBoxOne,
    styles.salesBoxTwo,
    styles.salesBoxThree,
    styles.salesBoxFour,
  ];

  return (
    <div className={styles.container}>
      <div className={styles.salesBoxes}>
        {boxes.map((item, index) => (
          <motion.div
            key={index}
            className={boxClasses[index]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            onClick={() => handleClick(index)}
            title={item.tooltip || ""}
            style={{ cursor: index === 0 || index === 1 ? "pointer" : "default" }}
          >
            <div className={styles.title}>
              <i className={`fa-solid ${item.icon}`} style={{ marginRight: 6 }}></i>
              {item.title}
            </div>
            <div className={styles.valueItem}>
              <p className={styles.amount}>{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Sales;
