import styles from "./notificationPanel.module.css";
import { auth, db } from "../src/hooks/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState({
    primaryColor: "#1C2230",
    secondaryColor: "#43B5F4",
  });
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribed = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user || unsubscribed) return;

      setLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) return;

        const { businessId } = userSnap.data();
        if (!businessId) return;

        const bizDocRef = doc(db, "businesses", businessId);
        const bizSnap = await getDoc(bizDocRef);
        if (!bizSnap.exists()) return;

        const data = bizSnap.data();
        const plan = data?.plan?.plan || "free";
        const notifications = data?.notifications || [];

        const primary = data?.customTheme?.primaryColor || "";
        const secondary = data?.customTheme?.secondaryColor || "";

        setTheme({
          primaryColor: plan === "pro" && primary.trim() ? primary : "#1C2230",
          secondaryColor: plan === "pro" && secondary.trim() ? secondary : "#43B5F4",
        });

        const sorted = notifications
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setNotifications(sorted);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
      setLoading(false);
    });

    return () => {
      unsubscribed = true;
      unsubscribeAuth();
    };
  }, []);

  const handleNotificationClick = async (note, index) => {
    // Update read status in state immediately
    const updated = [...notifications];
    updated[index] = { ...note, read: true };
    setNotifications(updated);

    // Navigate if there’s a link
    if (note.link) navigate(`${note.link}`);

    // Update Firestore
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return;

      const { businessId } = userSnap.data();
      if (!businessId) return;

      const bizDocRef = doc(db, "businesses", businessId);

      // Update the specific notification read status in Firestore
      const bizSnap = await getDoc(bizDocRef);
      if (!bizSnap.exists()) return;

      const bizData = bizSnap.data();
      const updatedNotifications = (bizData.notifications || []).map((n) =>
        n.date === note.date && n.text === note.text ? { ...n, read: true } : n
      );

      await updateDoc(bizDocRef, { notifications: updatedNotifications });
    } catch (err) {
      console.error("Error updating notification read status:", err);
    }
  };

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
              onClick={() => handleNotificationClick(note, index)}
            >
              <div className={styles.notificationIcon}>
                <i className="fa-solid fa-bell"></i>
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
