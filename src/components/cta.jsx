import styles from "./cta.module.css";
import ladies from "../images/ladies.jpg"

const CallToAction = () => {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          Ready to grow your business with Minimart?
        </h2>
        <p className={styles.subtitle}>
          Join thousands of Nigerian entrepreneurs using Minimart to sell smarter,
          get paid faster, and reach more customers effortlessly.
        </p>
        <a href="/signup" className={styles.ctaButton}>
          Get Started Free
        </a>
      </div>

      <div className={styles.imageContainer}>
        {/* Replace with your real image later */}
        <img
          src={ladies}
          alt="Minimart team wearing company shirts"
          className={styles.image}
        />
      </div>
    </section>
  );
};

export default CallToAction;
