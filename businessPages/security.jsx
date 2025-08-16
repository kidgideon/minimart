import styles from "./security.module.css";
import Navbar from "../businessComponent/navbar";
import { auth } from "../src/hooks/firebase";
import { sendPasswordResetEmail, sendEmailVerification, deleteUser } from "firebase/auth";
import { useState } from "react";
import { toast } from "sonner";

const Security = () => {
  const [loading, setLoading] = useState({
    reset: false,
    verify: false,
    deleteAcc: false,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleResetPassword = async () => {
    if (!auth.currentUser?.email) {
      toast.error("No email found for this account");
      return;
    }
    setLoading(prev => ({ ...prev, reset: true }));
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      toast.success("Password reset link sent to your email");
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(prev => ({ ...prev, reset: false }));
  };

  const handleVerifyEmail = async () => {
    if (!auth.currentUser) {
      toast.error("No user is logged in");
      return;
    }
    setLoading(prev => ({ ...prev, verify: true }));
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success("Verification email sent");
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(prev => ({ ...prev, verify: false }));
  };

  const confirmDeleteAccount = async () => {
    setLoading(prev => ({ ...prev, deleteAcc: true }));
    try {
      await deleteUser(auth.currentUser);
      toast.success("Account deleted successfully");
      setShowDeleteModal(false);
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(prev => ({ ...prev, deleteAcc: false }));
  };

  return (
    <div className="container">
      <Navbar />
      <div className="displayArea">

        {/* Reset Password */}
        <div className={styles.sectionArea}>
          <p>Reset Password</p>
          <div className={styles.buttonArea}>
            <button onClick={handleResetPassword} disabled={loading.reset}>
              {loading.reset ? <i className="fa fa-spinner fa-spin"></i> : "Reset"}
            </button>
          </div>
        </div>

        {/* Verify Email */}
        <div className={styles.sectionArea}>
          <p>Verify Email</p>
          <div className={styles.buttonArea}>
            <button onClick={handleVerifyEmail} disabled={loading.verify}>
              {loading.verify ? <i className="fa fa-spinner fa-spin"></i> : "Send Verification"}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className={`${styles.sectionArea} ${styles.dangerZone}`}>
          <p>Delete account</p>
          <div className={styles.buttonArea}>
            <button onClick={() => setShowDeleteModal(true)} disabled={loading.deleteAcc}>
              {loading.deleteAcc ? <i className="fa fa-spinner fa-spin"></i> : "Delete Account"}
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>Confirm Deletion</h3>
              <p>This action is permanent. Are you sure you want to delete your account?</p>
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading.deleteAcc}
                >
                  Cancel
                </button>
                <button 
                  className={styles.confirmBtn} 
                  onClick={confirmDeleteAccount}
                  disabled={loading.deleteAcc}
                >
                  {loading.deleteAcc ? <i className="fa fa-spinner fa-spin"></i> : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Security;
