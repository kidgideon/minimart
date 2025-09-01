import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import styles from "./liveChecker.module.css";
import defaultLogo from "../src/images/logo.png";
import { db, auth } from "../src/hooks/firebase";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { onAuthStateChanged } from "firebase/auth";

const fetchBusinessData = async (storeId, user) => {
  if (!user) throw new Error("User not authenticated");
  if (!storeId) throw new Error("No storeId provided");

  const businessRef = doc(db, "businesses", storeId);
  const businessSnap = await getDoc(businessRef);
  if (!businessSnap.exists()) throw new Error("Business not found");

  return businessSnap.data();
};

const LiveChecker = ({ storeId }) => {
  const [user, setUser] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const navigate = useNavigate();

  // Listen for auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // TanStack Query for fetching business data
  const { data: businessData, error, isLoading, isFetching } = useQuery({
    queryKey: ["businessData", storeId, user?.uid],
    queryFn: () => fetchBusinessData(storeId, user),
    enabled: !!user && !!storeId, // Only run when both are available
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1, // Retry once if failed
  });

  const cleanStoreUrl = `https://${storeId}.minimart.ng`.replace(/\/+$/, ""); // Remove trailing slash

  const handleVisit = () => {
    window.open(cleanStoreUrl, "_blank");
  };
const handleShare = async (id) => {
 
  try {
    if (navigator.share) {
      await navigator.share({
        url: cleanStoreUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  } catch (err) {
    console.error("Share failed:", err);
    alert("Unable to share this product.");
  }
};


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanStoreUrl);
      toast.success("Link copied!");
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className={styles.loadingContainer}>
        <i className="fa-solid fa-spinner fa-spin"></i> Checking store status...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.warningBox}>
        <p className={styles.mainText}>{error.message}</p>
      </div>
    );
  }

  const hasProductOrService =
    (businessData?.products?.length > 0) || (businessData?.services?.length > 0);
  const hasAccount = !!businessData?.subAccount;

  if (!hasProductOrService) {
    return (
      <div
        className={`${styles.warningBox} ${styles.clickable}`}
        onClick={() => navigate("/catalogue")}
      >
        <p className={styles.mainText}>
          <strong>No products or services found!</strong> Add at least one to go live.
        </p>
        <p className={styles.subText}>
          <i className="fa-solid fa-angles-right"></i>
        </p>
      </div>
    );
  }

  if (!hasAccount) {
    return (
      <div
        className={`${styles.warningBox} ${styles.clickable}`}
        onClick={() => navigate("/settings/payments")}
      >
        <p className={styles.mainText}>
          <strong>No payout account found!</strong> Add one to activate your store.
        </p>
        <p className={styles.subText}>
          <i className="fa-solid fa-angles-right"></i>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.checkerContainer}>
      <div className={styles.storeAccountActive}>
        <div className={styles.topActive}>
          <div className={styles.logo}>
            <img
              src={businessData?.customTheme?.logo || defaultLogo}
              alt="Store Logo"
            />
          </div>
          <div className={styles.textArea}>
            <p>
              Your store is active <span className={styles.active}></span>
            </p>
          </div>
        </div>

        <div className={styles.bottomActive}>
          <button onClick={handleVisit}>
            <i className="fa-solid fa-braille"></i> Visit store
          </button>

          <button onClick={handleShare} disabled={isSharing}>
            <i className="fa-solid fa-share-nodes"></i> 
            {isSharing ? " Sharing..." : " Share link"}
          </button>

          <button onClick={handleCopy}>
            <i className="fa-solid fa-copy"></i> Copy link
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChecker;
