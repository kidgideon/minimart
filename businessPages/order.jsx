import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../src/hooks/firebase"; // Adjust path as needed
import styles from "./order.module.css";
import Navbar from "../businessComponent/navbar";

const sortOrders = (orders, sortBy) => {
  if (sortBy === "date") {
    return [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  if (sortBy === "amount") {
    return [...orders].sort((a, b) => (b.amount || 0) - (a.amount || 0));
  }
  if (sortBy === "completed") {
    return [...orders].filter(o => o.completed && !o.cancelled);
  }
  if (sortBy === "cancelled") {
    return [...orders].filter(o => o.cancelled);
  }
  if (sortBy === "uncompleted") {
    return [...orders].filter(o => !o.completed && !o.cancelled);
  }
  return orders;
};

const statusColor = {
  completed: "green",
  cancelled: "red",
  uncompleted: "orange",
};

const getOrderStatus = (order) => {
  if (order.cancelled) return "cancelled";
  if (order.completed) return "completed";
  return "uncompleted";
};

const DashboardOrder = () => {
  const [orders, setOrders] = useState([]);
  const [sortBy, setSortBy] = useState("date");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return setLoading(false);
      // Get user's businessId
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const businessId = userDoc.data()?.businessId;
      if (!businessId) return setLoading(false);

      // Get business orders array
      const bizDoc = await getDoc(doc(db, "businesses", businessId));
      const ordersArr = bizDoc.data()?.orders || [];

      // Fetch each order from orders collection
      const orderPromises = ordersArr.map(async ({ orderId, date }) => {
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        const orderData = orderDoc.exists() ? orderDoc.data() : {};
        return {
          ...orderData,
          date: orderData.date || date,
          orderId,
        };
      });
      const allOrders = await Promise.all(orderPromises);
      setOrders(allOrders);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const sortedOrders = sortOrders(orders, sortBy);

  return (
    <div className="container">
      <Navbar />
      <div className="displayArea">
        <div className={styles.title}>
          <div className={styles.titleText}>
            Orders <i className="fa-solid fa-bag-shopping"></i> ({orders.length})
          </div>
          <div className={styles.sortArea}>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date">Date (Newest)</option>
              <option value="amount">Amount (Expensive)</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="uncompleted">Uncompleted</option>
            </select>
          </div>
        </div>
        <div className={styles.orders}>
          {loading ? (
            <p><i className="fa-solid fa-spinner fa-spin"></i></p>
          ) : sortedOrders.map((order, idx) => {
            const status = getOrderStatus(order);
            return (
              <motion.div
                key={order.orderId}
                className={styles.order}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => navigate(`/orders/order/${order.orderId}`)}
              >
                <div className={styles.orderTop}>
                  <div className={styles.iconArea}>
                    <i className="fa-solid fa-circle-user"></i>
                  </div>
                  <div className={styles.customeInformation}>
                    <p>{order.customerInfo?.firstName} {order.customerInfo?.lastName}</p>
                    <p>{order.customerInfo?.email}</p>
                    <p>{order.customerInfo?.whatsapp}</p>
                    <p>₦{(order.amount || 0).toLocaleString()}</p>
                    <p className={styles[status]}>
                      <i className="fa-solid fa-circle"></i> {status}
                    </p>
                  </div>
                </div>
                <div className={styles.dateArea}>
                  <p>{new Date(order.date).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardOrder;