import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../src/hooks/firebase";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import styles from "./sales.module.css";

const isSameDate = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const fetchSalesData = async (storeId) => {
  const today = new Date();
  const businessRef = doc(db, "businesses", storeId);
  const businessSnap = await getDoc(businessRef);

  if (!businessSnap.exists()) return null;

  const businessData = businessSnap.data();

  const todayOrders = (businessData.orders || []).filter(order => {
    const orderDate = new Date(order.date);
    return isSameDate(orderDate, today);
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

  const pageViewsToday =
    (businessData.pageViews || []).find(pv => {
      const pvDate = new Date(pv.date);
      return isSameDate(pvDate, today);
    })?.views || 0;

  return {
    payoutTomorrow: totalAmount,
    salesToday: todayOrders.length,
    pageViewsToday,
    storeLikes: businessData.storeLike || 0,
  };
};

const Sales = ({ storeId }) => {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["salesData", storeId],
    queryFn: () => fetchSalesData(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5, // Cache valid for 5 minutes
    cacheTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Avoid unnecessary refetching when switching tabs
  });

  const handleClick = (index) => {
    if (index === 0) {
      navigate("/settings/payments");
    } else if (index === 1) {
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

  return (
    <div className={styles.container}>
      <div className={styles.salesBoxes}>
        {[
          { title: "Payout Tomorrow", value: `₦${data.payoutTomorrow.toLocaleString()}`, icon: "fa-money-bill-wave" },
          { title: "Sales Today", value: data.salesToday, icon: "fa-cart-shopping" },
          { title: "Page Views Today", value: data.pageViewsToday, icon: "fa-eye", tooltip: `Total views: ${data.pageViewsToday}` },
          { title: "Page Likes", value: data.storeLikes, icon: "fa-thumbs-up", tooltip: `Total likes: ${data.storeLikes}` },
        ].map((item, index) => (
          <motion.div
            key={index}
            className={styles.salesBox}
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
