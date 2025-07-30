/*
this is the sign in page just make sure the business can sign into thrie account 
here and when they clicks to send password reset link send the password reset link 
use navigate to navigate the user please 
*/

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/navBar";
import styles from "./signin.module.css";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../hooks/firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import { collection, query, where, getDocs } from "firebase/firestore";

const Signin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleInput = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      toast.success("Signed in successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Invalid email or password!");
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!resetEmail) return toast.error("Enter your business email");
    setResetLoading(true);
    try {
      // Check if email exists in businesses collection
      const q = query(collection(db, "businesses"), where("businessEmail", "==", resetEmail));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error("No business found with this email.");
        setResetLoading(false);
        return;
      }
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Password reset link sent!");
      setForgotOpen(false);
    } catch (err) {
      toast.error("Failed to send reset link. Check your email.");
    }
    setResetLoading(false);
  };

  return (
    <div className={styles.interface}>
      <Navbar />

      <motion.div
        className={styles.loginForm}
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className={styles.welcomeText}>Welcome Back</p>

        <div className={styles.inputWrapper}>
          <i className="fas fa-envelope leftItem"></i>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleInput}
            autoComplete="username"
            disabled={loading}
          />
        </div>
        <div className={styles.inputWrapper}>
          <i className="fas fa-lock leftItem"></i>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleInput}
            autoComplete="current-password"
            disabled={loading}
          />
          <i
            className={`fas ${showPassword ? "fa-eye-slash rightSide" : "fa-eye rightSide"} ${styles.eyeIcon}`}
            onClick={() => setShowPassword(prev => !prev)}
            style={{ cursor: "pointer" }}
          ></i>
        </div>

        <div className={styles.forgetPassword}>
          <p onClick={() => setForgotOpen(true)} style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? "none" : "auto" }}>
            Forgot password?
          </p>
        </div>

        <button onClick={handleSignIn} disabled={loading}>
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Sign In"}
        </button>

        <div className={styles.noAcc}>
          <p>
            Don't have an account? <Link to="/signup">Signup</Link>
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {forgotOpen && (
          <motion.div
            className={styles.modal}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.modalContent}>
              <h3>Password Reset</h3>
              <input
                type="email"
                placeholder="Enter business email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                disabled={resetLoading}
              />
              <button onClick={handleReset} disabled={resetLoading}>
                {resetLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Send Reset Link"}
              </button>
              <p className={styles.closeModal} onClick={() => setForgotOpen(false)} style={{ opacity: resetLoading ? 0.5 : 1, pointerEvents: resetLoading ? "none" : "auto" }}>
                Cancel
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Signin;
