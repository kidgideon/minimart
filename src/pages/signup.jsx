import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../hooks/firebase";
import Navbar from "../components/navBar";
import { useNavigate } from "react-router-dom";
import styles from "./signup.module.css";
import { collection, doc, getDoc, setDoc, query, where, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner"; // or use react-hot-toast

function sanitizeBusinessId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // remove all non-alphanumeric
}

const Signup = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    ownerName: "",
    businessEmail: "",
    businessName: "",
    businessId: "",
    password: "",
    confirmPassword: "",
    mainContactPlatform: "",
    mainContactValue: ""
  });
  const [businessIdEdited, setBusinessIdEdited] = useState(false);
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

  const totalSteps = 6;

  const steps = [
    { label: "What's your full name?", name: "ownerName", placeholder: "e.g. John Doe", icon: "fa-solid fa-user" },
    { label: "What's your business email?", name: "businessEmail", placeholder: "e.g. johndoe@domain.com", icon: "fa-solid fa-envelope" },
    { label: "What’s your business name?", name: "businessName", placeholder: "e.g. Yum Yum Cakes", icon: "fa-solid fa-building" },
    { label: "Your business ID", name: "businessId", placeholder: "e.g. yummumcakes", icon: "fa-solid fa-link" },
    { label: "Create a password", name: "password", type: "password", placeholder: "Enter password", icon: "fa-solid fa-lock" },
    { label: "Confirm your password", name: "confirmPassword", type: "password", placeholder: "Re-enter password", icon: "fa-solid fa-lock" }
  ];

  // Auto-generate businessId from businessName unless user edits it
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      let updated = { ...prev, [name]: value };
      if (name === "businessName" && !businessIdEdited) {
        updated.businessId = sanitizeBusinessId(value);
      }
      return updated;
    });
  };

  // If user edits businessId, stop auto-updating it
  const handleBusinessIdChange = (e) => {
    setBusinessIdEdited(true);
    setFormData(prev => ({
      ...prev,
      businessId: sanitizeBusinessId(e.target.value)
    }));
  };

  // Validation for each step
  const validateStep = async () => {
    const { ownerName, businessEmail, businessName, businessId, password, confirmPassword } = formData;
    switch (step) {
      case 0:
        return ownerName.trim().length > 2;
      case 1:
        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(businessEmail)) return false;
        // Check email uniqueness
        const q = query(collection(db, "businesses"), where("businessEmail", "==", businessEmail));
        const snap = await getDocs(q);
        return snap.empty;
      case 2:
        return businessName.trim().length > 2;
      case 3:
        if (!businessId) return false;
        // Check businessId uniqueness
        const docRef = doc(db, "businesses", businessId);
        const docSnap = await getDoc(docRef);
        return !docSnap.exists();
      case 4:
        return password.length >= 6;
      case 5:
        return password === confirmPassword;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    setLoading(true);
    const valid = await validateStep();
    setLoading(false);
    if (!valid) {
      toast.error(
        step === 1
          ? "Email already in use or invalid!"
          : step === 3
          ? "Business ID taken or invalid!"
          : "Please fill in the field correctly."
      );
      return;
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setStep("contactMethod");
    }
  };

  const handlePrev = () => {
    if (typeof step === "number" && step > 0) {
      setStep(step - 1);
    } else if (step === "contactMethod") {
      setStep(steps.length - 1);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Check if businessId already exists in businesses collection
    const businessRef = doc(db, "businesses", formData.businessId);
    const businessSnap = await getDoc(businessRef);
    if (businessSnap.exists()) throw new Error("Business ID already exists!");

    // Check if email already exists in any business
    const q = query(collection(db, "businesses"), where("businessEmail", "==", formData.businessEmail));
    const emailSnap = await getDocs(q);
    if (!emailSnap.empty) throw new Error("Business email already exists!");

    // Create Firebase Auth user
    const userCred = await createUserWithEmailAndPassword(auth, formData.businessEmail, formData.password);
    const user = userCred.user;
    const uid = user.uid;

    // Create entry in users collection (keyed by UID)
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      email: formData.businessEmail,
      businessId: formData.businessId,
      createdAt: new Date().toISOString()
    });

    // Create entry in businesses collection (keyed by businessId)
    await setDoc(businessRef, {
      ownerName: formData.ownerName,
      businessEmail: formData.businessEmail,
      businessName: formData.businessName,
      businessId: formData.businessId,
      mainContactPlatform: formData.mainContactPlatform,
      mainContactValue: formData.mainContactValue,
      ownerUid: uid, // 🔗 important link to user
      createdAt: new Date(),

      // Plan info
      plan: {
        plan: "free",
        dateStarted: new Date().toISOString(),
      },

      // Branding
      customTheme: {
        primaryColor: "",
        secondaryColor: "",
        logo: "",
      },

      // Currency and Payments
      storeCurrency: "Naira",
      paymentMethods: [],

      // Banners
      layoutThemes: {
        topBanner: { image: "", mainText: "", subText: "" },
        midBannerOne: { image: "", mainText: "", subText: "" },
        midBannerTwo: { image: "", mainText: "", subText: "" }
      },

      // Other Info
      otherInfo: {
        storeLocation: "",
        description: ""
      },

      // Status
      verified: false,
      credits: 0,

      // Arrays
      products: [],
      services: [],
      featured: [],
      viewedPage: [],
      orders: [],
      searchedFor: [],
      salesArray: [],
      transactions: [],

      // Notifications
      notifications: [
        {
          text: "Welcome to Minimart! Start by customizing your storefront.",
          link: "/settings",
          read: false,
          date: new Date().toISOString()
        }
      ]
    });

  
    toast.success("Business created successfully!");
    setTimeout(() => {
   navigate("/dashboard");
    }, 2000)

  } catch (err) {
    toast.error(err.message || "Signup failed!");
  }

  setLoading(false);
};


  return (
    <div className={styles.interface}>
      <Navbar />

      {/* Step Counter */}
      <div className={styles.stepCounter}>
        {typeof step === "number"
          ? `Step ${step + 1} of ${totalSteps}`
          : `Final Step`}
      </div>

      {/* Backward only */}
      <div className={styles.stepControls}>
        <button onClick={handlePrev} disabled={step === 0 || loading}><i className="fa-solid fa-angles-left"></i></button>
      </div>

      <div className={styles.userFormArea}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={styles.section}
          >
            {typeof step === "number" ? (
              <>
                <div className={styles.topIconS}><i className={steps[step].icon}></i></div>
                <label>{steps[step].label}</label>
                {step === 2 && (
                  <>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      placeholder={steps[step].placeholder}
                      required
                    />
                    <div style={{ fontSize: 14, margin: "10px 0" }}>
                      Your business link: <b>{formData.businessId || "yourid"}.minimart.ng</b>
                    </div>
                  </>
                )}
                {step === 3 ? (
                  <>
                    <input
                      type="text"
                      name="businessId"
                      value={formData.businessId}
                      onChange={handleBusinessIdChange}
                      placeholder={steps[step].placeholder}
                      required
                    />
                    <div style={{ fontSize: 14, margin: "10px 0" }}>
                      Your business link: <b>{formData.businessId || "yourid"}.minimart.ng</b>
                    </div>
                  </>
                ) : step !== 2 ? (
                  <input
                    type={steps[step].type || "text"}
                    name={steps[step].name}
                    value={formData[steps[step].name]}
                    onChange={handleChange}
                    placeholder={steps[step].placeholder}
                    required
                  />
                ) : null}
                <button onClick={handleNext} disabled={loading}>
                  {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Next"}
                </button>
              </>
            ) : (
              <form className={styles.section} onSubmit={handleSubmit}>
                <div className={styles.topIconS}><i className="fa-solid fa-phone"></i></div>
                <p>What's your main contact platform?</p>
                <div className={styles.contactIcons}>
                  {[
                    { icon: "fa-whatsapp", name: "Whatsapp" },
                    { icon: "fa-facebook", name: "Facebook" },
                    { icon: "fa-instagram", name: "Instagram" },
                    { icon: "fa-tiktok", name: "TikTok" }
                  ].map(({ icon, name }) => (
                    <i
                      key={name}
                      className={`fab ${icon} ${formData.mainContactPlatform === name ? styles.activeIcon : ""}`}
                      onClick={() =>
                        setFormData(prev => ({ ...prev, mainContactPlatform: name }))
                      }
                    ></i>
                  ))}
                </div>

                {formData.mainContactPlatform && (
                  <>
                    <input
                      type="text"
                      name="mainContactValue"
                      value={formData.mainContactValue}
                      onChange={handleChange}
                      required
                      placeholder={
                        formData.mainContactPlatform === "Whatsapp"
                          ? "Enter your phone number"
                          : "Enter your profile link"
                      }
                    />
                    <button
                      className={styles.submitBtn}
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Create Account"}
                    </button>
                  </>
                )}
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Signup;
