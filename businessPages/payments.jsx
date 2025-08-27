import { useEffect, useState } from "react";
import styles from "./payments.module.css";
import Navbar from "../businessComponent/navbar";
import { db, auth } from "../src/hooks/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { getPaystackBanks, validateAccount, createSubAccount } from "../src/hooks/paystackHooks";

const Payments = () => {
  const [businessRef, setBusinessRef] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [subAccount, setSubAccount] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    accNo: "",
    bankCode: "",
    accName: "",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const businessId = userDoc.data().businessId;
          if (businessId) {
            const bizRef = doc(db, "businesses", businessId);
            setBusinessRef(bizRef);
            const bizDoc = await getDoc(bizRef);
            if (bizDoc.exists()) {
              const bizData = bizDoc.data();
              setBusinessName(bizData.businessName || "");
              setSubAccount(bizData.subAccount || null);
            }
          }
        }
      }
    });
    getPaystackBanks().then(setBanks);
    return () => unsub();
  }, []);

  const handleValidate = async () => {
    if (!form.accNo || !form.bankCode) {
      toast.error("Enter account number and select bank");
      return;
    }
    setLoading(true);
    try {
      const accName = await validateAccount(form.accNo, form.bankCode);
      setForm((f) => ({ ...f, accName }));
      toast.success("Account validated");
    } catch {
      toast.error("Failed to validate account");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!businessRef || !form.accNo || !form.bankCode || !form.accName) {
      toast.error("Fill all fields and validate account");
      return;
    }
    setLoading(true);
    try {
      const subAcc = await createSubAccount({
        businessName,
        accNo: form.accNo,
        bankCode: form.bankCode,
        accName: form.accName,
      });
      await updateDoc(businessRef, { subAccount: subAcc });
      setSubAccount(subAcc);
      setPopupOpen(false);
      toast.success(isEditing ? "Business account updated" : "Business account added");
    } catch {
      toast.error("Failed to save account");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!subAccount) return;
    setForm({
      accNo: subAccount.account_number || "",
      bankCode: subAccount.settlement_bank_code || "",
      accName: "", // force re-validation
    });
    setIsEditing(true);
    setPopupOpen(true);
  };

  return (
    <div className="container">
      <Navbar />
      <div className="displayArea">

        {/* Bold tip at top */}
        <div className={styles.tipBox}>
          <p>
            <b>Note:</b> All earnings for a business day will be paid the next business day,
            in accordance with Paystack payout rules. Your funds are safe and secure.
          </p>
        </div>

        {/* Store Currency */}
        <div className={styles.currencySection}>
          <p>Store Currency</p>
          <div className={styles.currencyRow}>
            <span>Naira (₦)</span>
          </div>
        </div>

        {/* Payment Method Display */}
        <div className={styles.paymentOptions}>
          <div className={styles.top}>
            <p>Business Account</p>
            {!subAccount && (
              <button onClick={() => { setIsEditing(false); setPopupOpen(true); }}>
                <i className="fa-solid fa-plus"></i>
              </button>
            )}
          </div>

          {subAccount ? (
            <div className={styles.paymentForm}>
              <label>Bank Name</label>
              <input type="text" value={subAccount.settlement_bank} readOnly />
              <label>Account Number</label>
              <input type="text" value={subAccount.account_number} readOnly />
              <label>Account Name</label>
              <input type="text" value={subAccount.account_name} readOnly />
              <label>Business Name</label>
              <input type="text" value={subAccount.business_name} readOnly />
              <button className={styles.editBtn} onClick={openEditModal}>
                <i style={{margin: "0px 5px"}} className="fa-solid fa-pen-to-square"></i>{" "} Update Bank Info
              </button>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div><i className="fa-solid fa-credit-card"></i></div>
              <h3>No business account yet</h3>
              <p>Click the plus icon to add your business account.</p>
            </div>
          )}
        </div>

        {/* Add/Edit Account Popup */}
        <AnimatePresence>
          {popupOpen && (
            <motion.div
              className={styles.popupOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={styles.popup}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <h3>{isEditing ? "Edit business account" : "Add business account"}</h3>
                <div className={styles.tipBox}>
                  <p>
                    <b>Note:</b> Once your bank account is saved, payouts will use the latest verified details.
                    Please ensure your account is valid to avoid payout delays.
                  </p>
                </div>
                <label>Account Number</label>
                <input
                  value={form.accNo}
                  onChange={(e) => setForm({ ...form, accNo: e.target.value, accName: "" })}
                  maxLength={10}
                />
                <label>Bank</label>
                <select
                  value={form.bankCode}
                  onChange={(e) => setForm({ ...form, bankCode: e.target.value, accName: "" })}
                >
                  <option value="">Select bank</option>
                  {banks.map((b, idx) => (
                    <option key={`${b.code}-${idx}`} value={b.code}>{b.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleValidate}
                  disabled={loading || !form.accNo || !form.bankCode}
                >
                  {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Validate Account"}
                </button>
                {form.accName && (
                  <div className={styles.validatedName}>
                    <p><b>{form.accName}</b></p>
                  </div>
                )}
                <div className={styles.popupActions}>
                  <button onClick={() => setPopupOpen(false)}>Cancel</button>
                  <button
                    onClick={handleSaveAccount}
                    disabled={loading || !form.accName}
                  >
                    {loading ? <i className="fa-solid fa-spinner fa-spin"></i> :
                      isEditing ? "Save Changes" : "Add Account"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Payments;
