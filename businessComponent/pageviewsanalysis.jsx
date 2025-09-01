import { useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/hooks/firebase";
import { useQuery } from "@tanstack/react-query";
import styles from "./pageviewanalysis.module.css";

const fetchPageViews = async (storeId) => {
  if (!storeId) return [];

  const bizSnap = await getDoc(doc(db, "businesses", storeId));
  if (!bizSnap.exists()) return [];

  const viewsMeta = bizSnap.data().pageViews || [];

  // Convert Firestore timestamps to Date safely
  return viewsMeta.map(v => ({
    views: v.views || 0,
    date: v.date?.toDate ? v.date.toDate() : new Date(v.date)
  }));
};

const PageViewAnalysis = ({ storeId }) => {
  const [range, setRange] = useState("all"); // all, day, week, month, year
  const svgRef = useRef(null);

  const { data: pageViews = [], isLoading } = useQuery({
    queryKey: ["pageViews", storeId],
    queryFn: () => fetchPageViews(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5,
  });

  // For now, ignore range filtering to show all-time data
  const sortedViews = [...pageViews].sort((a, b) => a.date - b.date);

  // Cumulative views
  let cumulative = 0;
  const pageViewData = sortedViews.map((v) => {
    cumulative += v.views;
    return { date: v.date, views: cumulative };
  });

  const totalViews = pageViews.reduce((sum, v) => sum + v.views, 0);

  const generatePath = (data, width, height, padding) => {
    if (!data.length) return "";
    const maxViews = Math.max(...data.map((d) => d.views), 1);
    let minDate = data[0].date.getTime();
    let maxDate = data[data.length - 1].date.getTime();
    const scaleX = date =>
      padding + ((date.getTime() - minDate) / (maxDate - minDate || 1)) * (width - 2 * padding);
    const scaleY = views => height - padding - (views / maxViews) * (height - 2 * padding);
    const points = data.map(d => [scaleX(d.date), scaleY(d.views)]);
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
    const maxViews = Math.max(...data.map((d) => d.views), 1);
    let minDate = data[0].date.getTime();
    let maxDate = data[data.length - 1].date.getTime();
    const scaleX = date =>
      padding + ((date.getTime() - minDate) / (maxDate - minDate || 1)) * (width - 2 * padding);
    const scaleY = views => height - padding - (views / maxViews) * (height - 2 * padding);
    const points = data.map(d => [scaleX(d.date), scaleY(d.views)]);
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

  return (
    <div className={styles.container}>
      <div style={{ color: 'var(--secondary-color)' }} className={styles.totalViews}>
        Total Page Views: {totalViews.toLocaleString()}
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>
      ) : pageViewData.length === 0 ? (
        <div className={styles.noData}>
          <i className="fa-solid fa-chart-line"></i>
          <p>No page view data to display.</p>
        </div>
      ) : (
        <svg
          ref={svgRef}
          className={styles.chart}
          viewBox="0 0 800 300"
          preserveAspectRatio="none"
        >
          <path
            d={generateFillPath(pageViewData, 800, 300, 40)}
            fill="var(--secondary-color)"
            opacity="0.3"
          />
          <path
            d={generatePath(pageViewData, 800, 300, 40)}
            fill="none"
            stroke="var(--primary-color)"
            strokeWidth="3"
          />
          {pageViewData.map((d, i) => {
            const maxViews = Math.max(...pageViewData.map(d => d.views), 1);
            let minDate = pageViewData[0].date.getTime();
            let maxDate = pageViewData[pageViewData.length - 1].date.getTime();
            const x = 40 + ((d.date.getTime() - minDate) / (maxDate - minDate || 1)) * (800 - 80);
            const y = 300 - 40 - (d.views / maxViews) * (300 - 80);
            return <circle key={i} cx={x} cy={y} r="4" fill="var(--secondary-color)" />;
          })}
        </svg>
      )}
    </div>
  );
};

export default PageViewAnalysis;
