import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./hero.module.css";

import shoppingOne from "../images/shopping.svg";
import shoppingTwo from "../images/onlineshop.svg";
import shoppingThree from "../images/cart.svg";

const Hero = () => {
  const navigate = useNavigate();

  const images = [shoppingOne, shoppingTwo, shoppingThree];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Carousel effect: change image every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Animation variants
  const textVariant = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: "easeOut" } }
  };

  const buttonVariant = {
    hover: { scale: 1.01, backgroundColor: "#2ea0e8", transition: { duration: 0.3 } }
  };

  const imageVariant = {
    enter: { opacity: 0, scale: 0.8 },
    center: { opacity: 1, scale: 1, transition: { duration: 1 } },
    exit: { opacity: 0, scale: 1.2, transition: { duration: 1 } }
  };

  return (
    <div className={styles.heroSection}>
      <motion.div 
        className={styles.textSection} 
        variants={textVariant} 
        initial="hidden" 
        animate="visible"
      >
        <h1>Turn Your Business Into a Profitable Online Storefront</h1>
        <p>Create your own branded online storefront, list your products or services, receive payments, and manage everything with ease</p>
        <motion.button 
          onClick={() => navigate("/signup")}
          variants={buttonVariant}
          whileHover="hover"
        >
          Create Your Storefront
        </motion.button>
      </motion.div>

      <div className={styles.imageArea}>
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt=""
            variants={imageVariant}
            initial="enter"
            animate="center"
            exit="exit"
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Hero;
