import styles from "./notificationPanel.module.css";
import { auth, db } from "../src/hooks/firebase";
import { useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";

const fetchNotificationsData = async () => {
  const user = await new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (authUser) => {
        unsubscribe();
        if (authUser) resolve(authUser);
        else reject(new Error("User not authenticated"));
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });

  const userDocRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) throw new Error("User not found");

  const { businessId } = userSnap.data();
  if (!businessId) throw new Error("No businessId linked to user");

  const bizDocRef = doc(db, "businesses", businessId);
  const bizSnap = await getDoc(bizDocRef);
  if (!bizSnap.exists()) throw new Error("Business not found");

  const data = bizSnap.data();
  const plan = data?.plan?.plan || "free";

  const primary = data?.customTheme?.primaryColor?.trim()
    ? data.customTheme.primaryColor
    : "#1C2230";
  const secondary = data?.customTheme?.secondaryColor?.trim()
    ? data.customTheme.secondaryColor
    : "#43B5F4";

  const sortedNotifications = (data?.notifications || []).slice().sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return {
    notifications: sortedNotifications,
    theme: {
      primaryColor: plan === "pro" ? primary : "#1C2230",
      secondaryColor: plan === "pro" ? secondary : "#43B5F4",
    },
    businessId,
  };
};

const NotificationPanel = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notificationsData"],
    queryFn: fetchNotificationsData,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const notifications = data?.notifications || [];
  const theme = data?.theme || {
    primaryColor: "#1C2230",
    secondaryColor: "#43B5F4",
  };
  const businessId = data?.businessId;

  const handleNotificationClick = async (note, index) => {
    if (!businessId) return;

    // Optimistically update cache
    queryClient.setQueryData(["notificationsData"], (oldData) => {
      if (!oldData) return oldData;
      const updatedNotifications = [...oldData.notifications];
      updatedNotifications[index] = { ...note, read: true };
      return { ...oldData, notifications: updatedNotifications };
    });

    if (note.link) navigate(note.link);

    // Persist change to Firestore
    try {
      const bizDocRef = doc(db, "businesses", businessId);
      const bizSnap = await getDoc(bizDocRef);
      if (!bizSnap.exists()) return;

      const bizData = bizSnap.data();
      const updatedNotifications = (bizData.notifications || []).map((n) =>
        n.date === note.date && n.text === note.text ? { ...n, read: true } : n
      );

      await updateDoc(bizDocRef, { notifications: updatedNotifications });
    } catch (err) {
      console.error("Error updating notification read status:", err);
      // Rollback optimistic update if needed
      queryClient.invalidateQueries(["notificationsData"]);
    }
  };

  return (
    <div className={styles.NotificationPanel}>
      {isLoading ? (
        <div className={styles.loading}>
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>
      ) : isError ? (
        <div className={styles.noNotification}>
          <i className="fa-solid fa-exclamation-triangle"></i>
          <p>Failed to load notifications</p>
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
