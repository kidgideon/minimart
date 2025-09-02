import { motion } from "framer-motion";
import styles from "./features.module.css";
import customization from "../images/customization.svg";
import payment from "../images/payment.svg";
import products from "../images/products.svg";
import analytics from "../images/analytics.svg";
import mobile from "../images/mobile.svg";
import secure from "../images/secure.svg";

const Features = () => {
  const features = [
    { img: customization, title: "Custom Branding", text: "Design your storefront with your own colors, logo, and banners." },
    { img: payment, title: "Instant Payments", text: "Receive payments securely with branded receipts." },
    { img: products, title: "Products & Services", text: "Sell both products and services seamlessly." },
    { img: analytics, title: "Analytics", text: "Track views, likes, and sales to grow smarter." },
    { img: mobile, title: "Mobile Ready", text: "Optimized for every device, always fast." },
    { img: secure, title: "Secure Platform", text: "Enterprise-grade protection for your business." }
  ];

  return (
    <section className={styles.featuresSection}>
      <h2 className={styles.featuresTitle}>Powerful Features to <span className={styles.coloredArea}>Grow Your Business</span></h2>
      <div className={styles.featuresContainer}>
        {features.map((f, index) => (
          <motion.div
            key={index}
            className={styles.featureCard}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
          >
            <img src={f.img} alt={f.title} className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureText}>{f.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Features;
