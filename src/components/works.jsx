import { motion } from "framer-motion";
import styles from "./works.module.css";
import signup from "../images/signup.svg";
import list from "../images/list.svg";
import order from "../images/order.svg";
import shopper from "../images/shoppers.svg";

const HowItWorks = () => {
  const steps = [
    { img: signup, title: "Sign Up", text: "Create your free Minimart account." },
    { img: list, title: "Add Items", text: "Upload your first product or service." },
    { img: order, title: "Enable Payments", text: "Enter your bank details to start receiving money." },
    { img: shopper, title: "Share & Sell", text: "Promote your store and start making sales." }
  ];

  return (
    <section className={styles.worksSection}>
      <h2 className={styles.worksTitle}>How It Works</h2>
      <div className={styles.worksContainer}>
        {steps.map((s, index) => (
          <motion.div
            key={index}
            className={styles.stepCard}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
          >
            <img src={s.img} alt={s.title} className={styles.stepIcon} />
            <h3 className={styles.stepTitle}>{s.title}</h3>
            <p className={styles.stepText}>{s.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
