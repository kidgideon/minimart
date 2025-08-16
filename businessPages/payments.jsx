import { useEffect, useState } from "react";
import styles from "./payments.module.css";
import Navbar from "../businessComponent/navbar";
import { db, auth } from "../src/hooks/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const Payments = () => {
  const [currency, setCurrency] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState(null);
  const [editingMethod, setEditingMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [methodForm, setMethodForm] = useState({
    type: "Bank Transfer",
    accName: "",
    accNo: "",
    bankName: "",
  });
  const [businessRef, setBusinessRef] = useState(null);

  const currencies = [
    { name: "Naira", symbol: "₦" },
    { name: "US Dollar", symbol: "$" },
    { name: "Euro", symbol: "€" },
    { name: "Pound Sterling", symbol: "£" },
    { name: "South African Rand", symbol: "R" },
    { name: "Ghanaian Cedi", symbol: "₵" },
    { name: "Kenyan Shilling", symbol: "KSh" },
    { name: "Tanzanian Shilling", symbol: "TSh" },
    { name: "Ugandan Shilling", symbol: "USh" },
    { name: "Egyptian Pound", symbol: "E£" },
    { name: "Moroccan Dirham", symbol: "MAD" },
    { name: "Ethiopian Birr", symbol: "Br" },
    { name: "Algerian Dinar", symbol: "DA" },
    { name: "Tunisian Dinar", symbol: "DT" },
    { name: "Libyan Dinar", symbol: "LD" },
    { name: "West African CFA franc", symbol: "CFA" },
    { name: "Central African CFA franc", symbol: "FCFA" },
    { name: "Malagasy Ariary", symbol: "Ar" },
    { name: "Botswana Pula", symbol: "P" },
    { name: "Zambian Kwacha", symbol: "ZK" },
  ];

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
              setCurrency(bizData.storeCurrency || "");
              setCurrencySymbol(bizData.currencySymbol || "");
              setPaymentMethods(bizData.paymentMethods || []);
            }
          }
        }
      }
    });
    return () => unsub();
  }, []);

  const saveCurrency = async () => {
    if (!businessRef) return;
    setLoading(true);
    try {
      await updateDoc(businessRef, {
        storeCurrency: currency,
        currencySymbol: currencySymbol,
      });
      toast.success("Currency updated");
    } catch {
      toast.error("Failed to update currency");
    } finally {
      setLoading(false);
    }
  };

  const openPopup = (method = null) => {
    setEditingMethod(method);
    setMethodForm(
      method || { type: "Bank Transfer", accName: "", accNo: "", bankName: "" }
    );
    setPopupOpen(true);
  };

  const savePaymentMethod = async () => {
    if (!businessRef) return;
    const { type, accName, accNo, bankName } = methodForm;

    if (!accName.trim() || !accNo.trim() || !bankName.trim()) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      let updatedMethods;
      if (editingMethod) {
        updatedMethods = paymentMethods.map((m) =>
          m.accNo === editingMethod.accNo ? methodForm : m
        );
      } else {
        updatedMethods = [...paymentMethods, methodForm];
      }
      await updateDoc(businessRef, { paymentMethods: updatedMethods });
      setPaymentMethods(updatedMethods);
      toast.success(editingMethod ? "Payment method updated" : "Payment method added");
      setPopupOpen(false);
    } catch {
      toast.error("Failed to save payment method");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (method) => {
    setMethodToDelete(method);
    setConfirmOpen(true);
  };

  const deletePaymentMethod = async () => {
    if (!businessRef || !methodToDelete) return;
    setLoading(true);
    try {
      const updatedMethods = paymentMethods.filter(
        (m) => m.accNo !== methodToDelete.accNo
      );
      await updateDoc(businessRef, { paymentMethods: updatedMethods });
      setPaymentMethods(updatedMethods);
      toast.success("Payment method deleted");
      setConfirmOpen(false);
      setMethodToDelete(null);
    } catch {
      toast.error("Failed to delete payment method");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Navbar />
      <div className="displayArea">
        <div className={styles.currencySection}>
          <p>Store Currency</p>
          <div className={styles.currencyRow}>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                const selected = currencies.find((c) => c.name === e.target.value);
                setCurrencySymbol(selected?.symbol || "");
              }}
            >
              <option value="">Select currency</option>
              {currencies.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <button onClick={saveCurrency} disabled={loading}>
              {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Save"}
            </button>
          </div>
        </div>

        <div className={styles.paymentOptions}>
          <div className={styles.top}>
            <p>Payment Methods</p>
            <button onClick={() => openPopup()}>
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <div className={styles.cards}>
            {paymentMethods.length === 0 ? (
              <div className={styles.emptyState}>
                <div><i className="fa-solid fa-credit-card"></i></div>
                <h3>No payment methods yet</h3>
                <p>Click the plus icon to create your first payment method.</p>
              </div>
            ) : (
              paymentMethods.map((method, index) => (
                <motion.div
                  className={styles.paymentCard}
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h4>{method.type}</h4>
                  <p>{method.accName}</p>
                  <p>{method.accNo}</p>
                  <p>{method.bankName}</p>
                  <div className={styles.cardActions}>
                    <button className={styles.edit} onClick={() => openPopup(method)}>Edit</button>
                    <button
                      className={styles.delete}
                      onClick={() => confirmDelete(method)}
                      disabled={paymentMethods.length <= 1}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Add/Edit Popup */}
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
                <h3>{editingMethod ? "Edit" : "Add"} bank details</h3>
                <label>Type</label>
                <input value="Bank Transfer" disabled />
                <label>Account Name</label>
                <input
                  value={methodForm.accName}
                  onChange={(e) =>
                    setMethodForm({ ...methodForm, accName: e.target.value })
                  }
                />
                <label>Account Number</label>
                <input
                  value={methodForm.accNo}
                  onChange={(e) =>
                    setMethodForm({ ...methodForm, accNo: e.target.value })
                  }
                />
                <label>Bank Name</label>
                <input
                  value={methodForm.bankName}
                  onChange={(e) =>
                    setMethodForm({ ...methodForm, bankName: e.target.value })
                  }
                />
                <div className={styles.popupActions}>
                  <button onClick={() => setPopupOpen(false)}>Cancel</button>
                  <button onClick={savePaymentMethod} disabled={loading}>
                    {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Save"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {confirmOpen && (
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
                <h3>Confirm Delete</h3>
                <p>Are you sure you want to delete this payment method?</p>
                <div className={styles.popupActions}>
                  <button onClick={() => setConfirmOpen(false)}>Cancel</button>
                  <button onClick={deletePaymentMethod} disabled={loading}>
                    {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Delete"}
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
