import styles from "./notificationPanel.module.css";
import { auth, db } from "../src/hooks/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState({
    primaryColor: "#1C2230",
    secondaryColor: "#43B5F4",
  });
  const navigate = useNavigate();
  
useEffect(() => {
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Step 1: Get businessId from user document
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return;

      const { businessId } = userSnap.data();
      if (!businessId) return;

      // Step 2: Get business data from businesses collection
      const bizDocRef = doc(db, "businesses", businessId);
      const bizSnap = await getDoc(bizDocRef);
      if (!bizSnap.exists()) return;

      const data = bizSnap.data();
      const plan = data?.plan?.plan || "free";
      const notifications = data?.notifications || [];

      const primary = data?.customTheme?.primaryColor || "";
      const secondary = data?.customTheme?.secondaryColor || "";

      setTheme({
        primaryColor: plan === "pro" && primary !== "" ? primary : "#1C2230",
        secondaryColor: plan === "pro" && secondary !== "" ? secondary : "#43B5F4",
      });

      const sorted = notifications
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setNotifications(sorted);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
    setLoading(false);
  };

  fetchNotifications();
}, []);


  return (
    <div className={styles.NotificationPanel}>
      {loading ? (
        <div className={styles.loading}>
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.noNotification}>
          <i className="fa-solid fa-envelope"></i>
          <p>No notifications</p>
        </div>
      ) : (
        <div className={styles.notifications}>
          {notifications.map((note, index) => (
            <div
              key={index}
              className={styles.notification}
              style={{
                backgroundColor: theme.primaryColor,
                opacity: note.read ? 0.6 : 1,
              }}
              onClick={() => {
              if(note.link) navigate(`${note.link}`)
              }}
            >
              <div className={styles.notificationIcon}>
                <i
                  className="fa-solid fa-bell"
                  style={{ color: theme.secondaryColor }}
                ></i>
              </div>
              <div className={styles.notificationInfo}>
                <div className={styles.notificationText}>{note.text}</div>
                <div className={styles.notificationDate}>
                  {new Date(note.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
