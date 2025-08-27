import { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/hooks/firebase";
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import styles from "./pageviewanalysis.module.css";

const PageViewAnalysis = ({ storeId }) => {
  const [pageViewData, setPageViewData] = useState([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState("month"); // all, day, week, month, year
  const svgRef = useRef(null);

  useEffect(() => {
    if (!storeId) return;

    const fetchPageViews = async () => {
      setLoading(true);
      try {
        const bizSnap = await getDoc(doc(db, "businesses", storeId));
        if (!bizSnap.exists()) return;

        const viewsMeta = bizSnap.data().pageViews || [];
        console.log("Raw pageViews:", viewsMeta);

        const pageViews = viewsMeta
          .map(v => ({
            views: v.views || 0,
            date: v.date?.toDate ? v.date.toDate() : new Date(v.date)
          }))
          .sort((a, b) => a.date - b.date);

        console.log("Mapped & sorted views:", pageViews);

        const now = new Date();
        let filteredViews = pageViews;
        if (range === "day") filteredViews = pageViews.filter(v => v.date >= startOfDay(now));
        if (range === "week") filteredViews = pageViews.filter(v => v.date >= startOfWeek(now));
        if (range === "month") filteredViews = pageViews.filter(v => v.date >= startOfMonth(now));
        if (range === "year") filteredViews = pageViews.filter(v => v.date >= startOfYear(now));

        console.log(`Filtered (${range}):`, filteredViews);

        // Create cumulative data
        let cumulative = 0;
        const data = filteredViews.map((v) => {
          cumulative += v.views;
          return { date: v.date, views: cumulative };
        });

        setPageViewData(data);
        setTotalViews(filteredViews.reduce((sum, v) => sum + v.views, 0));
      } finally {
        setLoading(false);
      }
    };

    fetchPageViews();
  }, [storeId, range]);

  const generatePath = (data, width, height, padding) => {
    if (!data.length) return "";

    const maxViews = Math.max(...data.map((d) => d.views), 1);
    let minDate = data[0].date.getTime();
    let maxDate = data[data.length - 1].date.getTime();

    // If only one point, stretch line across
    if (data.length === 1) {
      minDate -= 1000;
      maxDate += 1000;
    }

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

    // Stretch fill for single point
    if (data.length === 1) {
      minDate -= 1000;
      maxDate += 1000;
    }

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

  const rangeLabels = {
    all: "Total Page Views",
    day: "Page Views Today",
    week: "Page Views This Week",
    month: "Page Views This Month",
    year: "Page Views This Year",
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

      <div style={{color: 'var(--secondary-color)'}} className={styles.totalViews}>
        {rangeLabels[range]}: {totalViews.toLocaleString()}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>
      ) : pageViewData.length === 0 ? (
        <div className={styles.noData}>
          <i className="fa-solid fa-chart-line"></i>
          <p>No page view data yet.</p>
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
            if (pageViewData.length === 1) {
              minDate -= 1000;
              maxDate += 1000;
            }
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
