import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../src/hooks/firebase";
import Navbar from "../businessComponent/navbar";
import Sales from "../businessComponent/sales";
import PageViewAnalysis from "../businessComponent/pageviewsanalysis";
import LiveChecker from "../businessComponent/liveChecker";

const Dashboard = () => {
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
      {/* tell the user what to do to get his store Live  */}
      <div className="displayArea">
        {storeId && <LiveChecker storeId={storeId} />}
        {storeId && <Sales storeId={storeId} />}
        {storeId && <PageViewAnalysis storeId={storeId} />}
      </div>
    </div>
  );
};

export default Dashboard;
