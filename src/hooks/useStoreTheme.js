import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // adjust this import path as needed

const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const applyThemeToRoot = (primary, secondary) => {
  document.documentElement.style.setProperty("--storePrimary", primary || DEFAULT_PRIMARY);
  document.documentElement.style.setProperty("--storeSecondary", secondary || DEFAULT_SECONDARY);
};

const useStoreTheme = (storeId) => {
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState({
    primary: DEFAULT_PRIMARY,
    secondary: DEFAULT_SECONDARY,
  });

  useEffect(() => {
    if (!storeId) {
      setError("Missing storeId");
      setLoading(false);
      return;
    }

    const fetchBiz = async () => {
      try {
        const bizRef = doc(db, "businesses", storeId);
        const snap = await getDoc(bizRef);

        if (!snap.exists()) {
          setError("Store not found");
          setLoading(false);
          return;
        }

        const data = snap.data();
        setBiz(data);

        const custom = data.customTheme || {};
        const primary = custom.primaryColor?.trim() || DEFAULT_PRIMARY;
        const secondary = custom.secondaryColor?.trim() || DEFAULT_SECONDARY;

        setTheme({ primary, secondary });
        applyThemeToRoot(primary, secondary);

      } catch (err) {
        console.error("Failed to load theme:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchBiz();
  }, [storeId]);

  return { biz, loading, error, theme };
};

export default useStoreTheme;
