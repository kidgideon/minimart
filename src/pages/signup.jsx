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
    whatsappNumber: "",
    businessCategory: ""
  });
  const [businessIdEdited, setBusinessIdEdited] = useState(false);
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

  const totalSteps = 7;

   const businessCategories = [
  "Bakery",
  "Fashion & Clothing",
  "Electronics",
  "Groceries",
  "Pharmacy",
  "Restaurant",
  "Salon & Beauty",
  "Furniture",
  "Automobile",
  "Tech & Gadgets",
  "Books & Stationery",
  "Home Essentials",
  "Jewelry",
  "Sports & Fitness",
  "Kids & Toys",
  "Foodstuff",
  "Supermarket",
  "Mobile Phones",
  "Accessories",
  "Cosmetics",
  "Events & Decor",
  "Laundry",
  "Pet Supplies",
  "Building Materials",
  "Drinks & Beverages",
  "Agriculture & Farming",
  "Tailoring & Sewing",
  "Photography & Videography",
  "Printing & Branding",
  "Transport & Logistics",
  "Real Estate & Property",
  "Consulting & Professional Services",
  "ICT & Software Services",
  "Recharge & Airtime",
  "Electronics Repair & Services",
  "Fast Food & Snacks",
  "Catering & Pastries",
  "Bars & Nightlife",
  "Herbal & Traditional Medicine",
  "Fitness & Gym",
  "Music & Entertainment",
  "Travel & Tourism",
  "Courier & Delivery Services",
  "Stationery & Office Supplies",
  "Toys & Games",
  "Industrial Supplies",
  "Agricultural Produce",
  "Farm Equipment",
  "Others"
];
  
  const [categorySearch, setCategorySearch] = useState("");

  const filteredCategories = businessCategories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const steps = [
    { label: "What's your full name?", name: "ownerName", placeholder: "e.g. John Doe", icon: "fa-solid fa-user" },
    { label: "What's your business email?", name: "businessEmail", placeholder: "e.g. johndoe@domain.com", icon: "fa-solid fa-envelope" },
    { label: "What’s your business name?", name: "businessName", placeholder: "e.g.Dejis clothing", icon: "fa-solid fa-building" },
    { label: "Your business ID", name: "businessId", placeholder: "e.g.Dejiscloth", icon: "fa-solid fa-link" },
    { label: "Create a password", name: "password", type: "password", placeholder: "Enter password", icon: "fa-solid fa-lock" },
    { label: "Confirm your password", name: "confirmPassword", type: "password", placeholder: "Re-enter password", icon: "fa-solid fa-lock" },
    { label: "Your WhatsApp number", name: "whatsappNumber", placeholder: "e.g. 08012345678", icon: "fa-brands fa-whatsapp" }
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
    const { ownerName, businessEmail, businessName, businessId, password, confirmPassword, whatsappNumber, businessCategory } = formData;
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
      case 6:
        return /^\d{10,15}$/.test(whatsappNumber); // simple phone validation
      case "category":
        return businessCategory.length > 0;
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
          : step === 6
          ? "Enter a valid WhatsApp number!"
          : step === "category"
          ? "Please select a category!"
          : "Please fill in the field correctly."
      );
      return;
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else if (step === steps.length - 1) {
      setStep("category");
    }
  };

  const handlePrev = () => {
    if (typeof step === "number" && step > 0) {
      setStep(step - 1);
    } else if (step === "category") {
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
      whatsappNumber: formData.whatsappNumber,
      businessCategory: formData.businessCategory,
      ownerUid: uid,
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
                    <div className={styles.linkArea}>
                      <b>{formData.businessId || "yourid"}.minimart.ng</b>
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
                    <div className={styles.linkArea}>
                      <b>{formData.businessId || "yourid"}.minimart.ng</b>
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
            ) : step === "category" ? (
              <form className={styles.section} onSubmit={handleSubmit}>
                <div className={styles.topIconS}><i className="fa-solid fa-list"></i></div>
                <label>Choose your business category</label>
                <input
                  type="text"
                  placeholder="Search category..."
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  style={{ maxWidth: 300 }}
                />
                <div style={{ maxHeight: 150, overflowY: "auto", width: "100%", maxWidth: 300 }}>
                  {filteredCategories.map(cat => (
                    <div
                      key={cat}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        background: formData.businessCategory === cat ? "#43B5F4" : "#f5f5f5",
                        color: formData.businessCategory === cat ? "white" : "black",
                        borderRadius: 5,
                        marginBottom: 2
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, businessCategory: cat }))}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
                <button
                  className={styles.submitBtn}
                  type="submit"
                  disabled={loading}
                  style={{ marginTop: 20 }}
                >
                  {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Create Account"}
                </button>
              </form>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Signup;
