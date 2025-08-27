import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./liveChecker.module.css";
import defaultLogo from "../src/images/logo.png";
import { db } from "../src/hooks/firebase";
import { doc, getDoc } from "firebase/firestore";

const LiveChecker = ({ storeId }) => {
  const [loading, setLoading] = useState({
    main: true,
    activate: false,
    share: false,
    copy: false,
  });
  const [businessData, setBusinessData] = useState(null);
  const [warning, setWarning] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinessData = async () => {
      setLoading(prev => ({ ...prev, main: true }));
      try {
        const businessRef = doc(db, "businesses", storeId);
        const businessSnap = await getDoc(businessRef);

        if (!businessSnap.exists()) {
          setWarning("Business not found.");
          return;
        }

        const data = businessSnap.data();
        setBusinessData(data);

        const hasProductOrService = (data.products?.length > 0) || (data.services?.length > 0);
        const hasAccount = !!data.subAccount;

        if (!hasProductOrService) {
          setWarning("noProducts");
        } else if (!hasAccount) {
          setWarning("noAccount");
        } else {
          setWarning(null);
        }
      } catch (error) {
        setWarning("Failed to load store details.");
        console.error(error);
      } finally {
        setLoading(prev => ({ ...prev, main: false }));
      }
    };

    if (storeId) fetchBusinessData();
  }, [storeId]);

  const handleVisit = () => {
    window.open(`https://${storeId}.minimart.ng`, "_blank");
  };

  const handleShare = async () => {
    setLoading(prev => ({ ...prev, share: true }));
    try {
      const shareData = {
        title: `${businessData?.businessName || "Our Store"}`,
        text: "Check out our store!",
        url: `https://${storeId}.minimart.ng`,
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareData.url);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setLoading(prev => ({ ...prev, share: false }));
    }
  };

  const handleCopy = async () => {
    setLoading(prev => ({ ...prev, copy: true }));
    try {
      await navigator.clipboard.writeText(`https://${storeId}.minimart.ng`);
      alert("Link copied!");
    } catch (err) {
      console.error("Copy failed:", err);
    } finally {
      setLoading(prev => ({ ...prev, copy: false }));
    }
  };

  if (loading.main) {
    return (
      <div className={styles.loadingContainer}>
        <i className="fa-solid fa-spinner fa-spin"></i> Checking store status...
      </div>
    );
  }

  if (warning === "noProducts") {
    return (
      <div
        className={`${styles.warningBox} ${styles.clickable}`}
        onClick={() => navigate("/catalogue")}
      >
        <p className={styles.mainText}>
          <strong>No products or services found!</strong> Add at least one to go live.
        </p>
       <p className={styles.subText}><i class="fa-solid fa-angles-right"></i></p>
      </div>
    );
  }

  if (warning === "noAccount") {
    return (
      <div
        className={`${styles.warningBox} ${styles.clickable}`}
        onClick={() => navigate("/settings/payments")}
      >
        <p className={styles.mainText}>
          <strong>No payout account found!</strong> Add one to activate your store.
        </p>
       <p className={styles.subText}><i class="fa-solid fa-angles-right"></i></p>
      </div>
    );
  }

  return (
    <div className={styles.checkerContainer}>
      <div className={styles.storeAccountActive}>
        <div className={styles.topActive}>
          <div className={styles.logo}>
            <img
              src={
                businessData?.customTheme?.logo
                  ? businessData.customTheme.logo
                  : defaultLogo
              }
              alt="Store Logo"
            />
          </div>
          <div className={styles.textArea}>
            <p>
              Your store is active{" "}
              <span className={styles.active}></span>
            </p>
          </div>
        </div>

        <div className={styles.bottomActive}>
          <button onClick={handleVisit}>
            {loading.activate ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-braille"></i>
            )}{" "}
            Visit store
          </button>

          <button onClick={handleShare}>
            {loading.share ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-share-nodes"></i>
            )}{" "}
            Share link
          </button>

          <button onClick={handleCopy}>
            {loading.copy ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-copy"></i>
            )}{" "}
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChecker;
