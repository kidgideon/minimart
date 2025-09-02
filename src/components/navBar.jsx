import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./navBar.module.css";
import Logo from "../images/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef();

  // Outside click handler
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div className={styles.navbarInterface}>
      <div className={styles.navbar}>
        <div className={styles.companyArea}>
          <img src={Logo} alt="MiniMart Logo" />
          <p>
            Mini<span>mart</span>
          </p>
        </div>

        {/* Desktop Nav */}
        <div className={styles.hamburgerArea}>
            <Link to={"/"}><p>Home</p></Link>
          <Link to={"/signup"}><p>Join now</p></Link>
          <Link to={"/signin"}><p>Login</p></Link>
          <Link to={"/signin"}><p>About</p></Link>
        </div>

        {/* Mobile Hamburger Icon */}
         <div className={styles.mobileIcon} onClick={() => setIsOpen(true)}>
         <i class="fa-solid fa-bars"></i>
        </div>
      
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <div className={styles.panel}>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className={styles.mobileMenu}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              ref={menuRef}
            >
              <Link to={"/"} onClick={() => setIsOpen(false)}><p>Home</p></Link>
              <Link to={"/signup"} onClick={() => setIsOpen(false)}><p>Join now</p></Link>
              <Link to={"/signin"} onClick={() => setIsOpen(false)}><p>Login</p></Link>
              <Link to={"/about"} onClick={() => setIsOpen(false)}><p>About</p></Link>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
