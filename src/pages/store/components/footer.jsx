import { useEffect, useState } from "react";
import { db } from "../../../hooks/firebase";
import { doc, getDoc } from "firebase/firestore";
import styles from "./footer.module.css";

const Footer = ({ storeId }) => {
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const docRef = doc(db, "businesses", storeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBusiness(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching business data:", err);
      }
    };

    fetchBusiness();
  }, [storeId]);

  if (!business) return null;

  const {
    businessName,
    description,
    storeLocation,
    businessEmail,
    mainContactPlatform,
    mainContactValue,
    otherInfo,
  } = business;

  return (
    <footer className={styles.footer}>
      <div className={styles.section}>
        <h3>{businessName}</h3>
        {description && <p>{description}</p>}
        {storeLocation && (
          <p>
            <i className="fa-solid fa-location-dot"></i> {storeLocation}
          </p>
        )}
      </div>

      <div className={styles.section}>
        {businessEmail && (
          <p>
            <i className="fa-solid fa-envelope"></i> {businessEmail}
          </p>
        )}
        {mainContactPlatform && mainContactValue && (
          <p>
            <i className="fa-solid fa-comment-dots"></i> {mainContactPlatform}:{" "}
            {mainContactValue}
          </p>
        )}
      </div>

      {otherInfo && Object.keys(otherInfo).length > 0 && (
        <div className={styles.section}>
          <h4>More Info</h4>
          <ul className={styles.otherList}>
            {Object.entries(otherInfo).map(([key, val]) => (
              <li key={key}>
                <b>{key}</b>: {val}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.bottomNote}>
        &copy; {new Date().getFullYear()} {businessName} | Powered by Minimart
      </div>
    </footer>
  );
};

export default Footer;
