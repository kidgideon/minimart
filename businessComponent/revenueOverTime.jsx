import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/hooks/firebase";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import {
  startOfWeek,
  format,
  startOfMonth,
  startOfYear,
  parseISO,
} from "date-fns";
import styles from "./revenueOverTime.module.css";

const RevenueOverTime = ({ storeId}) => {
  const [data, setData] = useState([]);
  const [range, setRange] = useState("month");
  const [trend, setTrend] = useState("neutral");
  const [totalOverall, setTotalOverall] = useState(0);

  useEffect(() => {
    if (!storeId) return;
    const loadData = async () => {
      const bizRef = doc(db, "businesses", storeId);
      const bizSnap = await getDoc(bizRef);
      if (!bizSnap.exists()) return;

      const ordersMeta = bizSnap.data().orders || [];
      const orders = [];

      for (let o of ordersMeta) {
        const orderDoc = await getDoc(doc(db, "orders", o.orderId));
        if (!orderDoc.exists()) continue;
        const od = orderDoc.data();
        if (!od.completed || od.cancelled) continue;
        orders.push({ ...od, date: o.date });
      }

      const total = orders.reduce((acc, o) => acc + o.amount, 0);
      setTotalOverall(total);

      const aggregated = aggregateRevenue(orders, range);
      setData(aggregated);

      if (aggregated.length > 1) {
        const first = aggregated[0].revenue;
        const last = aggregated[aggregated.length - 1].revenue;
        setTrend(last > first ? "up" : last < first ? "down" : "neutral");
      } else {
        setTrend("neutral");
      }
    };

    loadData();
  }, [storeId, range]);

  const aggregateRevenue = (orders, range) => {
    const map = {};
    orders.forEach(o => {
      const date = parseISO(o.date);
      let key;
      switch (range) {
        case "day":
          key = format(date, "yyyy-MM-dd");
          break;
        case "week":
          key = format(startOfWeek(date), "yyyy-MM-dd");
          break;
        case "month":
          key = format(startOfMonth(date), "yyyy-MM");
          break;
        case "year":
          key = format(startOfYear(date), "yyyy");
          break;
        default:
          key = format(date, "yyyy-MM-dd");
      }
      map[key] = (map[key] || 0) + o.amount;
    });

    return Object.keys(map)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(key => ({ date: key, revenue: map[key] }));
  };

  const barData = data.map(d => ({
    date: d.date,
    revenue: d.revenue,
  }));

  const lineData = [
    {
      id: "Revenue",
      data: data.map(d => ({ x: d.date, y: d.revenue })),
    },
  ];

  return (
    <div className={styles.graphInterface}>
      <div className={styles.totalOverall}>
        Total Revenue: ₦{totalOverall.toLocaleString()}
      </div>

      <div className={styles.controls}>
        {["day", "week", "month", "year"].map(r => (
          <button
            key={r}
            className={`${styles.rangeBtn} ${range === r ? styles.active : ""}`}
            onClick={() => setRange(r)}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.chartWrapper}>
        {data.length > 0 ? (
          <>
            <div className={styles.chartInner}>
              <ResponsiveBar
                data={barData}
                keys={["revenue"]}
                indexBy="date"
                margin={{ top: 20, right: 30, bottom: 50, left: 70 }}
                padding={0.3}
                axisBottom={{
                  tickRotation: -30,
                  legend: "Date",
                  legendOffset: 36,
                  legendPosition: "middle",
                }}
                axisLeft={{
                  format: v => `₦${v.toLocaleString()}`,
                }}
                tooltip={({ value, indexValue }) => (
                  <div className={styles.tooltip}>
                    <strong>{indexValue}</strong>
                    <div>₦{value.toLocaleString()}</div>
                  </div>
                )}
              />
            </div>

            <div className={styles.chartInner}>
              <ResponsiveLine
                data={lineData}
                margin={{ top: 20, right: 30, bottom: 50, left: 70 }}
                xScale={{ type: "point" }}
                yScale={{ type: "linear", stacked: false }}
                axisBottom={{
                  tickRotation: -30,
                  legend: "Date",
                  legendOffset: 36,
                  legendPosition: "middle",
                }}
                axisLeft={{
                  format: v => `₦${v.toLocaleString()}`,
                }}
                pointSize={8}
                useMesh={true}
              />
            </div>
          </>
        ) : (
          <div className={styles.noData}>No data for this period</div>
        )}
      </div>

      <div className={styles.totalRange}>
        {data.length > 0 &&
          `Revenue for this ${range}: ₦${data[data.length - 1].revenue.toLocaleString()}`}
      </div>

      <div
        className={styles.trendText}
      >
        Trend: {trend === "up" ? "📈 Rising" : trend === "down" ? "📉 Falling" : "➡️ Stable"}
      </div>
    </div>
  );
};

export default RevenueOverTime;
