import { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import styles from "./evaluations.module.css";

const evaluationsData = [
  { value: 400, text: "businesses trust us" },
  { value: 600, text: "items sold" },
  { value: 1500, text: "products listed" },
  { value: 12000, text: "processed orders" }
];

const Evaluations = () => {
  const controls = useAnimation();
  const ref = useRef(null);
  const [counts, setCounts] = useState(evaluationsData.map(() => 0));

  // Scroll into view detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start("visible");
          animateNumbers();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
  }, [controls]);

  const animateNumbers = () => {
    const duration = 1500; // ms
    const startTime = performance.now();

    const step = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setCounts(
        evaluationsData.map((item) => Math.floor(item.value * progress))
      );

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  return (
    <div className={styles.evaluationArea} ref={ref}>
      {evaluationsData.map((evalItem, i) => (
        <motion.div
          key={i}
          className={styles.eval}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={controls}
          variants={{
            visible: {
              scale: 1,
              opacity: 1,
              transition: { type: "spring", stiffness: 200, damping: 15, delay: i * 0.2 }
            }
          }}
        >
          <p className={styles.value}>
            {counts[i].toLocaleString()}+
          </p>
          <p className={styles.valText}>{evalItem.text}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default Evaluations;
