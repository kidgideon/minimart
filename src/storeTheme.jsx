import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./hooks/firebase";// adjust import path to your firebase config
import { doc, getDoc } from "firebase/firestore";

const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const StoreThemeContext = createContext();

export const useStoreTheme = () => useContext(StoreThemeContext);

export const StoreThemeProvider = ({ storeId, children }) => {
  const [theme, setTheme] = useState({
    primaryColor: DEFAULT_PRIMARY,
    secondaryColor: DEFAULT_SECONDARY,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    let unsubscribed = false;

    const loadTheme = async () => {
      try {
        const businessDoc = await getDoc(doc(db, "businesses", storeId));
        if (!businessDoc.exists()) throw new Error("Business not found");

        const businessData = businessDoc.data();
        let primary = DEFAULT_PRIMARY;
        let secondary = DEFAULT_SECONDARY;

        if (
          businessData.customTheme?.primaryColor?.trim() &&
          businessData.customTheme?.secondaryColor?.trim()
        ) {
          primary = businessData.customTheme.primaryColor;
          secondary = businessData.customTheme.secondaryColor;
        }

        if (!unsubscribed) {
          setTheme({ primaryColor: primary, secondaryColor: secondary });

          // inject into root as --storePrimary / --storeSecondary
          document.documentElement.style.setProperty("--storePrimary", primary);
          document.documentElement.style.setProperty("--storeSecondary", secondary);
        }
      } catch (err) {
        console.error("Error loading store theme:", err);
      } finally {
        if (!unsubscribed) setLoading(false);
      }
    };

    loadTheme();

    return () => {
      unsubscribed = true;
    };
  }, [storeId]);

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff"
      }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 28, color: DEFAULT_PRIMARY }}></i>
      </div>
    );
  }

  return (
    <StoreThemeContext.Provider value={theme}>
      {children}
    </StoreThemeContext.Provider>
  );
};
