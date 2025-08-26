import { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/hooks/firebase";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import styles from "./revenueOverTime.module.css";

const RevenueOverTime = ({ storeId }) => {
  const [ordersData, setOrdersData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("month"); // all, day, week, month, year
  const svgRef = useRef(null);

  useEffect(() => {
    if (!storeId) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const bizSnap = await getDoc(doc(db, "businesses", storeId));
        if (!bizSnap.exists()) return;

        const ordersMeta = bizSnap.data().orders || [];
        const orders = [];

        for (let o of ordersMeta) {
          const orderSnap = await getDoc(doc(db, "orders", o.orderId));
          if (!orderSnap.exists()) continue;

          const order = orderSnap.data();
          if (!order.completed || order.cancelled) continue;

          orders.push({ amount: order.amount, date: new Date(order.date) });
        }

        orders.sort((a, b) => a.date - b.date);

        // Filter by range
        const now = new Date();
        let filteredOrders = orders;
        if (range === "day") filteredOrders = orders.filter(o => o.date >= startOfDay(now));
        if (range === "week") filteredOrders = orders.filter(o => o.date >= startOfWeek(now));
        if (range === "month") filteredOrders = orders.filter(o => o.date >= startOfMonth(now));
        if (range === "year") filteredOrders = orders.filter(o => o.date >= startOfYear(now));

        let cumulative = 0;
        const data = filteredOrders.map((o) => {
          cumulative += o.amount;
          return { date: o.date, revenue: cumulative };
        });

        setOrdersData(data);
        setTotalRevenue(filteredOrders.reduce((sum, o) => sum + o.amount, 0));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [storeId, range]);

  const generatePath = (data, width, height, padding) => {
    if (!data.length) return "";
    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
    const minDate = data[0].date.getTime();
    const maxDate = data[data.length - 1].date.getTime();
    const scaleX = date =>
      padding + ((date.getTime() - minDate) / (maxDate - minDate || 1)) * (width - 2 * padding);
    const scaleY = rev => height - padding - (rev / maxRevenue) * (height - 2 * padding);
    const points = data.map(d => [scaleX(d.date), scaleY(d.revenue)]);
    let path = `M ${points[0][0]},${points[0][1]} `;
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      const cx = (x0 + x1) / 2;
      path += `C ${cx},${y0} ${cx},${y1} ${x1},${y1} `;
    }
    return path;
  };

  const generateFillPath = (data, width, height, padding) => {
    if (!data.length) return "";
    const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
    const minDate = data[0].date.getTime();
    const maxDate = data[data.length - 1].date.getTime();
    const scaleX = date =>
      padding + ((date.getTime() - minDate) / (maxDate - minDate || 1)) * (width - 2 * padding);
    const scaleY = rev => height - padding - (rev / maxRevenue) * (height - 2 * padding);
    const points = data.map(d => [scaleX(d.date), scaleY(d.revenue)]);
    let path = `M ${points[0][0]},${height - padding} L ${points[0][0]},${points[0][1]} `;
    for (let i = 1; i < points.length; i++) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      const cx = (x0 + x1) / 2;
      path += `C ${cx},${y0} ${cx},${y1} ${x1},${y1} `;
    }
    path += `L ${points[points.length - 1][0]},${height - padding} Z`;
    return path;
  };

  // Dynamic revenue label
  const rangeLabels = {
    all: "Total Revenue",
    day: "Revenue Today",
    week: "Revenue This Week",
    month: "Revenue This Month",
    year: "Revenue This Year",
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className={styles.rangeSelect}
        >
          <option value="all">All Time</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
      </div>

      <div className={styles.totalRevenue}>
        {rangeLabels[range]}: ₦{totalRevenue.toLocaleString()}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>
      ) : ordersData.length === 0 ? (
        <div className={styles.noData}>
          <i className="fa-solid fa-chart-line"></i>
          <p>No revenue data yet.</p>
        </div>
      ) : (
        <svg
          ref={svgRef}
          className={styles.chart}
          viewBox="0 0 800 300"
          preserveAspectRatio="none"
        >
          <path
            d={generateFillPath(ordersData, 800, 300, 40)}
            fill="var(--secondary-color)"
            opacity="0.3"
          />
          <path
            d={generatePath(ordersData, 800, 300, 40)}
            fill="none"
            stroke="var(--primary-color)"
            strokeWidth="3"
          />
          {ordersData.map((d, i) => {
            const maxRevenue = Math.max(...ordersData.map(d => d.revenue), 1);
            const minDate = ordersData[0].date.getTime();
            const maxDate = ordersData[ordersData.length - 1].date.getTime();
            const x = 40 + ((d.date.getTime() - minDate) / (maxDate - minDate || 1)) * (800 - 80);
            const y = 300 - 40 - (d.revenue / maxRevenue) * (300 - 80);
            return <circle key={i} cx={x} cy={y} r="4" fill="var(--secondary-color)" />;
          })}
        </svg>
      )}
    </div>
  );
};

export default RevenueOverTime;
