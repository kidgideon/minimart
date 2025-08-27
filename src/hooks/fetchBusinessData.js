// src/hooks/useBusinessData.js
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../hooks/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const fetchBusinessData = async () => {
  // Wait for authentication state to be resolved
  const user = await new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (authUser) => {
        unsubscribe(); // clean up listener immediately
        if (authUser) {
          resolve(authUser);
        } else {
          reject(new Error("User not authenticated"));
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });

  // Step 1: Fetch user document
  const userDocRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) throw new Error("User not found");

  const { businessId } = userSnap.data();
  if (!businessId) throw new Error("No businessId linked to user");
  console.log(businessId)

  // Step 2: Fetch business document
  const bizDocRef = doc(db, "businesses", businessId);
  const bizSnap = await getDoc(bizDocRef);
  if (!bizSnap.exists()) throw new Error("Business not found");

  const data = bizSnap.data();

  console.log(data)

  return {
    bizName: data.businessName || "",
    plan: data.plan?.plan || "free",
    logo: data.customTheme?.logo || null,
    notifications: Array.isArray(data.notifications) ? data.notifications : []
  };
};
