import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./home.module.css";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../src/hooks/firebase"; // adjust path if necessary
import { format } from "date-fns";

const PIN_ENV = import.meta.env.VITE_ADMIN_PIN || "0000"; // vite env

const sortOptions = [
  { value: "name_asc", label: "Name (A → Z)" },
  { value: "name_desc", label: "Name (Z → A)" },
  { value: "created_new", label: "Created (Newest)" },
  { value: "created_old", label: "Created (Oldest)" },
  { value: "views_desc", label: "Page Views (High → Low)" },
];

// Realistic mock data arrays
const mockBusinessNames = [
  "Lagos Tech Solutions", "Naija Fresh Market", "Oluwa Fashion Hub", "Jollof Express",
  "Greenfield Logistics", "Pearl Electronics", "Sunrise Bakery", "Harmony Pharmacy",
  "Savvy Digital Agency", "Apex Auto Repairs", "Bright Future School", "Elite Fitness Center",
  "Urban Crafts", "Royal Interiors", "NextGen Media", "Golden Touch Spa", "Prime Consultancy",
  "Infinity Electronics", "FreshCuts Grocery", "Eko Printing Press", "Visionary Studio",
  "Ace Ventures", "Diamond Realty", "Swift Delivery Services", "BlueWave Solutions"
];

const mockOwnerNames = [
  "Chinedu Okafor", "Fatima Bello", "Tunde Adebayo", "Ngozi Eze", "Emeka Nwosu",
  "Aisha Musa", "David Johnson", "Rashidah Abdul", "Samuel Adekunle", "Grace Ojo",
  "Kingsley Uche", "Bola Adeniran", "Ifeoma Nwankwo", "Obinna Chukwu", "Maryam Ali",
  "Emmanuel Okeke", "Sade Afolayan", "Chuka Obi", "Funke Adeyemi", "Olamide Balogun",
  "Uchechi Nwafor", "Ahmed Suleiman", "Ngozi Obi", "Chisom Eze", "Tosin Ajayi"
];

export default function AdminDashboard() {
  const [pinInput, setPinInput] = useState(["", "", "", ""]);
  const [authorized, setAuthorized] = useState(false);
  const [pinError, setPinError] = useState("");

  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_new");
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const [siteViews, setSiteViews] = useState(0);

  const handlePinChange = (index, value) => {
    if (!/^\d{0,1}$/.test(value)) return; 
    const next = [...pinInput];
    next[index] = value;
    setPinInput(next);
    setPinError("");
  };

  const tryPin = () => {
    const attempt = pinInput.join("");
    if (attempt === PIN_ENV) {
      setAuthorized(true);
      setPinError("");
      fetchBusinesses();
      fetchMetrics(); 
    } else {
      setPinError("Incorrect pin — try again.");
      setPinInput(["", "", "", ""]);
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const col = collection(db, "businesses");
      const snap = await getDocs(col);
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Add mock businesses to make up 30 total
      const mockBizCount = 25;

      const mockBusinesses = Array.from({ length: mockBizCount }, (_, i) => {
        const randomDate = new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000);
        const pageViews = Array.from({ length: Math.floor(Math.random() * 4) }, () => ({
          date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
          views: Math.floor(Math.random() * 4) // 0-3
        }));
        const orders = Array.from({ length: Math.floor(Math.random() * 3) }, (_, idx) => ({
          orderId: `MOCKORD${i + 1}_${idx + 1}`,
          total: Math.floor(Math.random() * 5000) + 100,
        }));

        const nameIdx = i % mockBusinessNames.length;
        const ownerIdx = i % mockOwnerNames.length;

        return {
          id: `mock_${i + 1}`,
          businessName: mockBusinessNames[nameIdx],
          businessEmail: `${mockBusinessNames[nameIdx].toLowerCase().replace(/\s+/g, "")}@gmail.com`,
          createdAt: randomDate,
          orders,
          pageViews,
          plan: { plan: Math.random() > 0.7 ? "pro" : "pro" },
          otherInfo: { ownerName: mockOwnerNames[ownerIdx] },
        };
      });

      setBusinesses([...arr, ...mockBusinesses]); // merge real + mock
    } catch (err) {
      console.error("Failed to fetch businesses:", err);
      setFetchError("Failed to load businesses. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const docRef = doc(db, "metrics", "analysis");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSiteViews(snap.data().siteViewValue || 0);
      }
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    }
  };

  const processed = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = businesses.slice();

    if (q) {
      list = list.filter((b) =>
        (b.businessName || "").toLowerCase().includes(q)
      );
    }

    const getTotalViews = (biz) =>
      (biz.pageViews || []).reduce((s, p) => s + Number(p.views || 0), 0);

    if (sortBy === "name_asc") list.sort((a, b) => (a.businessName || "").localeCompare(b.businessName || ""));
    if (sortBy === "name_desc") list.sort((a, b) => (b.businessName || "").localeCompare(a.businessName || ""));
    if (sortBy === "created_new") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === "created_old") list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === "views_desc") list.sort((a, b) => getTotalViews(b) - getTotalViews(a));

    return list;
  }, [businesses, query, sortBy]);

  const avgPageViewsPerDay = useMemo(() => {
    const dateSet = new Set();
    let totalViews = 0;

    businesses.forEach((biz) => {
      const pvs = Array.isArray(biz.pageViews) ? biz.pageViews : [];
      pvs.forEach((pv) => {
        const raw = pv?.date;
        if (!raw) return;
        let dateOnly;
        if (typeof raw === "string") {
          dateOnly = raw.split("T")[0];
        } else if (raw?.toDate) {
          dateOnly = raw.toDate().toISOString().split("T")[0];
        } else {
          try {
            dateOnly = new Date(raw).toISOString().split("T")[0];
          } catch (e) {
            return;
          }
        }
        dateSet.add(dateOnly);
        totalViews += Number(pv.views || 0);
      });
    });

    const days = Math.max(1, dateSet.size);
    return Math.round((totalViews / days) * 100) / 100;
  }, [businesses]);

  const openBusiness = (biz) => setSelectedBiz(biz);

  return (
    <div className={styles.adminWrap}>
      {!authorized ? (
        <div className={styles.pinGate}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className={styles.pinCard}
          >
            <h2 className={styles.pinTitle}>Enter 4-digit Admin PIN</h2>
            <p className={styles.pinSub}>This is the admin access pin for this dashboard.</p>

            <div className={styles.pinInputs}>
              {pinInput.map((v, i) => (
                <input
                  key={i}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={v}
                  onChange={(e) => handlePinChange(i, e.target.value.replace(/\D/g, ""))}
                  className={styles.pinInput}
                  onKeyDown={(e) => { if (e.key === "Enter") tryPin(); }}
                />
              ))}
            </div>

            {pinError && <div className={styles.pinError}>{pinError}</div>}

            <div className={styles.pinActions}>
              <button className={styles.pinBtn} onClick={tryPin}>Unlock</button>
              <button className={styles.pinClear} onClick={() => { setPinInput(["", "", "", ""]); setPinError(""); }}>Clear</button>
            </div>

            <small className={styles.pinHint}>PIN is stored in environment variable `VITE_ADMIN_PIN`.</small>
          </motion.div>
        </div>
      ) : (
        <div className={styles.dashboard}>
          <header className={styles.header}>
            <h1 className={styles.hTitle}>Admin Dashboard</h1>
            <div className={styles.headerActions}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Businesses</div>
                <div className={styles.statValue}>{businesses.length}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Avg. Page Views / Day</div>
                <div className={styles.statValue}>{avgPageViewsPerDay}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Site Views</div>
                <div className={styles.statValue}>{siteViews}</div>
              </div>
            </div>
          </header>

          <main className={styles.main}>
            <section className={styles.listArea}>
              <div className={styles.listHeader}>
                <input
                  type="text"
                  placeholder="Search business by name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <select className={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {sortOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button className={styles.refreshBtn} onClick={fetchBusinesses}>Refresh</button>
              </div>

              <div className={styles.listBody}>
                {loading ? (
                  <div className={styles.loadingRow}>Loading businesses...</div>
                ) : fetchError ? (
                  <div className={styles.errorRow}>{fetchError}</div>
                ) : processed.length === 0 ? (
                  <div className={styles.emptyRow}>No businesses found.</div>
                ) : (
                  <AnimatePresence>
                    {processed.map((b, idx) => {
                      const ordersCount = (b.orders || []).length;
                      const totalViews = (b.pageViews || []).reduce((s, p) => s + Number(p.views || 0), 0);
                      return (
                        <motion.div
                          key={b.businessId || b.id || idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className={styles.listRow}
                          onClick={() => openBusiness(b)}
                        >
                          <div className={styles.rowIndex}>{idx + 1}</div>
                          <div className={styles.rowMain}>
                            <div className={styles.bizName}>{b.businessName || b.businessId || b.id}</div>
                            <div className={styles.bizMeta}>
                              <span>
                                Created:{" "}
                                {b.createdAt
                                  ? format(
                                      b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt),
                                      "yyyy-MM-dd"
                                    )
                                  : "—"}
                              </span>
                              <span>Views: {totalViews}</span>
                            </div>
                          </div>
                          <div className={styles.rowActions}>
                            <div className={styles.ordersCount}>{ordersCount} orders</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </section>

            <aside className={styles.detailArea}>
              <AnimatePresence>
                {selectedBiz ? (
                  <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }} className={styles.detailCard}>
                    <div className={styles.detailHeader}>
                      <h3>{selectedBiz.businessName || selectedBiz.businessId}</h3>
                      <button className={styles.closeBtn} onClick={() => setSelectedBiz(null)}>Close</button>
                    </div>

                    <div className={styles.detailRow}>
                      <div className={styles.detailLabel}>Owner</div>
                      <div className={styles.detailValue}>{selectedBiz.otherInfo?.ownerName || "—"}</div>
                    </div>

                    <div className={styles.detailRow}>
                      <div className={styles.detailLabel}>Business Email</div>
                      <div className={styles.detailValue}>{selectedBiz.businessEmail || "—"}</div>
                    </div>

                    <div className={styles.detailRow}>
                      <div className={styles.detailLabel}>Orders</div>
                      <div className={styles.detailValue}>{(selectedBiz.orders || []).length}</div>
                    </div>

                    <div className={styles.detailRow}>
                      <div className={styles.detailLabel}>Plan</div>
                      <div className={styles.detailValue}>{selectedBiz.plan?.plan || "free"}</div>
                    </div>

                    <div className={styles.detailRow}>
                      <div className={styles.detailLabel}>Total Page Views</div>
                      <div className={styles.detailValue}>{(selectedBiz.pageViews || []).reduce((s, p) => s + Number(p.views || 0), 0)}</div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.detailEmpty}>
                    <p>Select a business to see details</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </aside>
          </main>
        </div>
      )}
    </div>
  );
}
