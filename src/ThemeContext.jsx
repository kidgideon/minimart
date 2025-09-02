import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./hooks/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState({
    primaryColor: DEFAULT_PRIMARY,
    secondaryColor: DEFAULT_SECONDARY,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribed = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/"); // Redirect to home if not logged in
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) throw new Error("User document not found");

        const { businessId } = userDoc.data();
        if (!businessId) throw new Error("No businessId linked to user");

        const businessDoc = await getDoc(doc(db, "businesses", businessId));
        if (!businessDoc.exists()) throw new Error("Business not found");

        const businessData = businessDoc.data();
        const plan = businessData?.plan?.plan || "free";

        let primary = DEFAULT_PRIMARY;
        let secondary = DEFAULT_SECONDARY;

        if (
          plan === "pro" &&
          businessData.customTheme?.primaryColor?.trim() &&
          businessData.customTheme?.secondaryColor?.trim()
        ) {
          primary = businessData.customTheme.primaryColor;
          secondary = businessData.customTheme.secondaryColor;
        }

        if (!unsubscribed) {
          setTheme({ primaryColor: primary, secondaryColor: secondary });

          // Inject into root
          document.documentElement.style.setProperty("--primary-color", primary);
          document.documentElement.style.setProperty("--secondary-color", secondary);
        }
      } catch (err) {
        console.error("Error loading theme:", err);
      } finally {
        if (!unsubscribed) setLoading(false);
      }
    });

    return () => {
      unsubscribed = true;
      unsubscribeAuth();
    };
  }, [navigate]);

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
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
