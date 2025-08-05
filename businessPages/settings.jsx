import { useState, useEffect, useMemo } from "react";
import styles from "./settings.module.css";
import Navbar from "../businessComponent/navbar";
import { auth, db } from "../src/hooks/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";

const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const SETTINGS = [
  {
    icon: "fas fa-paint-brush",
    main: "Store Appearance",
    sub: "Theme colors, logo, banners, layout",
    route: "/settings/appearance",
    keywords: ["theme", "appearance", "logo", "banner", "layout", "color", "store", "design", ],
  },
  {
    icon: "fas fa-money-bill-wave",
    main: "Currency & Payments",
    sub: "Set your store currency and payment methods",
    route: "/settings/payments",
    keywords: ["currency", "payment", "money", "pay", "method"],
  },
  {
    icon: "fas fa-lock",
    main: "Account & Security",
    sub: "Change password, delete account, or reset store",
    route: "/settings/security",
    keywords: ["account", "security", "password", "delete", "reset"],
  },
  {
    icon: "fas fa-briefcase",
    main: "Business Information",
    sub: "Name, location, description, contact platform & link",
    route: "/settings/business",
    keywords: ["business", "info", "name", "location", "contact", "description"],
  },
  {
    icon: "fas fa-credit-card",
    main: "Billing & Plans",
    sub: "Top up credits, upgrade plan",
    route: "/settings/billing",
    keywords: ["billing", "plan", "credit", "upgrade", "top up"],
  },
  {
    icon: "fas fa-bell",
    main: "Notifications",
    sub: "Control email and in-app alerts",
    route: "/settings/notifications",
    keywords: ["notification", "alert", "email", "in-app"],
  },
];

const Settings = () => {
  const [themeColors, setThemeColors] = useState({
    primary: DEFAULT_PRIMARY,
    secondary: DEFAULT_SECONDARY,
  });
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    let unsubscribed = false;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user || unsubscribed) return;
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) throw new Error("User not found");
        const { businessId } = userSnap.data();
        if (!businessId) throw new Error("No businessId linked to user");
        const bizDocRef = doc(db, "businesses", businessId);
        const bizSnap = await getDoc(bizDocRef);
        if (!bizSnap.exists()) throw new Error("Business not found");
        const data = bizSnap.data();
        const planType = data.plan?.plan || "free";
        setPlan(planType);
        let primary = DEFAULT_PRIMARY, secondary = DEFAULT_SECONDARY;
        if (
          planType === "pro" &&
          data.customTheme?.primaryColor?.trim() &&
          data.customTheme?.secondaryColor?.trim()
        ) {
          primary = data.customTheme.primaryColor;
          secondary = data.customTheme.secondaryColor;
        }
        setThemeColors({ primary, secondary });
      } catch {
        setThemeColors({ primary: DEFAULT_PRIMARY, secondary: DEFAULT_SECONDARY });
        setPlan("free");
      }
    });
    return () => {
      unsubscribed = true;
      unsubscribeAuth();
    };
  }, []);

  // Filter settings by search
  const filteredSettings = useMemo(() => {
    if (!search.trim()) return SETTINGS;
    const s = search.trim().toLowerCase();
    return SETTINGS.filter(
      set =>
        set.main.toLowerCase().includes(s) ||
        set.sub.toLowerCase().includes(s) ||
        set.keywords.some(k => k.includes(s))
    );
  }, [search]);

  return (
    <div
      className="container"
      style={{
        "--primary-color": themeColors.primary,
        "--secondary-color": themeColors.secondary,
      }}
    >
      <Navbar />
      <div className="displayArea">
        <div className={styles.interface}>
          <h1>
            <i className="fa-solid fa-gear"></i> Settings
          </h1>
          <div className={styles.search}>
            <input
              type="text"
              placeholder="search for setting"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ color: "var(--primary-color)" }}
            />
            <button>
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>
          <div className={styles.settingsBoxes}>
            {filteredSettings.length === 0 ? (
              <div style={{ color: "var(--primary-color)", fontWeight: 600, padding: 40 }}>
                <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }}></i>
                No settings found.
              </div>
            ) : (
              filteredSettings.map((setting, idx) => (
                <Link
                  to={setting.route}
                  key={setting.main}
                  className={styles.settingsBox}
                  style={{
                    border: "2px solid var(--secondary-color)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  tabIndex={0}
                >
                  <div
                    className={styles.icon}
                    style={{
                      color: "var(--secondary-color)",
                      transition: "color 0.2s, transform 0.2s",
                    }}
                  >
                    <i className={setting.icon}></i>
                  </div>
                  <div className={styles.info}>
                    <p className={styles.mainText} style={{ color: "var(--primary-color)" }}>
                      {setting.main}
                    </p>
                    <p className={styles.subText}>{setting.sub}</p>
                  </div>
                  <div className={styles.click} style={{ color: "var(--primary-color)" }}>
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
      <style>
        {`
          .${styles.settingsBox}:hover, .${styles.settingsBox}:focus {
            box-shadow: 0 4px 24px 0 rgba(67,181,244,0.10);
            transform: translateY(-4px) scale(1.03);
            border-color: var(--secondary-color);
            background: rgba(67,181,244,0.06);
          }
          .${styles.icon}:hover, .${styles.icon}:focus {
            color: var(--secondary-color);
            transform: scale(1.15) rotate(-8deg);
          }
        `}
      </style>
    </div>
  );
};

export default Settings;