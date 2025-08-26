import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../src/hooks/firebase";
import Navbar from "../businessComponent/navbar";
import RevenueOverTime from "../businessComponent/revenueOverTime";
import MostViewedProducts from "../businessComponent/viewed";
import MostPurchasedItem from "../businessComponent/purchased";

const Analysis = () => {
  const [storeId, setStoreId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setStoreId(userSnap.data().businessId);
        }
      } else {
        setStoreId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container">
      <Navbar />
      <div className="displayArea">
        {storeId && <RevenueOverTime storeId={storeId} />}
           {storeId && <MostPurchasedItem storeId={storeId} />}
         {storeId && <MostViewedProducts storeId={storeId} />}
      </div>
    </div>
  );
};

export default Analysis;
