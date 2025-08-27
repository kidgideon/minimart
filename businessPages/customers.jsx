"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../src/hooks/firebase";
import Navbar from "../businessComponent/navbar";
import styles from "./customers.module.css";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        try {
          setLoading(true);
          // 1. Get businessId from users collection
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const businessId = userDoc.data()?.businessId;
          if (!businessId) return;

          // 2. Get business document
          const bizDoc = await getDoc(doc(db, "businesses", businessId));
          const ordersArray = bizDoc.data()?.orders || [];

          // 3. Extract orderIds
          const orderIds = ordersArray.map((o) => o.orderId);

          // 4. Query orders collection
          let allCustomers = {};
          for (const id of orderIds) {
            const orderDoc = await getDoc(doc(db, "orders", id));
            if (!orderDoc.exists()) continue;

            const data = orderDoc.data();
            const c = data.customerInfo;
            if (!c?.email) continue;

            if (!allCustomers[c.email]) {
              allCustomers[c.email] = {
                email: c.email,
                firstName: c.firstName,
                lastName: c.lastName,
                state: c.state,
                street: c.street,
                whatsapp: c.whatsapp,
                totalSpent: data.amount || 0,
                orders: 1,
              };
            } else {
              allCustomers[c.email].orders += 1;
              allCustomers[c.email].totalSpent += data.amount || 0;
              if (
                c.whatsapp &&
                !allCustomers[c.email].whatsapp.includes(c.whatsapp)
              ) {
                allCustomers[c.email].whatsapp += `, ${c.whatsapp}`;
              }
            }
          }

          const result = Object.values(allCustomers);
          setCustomers(result);
          setFiltered(result);
        } catch (error) {
          console.error("Error fetching customers:", error);
        } finally {
          setLoading(false);
        }
      });
    };
    fetchCustomers();
  }, []);

  // Search filtering
  useEffect(() => {
    const query = search.toLowerCase();
    setFiltered(
      customers.filter(
        (c) =>
          c.firstName.toLowerCase().includes(query) ||
          c.lastName.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      )
    );
  }, [search, customers]);

  return (
    <div className="container">
      <Navbar />
      <div className="displayArea">
        <div className={styles.customersArea}>
          <h3>Customer Management</h3>
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />

          {loading ? (
            <div className={styles.loading}><i className="fas fa-spinner fa-spin"></i> Loading customers...</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.customersTable}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, index) => (
                    <tr key={index} onClick={() => setSelectedCustomer(c)}>
                      <td>{c.email}</td>
                      <td>{c.firstName} {c.lastName}</td>
                      <td>{c.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedCustomer && (
            <div className={styles.modalOverlay} onClick={() => setSelectedCustomer(null)}>
  <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
    <header className={styles.modalHeader}>
      <i className="fas fa-user"></i>
      <h3>Customer Details</h3>
    </header>

    <div className={styles.modalBody}>
      <div className={styles.modalSection}>
        <h4>Basic Info</h4>
        <p><strong>Email:</strong> {selectedCustomer.email}</p>
        <p><strong>Name:</strong> {selectedCustomer.firstName} {selectedCustomer.lastName}</p>
      </div>

      <div className={styles.modalSection}>
        <h4>Contact</h4>
        <p><strong>State:</strong> {selectedCustomer.state}</p>
        <p><strong>Street:</strong> {selectedCustomer.street}</p>
        <p><strong>WhatsApp:</strong> {selectedCustomer.whatsapp}</p>
      </div>

      <div className={styles.modalSection}>
        <h4>Activity</h4>
        <p><strong>Total Spent:</strong> ₦{selectedCustomer.totalSpent.toLocaleString()}</p>
        <p><strong>Orders Made:</strong> {selectedCustomer.orders}</p>
      </div>
    </div>

    <footer className={styles.modalFooter}>
      <button
        className={styles.closeBtn}
        onClick={() => setSelectedCustomer(null)}
      >
        Close
      </button>
    </footer>
  </div>
</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers;
