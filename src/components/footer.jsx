import styles from "./footer.module.css";
import logo from "../images/logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {/* Main Footer Content */}
      <div className={styles.topSection}>
        {/* Company Info */}
        <div className={styles.companyInfo}>
          <div className={styles.logoArea}>
            <img src={logo} alt="Minimart Logo" className={styles.logo} />
            <h2>Minimart</h2>
          </div>
          <p>Create your online storefront, list products, manage orders, and receive payments easily.</p>
          <div className={styles.contactInfo}>
            <p><i className="fa-solid fa-map-pin"></i> yenagoa , Bayelsa State</p>
            <p><i className="fa-solid fa-phone"></i> +234 7046578294</p>
            <p><i className="fa-solid fa-envelope"></i> @minimart.com.ng@gmail.com</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.linkGroup}>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/signup">Products</a></li>
            <li><a href="/signup">About Us</a></li>
            <li><a href="/signup">Contact</a></li>
          </ul>
        </div>

        {/* Services */}
        <div className={styles.linkGroup}>
          <h4>Our Services</h4>
          <ul>
            <li><a href="/signup">Create Store</a></li>
            <li><a href="/signup">Manage Products</a></li>
            <li><a href="/signup">Analytics</a></li>
            <li><a href="/signup">Support</a></li>
          </ul>
        </div>

        {/* Newsletter / Social */}
        <div className={styles.newsletter}>
          <h4 style={{margin: "20px 0px"}}>Stay Updated</h4>
          <p>Subscribe for latest updates and offers.</p>
          <div className={styles.subscribe}>
            <input type="email" placeholder="Enter your email" />
            <button><i className="fa-solid fa-arrow-right"></i></button>
          </div>
          <div className={styles.socialIcons}>
            <a href="#"><i className="fa-brands fa-facebook-f"></i></a>
            <a href="#"><i className="fa-brands fa-twitter"></i></a>
            <a href="#"><i className="fa-brands fa-instagram"></i></a>
            <a href="#"><i className="fa-brands fa-linkedin-in"></i></a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomSection}>
        <p>© {currentYear} Minimart. All rights reserved.</p>
        <div className={styles.legalLinks}>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/cookies">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
