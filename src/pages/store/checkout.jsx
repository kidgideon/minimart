import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import styles from "./checkout.module.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { toast } from "sonner";
import useStoreTheme from "../../hooks/useStoreTheme";
import fallback from "../../images/logo.png";
import { payToSubAccount } from "../../hooks/paystackHooks";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];

const Checkout = ({ storeId: propStoreId }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const storeId = propStoreId || useParams().storeid;
  const { biz, loading, error } = useStoreTheme(storeId);

  const [checkoutData, setCheckoutData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // Collapsible sections
  const [showCustomer, setShowCustomer] = useState(true);
  const [showShipping, setShowShipping] = useState(true);
  const [showItems, setShowItems] = useState(true);

  // Customer info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Shipping info
  const [state, setState] = useState("");
  const [street, setStreet] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load store.");
      navigate("/");
    }
  }, [error]);

  useEffect(() => {
    const checkoutLS = localStorage.getItem(`checkout_${storeId}`);
    if (checkoutLS) {
      const parsedData = JSON.parse(checkoutLS);
      setCheckoutData(parsedData);
      const amount = parsedData.reduce((sum, item) => {
        const price = item.price || 0;
        const qty = item.quantity || 1;
        return sum + price * qty;
      }, 0);
      setTotalAmount(amount);
    }
  }, [storeId]);

  // Validate Nigerian WhatsApp number
  const formatWhatsapp = (num) => {
    let n = num.replace(/\D/g, "");
    if (n.startsWith("0")) n = n.slice(1);
    if (!n.startsWith("234")) n = "234" + n;
    return "+" + n;
  };

  const validateAll = () => {
    if (!firstName || !lastName || !email || !whatsapp || !state || !street) {
      toast.error("Please fill in all required details");
      return false;
    }
    return true;
  };

  const handlePaystackPayment = async () => {
    if (!validateAll()) return;
    setIsSubmitting(true);

    // Save customer & shipping info to localStorage
    localStorage.setItem(
      `checkout_info_${storeId}`,
      JSON.stringify({
        firstName,
        lastName,
        email,
        whatsapp: formatWhatsapp(whatsapp),
        state,
        street,
      })
    );

    try {
      const paymentData = {
        email,
        amount: totalAmount * 100, // Paystack expects kobo
        subaccount_code: biz?.subAccount?.subaccount_code,
        reference: orderId,
        callback_url: `${window.location.origin}/order/${orderId}`
      };
      const payRes = await payToSubAccount(paymentData);
      window.location.href = payRes.authorization_url; // Redirect to Paystack
    } catch (err) {
      toast.error("Failed to initialize payment");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 32 }}></i>
      </div>
    );
  }

  if (!biz || !biz.subAccount) return null;

  const title = `${biz.businessName || "Minimart Store"} - Checkout`;
  const description = biz.otherInfo?.description || "Complete your purchase of quality products and services";
  const logo = biz.customTheme?.logo || fallback;
  const url = `https://${storeId}.minimart.ng/checkout`;

  return (
    <div className={styles.checkoutInterface}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={logo} />
        <meta property="og:url" content={url} />
        <meta name="theme-color" content={biz.customTheme?.primaryColor || "#1C2230"} />
        <link rel="icon" type="image/png" href={logo || fallback} />
      </Helmet>

      <Navbar storeId={storeId} />

      <div className={styles.warningTemplate}>
        Please fill in your shipment details and pay securely online. Payment is instant and automatic.
      </div>

      {/* Customer Information Section */}
      <section className={styles.sectionArea}>
        <button
          className={styles.sectionToggle}
          onClick={() => setShowCustomer((v) => !v)}
        >
          Customer Information {showCustomer ? "▲" : "▼"}
        </button>
        {showCustomer && (
          <div className={styles.sectionContent}>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
            />
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <label htmlFor="whatsapp"> Number</label>
            <input
              id="whatsapp"
              type="tel"
              placeholder="e.g 8031234567"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
            />
          </div>
        )}
      </section>

      {/* Shipping Information Section */}
      <section className={styles.sectionArea}>
        <button
          className={styles.sectionToggle}
          onClick={() => setShowShipping((v) => !v)}
        >
          Shipping Information {showShipping ? "▲" : "▼"}
        </button>
        {showShipping && (
          <div className={styles.sectionContent}>
            <label htmlFor="state">State</label>
            <select id="state" value={state} onChange={e => setState(e.target.value)}>
              <option value="">Select State</option>
              {NIGERIAN_STATES.map((s, idx) => (
                <option key={s + idx} value={s}>{s}</option>
              ))}
            </select>
            <label htmlFor="street">Street / Area</label>
            <input
              id="street"
              type="text"
              placeholder="Street / Area"
              value={street}
              onChange={e => setStreet(e.target.value)}
            />
          </div>
        )}
      </section>

      {/* Items Section */}
      <section className={styles.sectionArea}>
        <button
          className={styles.sectionToggle}
          onClick={() => setShowItems((v) => !v)}
        >
          Items ({checkoutData.length}) {showItems ? "▲" : "▼"}
        </button>
        {showItems && (
          <div className={styles.sectionContent}>
            {checkoutData.map((item, idx) => (
              <div key={idx} className={styles.itemRow}>
                <span>{item.name}</span>
                <span>₦{(item.price * (item.quantity || 1)).toLocaleString()}</span>
              </div>
            ))}
            <div className={styles.totalRow}>
              <b>Total:</b>
              <b>₦{totalAmount.toLocaleString()}</b>
            </div>
          </div>
        )}
      </section>

      {/* Payment Section */}
      <section className={styles.paymentSection}>
        <div className={styles.payInfo}>
          <p>
            Pay to: <b>{biz.businessName}</b> 
          </p>
        </div>
        <button
          className={styles.payBtn}
          onClick={handlePaystackPayment}
          disabled={isSubmitting}
        >
          {isSubmitting ? <i className="fa fa-spinner fa-spin"></i> : "Pay Now"}
        </button>
      </section>

      <Footer storeId={storeId} />
    </div>
  );
};

export default Checkout;
