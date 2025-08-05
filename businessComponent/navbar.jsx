import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./navbar.module.css";
import logo from "../src/images/no_bg.png";
import NotificationPanel from "./notificationPanel";
import { auth, db } from "../src/hooks/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";

const NAV_ITEMS = [
	{ label: "dashboard", icon: "fa-solid fa-table-columns", path: "/dashboard" },
	{ label: "Orders", icon: "fas fa-shopping-cart", path: "/orders" },
	{ label: "Transactions", icon: "fas fa-money-check-alt", path: "/transactions" },
	{ label: "analysis", icon: "fas fa-chart-line", path: "/analysis" },
	{ label: "catalogue", icon: "fas fa-briefcase", path: "/catalogue" },
	{ label: "Help Center", icon: "fas fa-question-circle", path: "/help" },
	{ label: "Settings", icon: "fas fa-cog", path: "/settings" }
];

const DEFAULT_SECONDARY = "#43B5F4";
const DEFAULT_PRIMARY = "#1C2230";
const PLACEHOLDER_LOGO = logo; // fallback image import

const Navbar = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [notifOpen, setNotifOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
	const [bizLogo, setBizLogo] = useState(null);
	const [bizLogoLoading, setBizLogoLoading] = useState(true);
	const [bizName, setBizName] = useState("");
	const [bizNameLoading, setBizNameLoading] = useState(true);
	const [plan, setPlan] = useState("");
	const [planLoading, setPlanLoading] = useState(true);
	const [themeColors, setThemeColors] = useState({ primary: DEFAULT_PRIMARY, secondary: DEFAULT_SECONDARY });
	const [logoutLoading, setLogoutLoading] = useState(false);
	const notifPanelRef = useRef(null);
	const menuRef = useRef(null);
	const location = useLocation();
	const navigate = useNavigate();

	// Responsive check
	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 1300);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Close overlays on outside click
	useEffect(() => {
		const handleClick = (e) => {
			if (notifOpen && notifPanelRef.current && !notifPanelRef.current.contains(e.target)) setNotifOpen(false);
			if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
		};
		if (notifOpen || menuOpen) document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [notifOpen, menuOpen]);

	// Mobile: close sidebar on route change
	useEffect(() => {
		setSidebarOpen(false);
	}, [location.pathname]);

	// Mobile: handle back button for notification panel
	useEffect(() => {
		if (!notifOpen || !isMobile) return;
		const handlePop = () => setNotifOpen(false);
		window.addEventListener("popstate", handlePop);
		return () => window.removeEventListener("popstate", handlePop);
	}, [notifOpen, isMobile]);
useEffect(() => {
  let unsubscribed = false;

  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (!user || unsubscribed) return;

    try {
      // Step 1: Get businessId from users collection
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) throw new Error("User not found");

      const { businessId } = userSnap.data();
      if (!businessId) throw new Error("No businessId linked to user");

      // Step 2: Fetch business data using businessId
      const bizDocRef = doc(db, "businesses", businessId);
      const bizSnap = await getDoc(bizDocRef);
      if (!bizSnap.exists()) throw new Error("Business not found");

      const data = bizSnap.data();

      // Business Name
      setBizName(data.businessName || "");
      setBizNameLoading(false);

      // Plan
      const planType = data.plan?.plan || "free";
      setPlan(planType);
      setPlanLoading(false);

      // Theme Colors
      let primary = DEFAULT_PRIMARY, secondary = DEFAULT_SECONDARY;
      if (
        planType === "pro" &&
        data.customTheme?.primaryColor?.trim() &&
        data.customTheme?.secondaryColor?.trim()
      ) {
        primary = data.customTheme.primaryColor;
        secondary = data.customTheme.secondaryColor;
      }
      setThemeColors({ primary, secondary });

      // Logo
      if (data.customTheme?.logo) {
        const img = new window.Image();
        img.onload = () => {
          if (!unsubscribed) {
            setBizLogo(data.customTheme.logo);
            setBizLogoLoading(false);
          }
        };
        img.onerror = () => {
          if (!unsubscribed) {
            setBizLogo(PLACEHOLDER_LOGO);
            setBizLogoLoading(false);
          }
        };
        img.src = data.customTheme.logo;
      } else {
        setBizLogo(PLACEHOLDER_LOGO);
        setBizLogoLoading(false);
      }
    } catch (e) {
      console.error("Error fetching business:", e);
      setBizNameLoading(false);
      setPlanLoading(false);
      setBizLogo(PLACEHOLDER_LOGO);
      setBizLogoLoading(false);
    }
  });

  return () => {
    unsubscribed = true;
    unsubscribeAuth();
  };
}, []);


	// Logout handler
	const handleLogout = async () => {
		if (!window.confirm("Are you sure you want to logout?")) return;
		setLogoutLoading(true);
		try {
			await signOut(auth);
			navigate("/signin");
		} catch (e) {
			alert("Logout failed. Please try again.");
		} finally {
			setLogoutLoading(false);
		}
	};

	// Overlay for sidebar, notification, menu
	const Overlay = ({ onClick, zIndex = 1000 }) => (
		<motion.div
			className="navbar-overlay"
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.4)",
				zIndex
			}}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			onClick={onClick}
		/>
	);

	// Sidebar nav item
	const NavTab = ({ label, icon, path }) => {
    const active = location.pathname.startsWith(path);
    // Use default primary until themeColors.primary is different from DEFAULT_PRIMARY
    const hoverColor =
        themeColors.primary && themeColors.primary !== DEFAULT_PRIMARY
            ? themeColors.primary
            : DEFAULT_PRIMARY;

    return (
        <div
            className={styles.businessTab}
            style={{
                background: active ? `var(--primary-color, ${hoverColor})` : undefined,
                color: active ? "#fff" : undefined,
                cursor: "pointer",
                transition: "background 0.2s"
            }}
            onClick={() => navigate(path)}
           onMouseEnter={e => {
  if (!active) {
    e.currentTarget.style.background = themeColors.primary;
    e.currentTarget.style.color = "#fff";
  }
}}
onMouseLeave={e => {
  if (!active) {
    e.currentTarget.style.background = "";
    e.currentTarget.style.color = "";
  }
}}

        >
            <div className={styles.tabIcon}><i className={icon}></i></div>
            <div className={styles.tabText}><p>{label}</p></div>
        </div>
    );
};

	// Menu dropdown
	const MenuDropdown = () => (
		<AnimatePresence>
			{menuOpen && (
				<>
					<Overlay onClick={() => setMenuOpen(false)} zIndex={1200} />
					<motion.div
						ref={menuRef}
						className="navbar-menu-dropdown"
						style={{
							position: "absolute",
							top: 50,
							right: 10,
							background: "#fff",
							borderRadius: 10,
							boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
							zIndex: 1300,
							minWidth: 160,
							padding: "10px 0"
						}}
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
					>
						<div style={{ padding: "10px 20px", cursor: "pointer" }} onClick={() => { setMenuOpen(false); navigate("/credits"); }}>Credits</div>
						<div style={{ padding: "10px 20px", cursor: "pointer" }} onClick={() => { setMenuOpen(false); navigate("/profile"); }}>Profile</div>
						<div style={{ padding: "10px 20px", cursor: "pointer" }} onClick={() => { setMenuOpen(false); navigate("/options"); }}>Options</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);

	// Notification panel
	const NotificationPanelWrapper = () => (
		<AnimatePresence>
			{notifOpen && (
				<>
					<Overlay onClick={() => setNotifOpen(false)} zIndex={1200} />
					<motion.div
						ref={notifPanelRef}
						className={styles.navbarNotifPanel}
						initial={isMobile ? { y: 40, opacity: 0 } : { y: -20, opacity: 0 }}
						animate={{
							y: 0,
							opacity: 1,
							transition: { type: "spring", stiffness: 350, damping: 22 }
						}}
						exit={isMobile ? { y: 40, opacity: 0, transition: { type: "spring", stiffness: 350, damping: 22 } } : { y: -20, opacity: 0, transition: { type: "spring", stiffness: 350, damping: 22 } }}
						style={{
							position: isMobile ? "fixed" : "absolute",
							top: isMobile ? 0 : 50,
							right: isMobile ? 0 : 10,
							left: isMobile ? 0 : "auto",
							width: isMobile ? "100vw" : 350,
							height: isMobile ? "100vh" : 400,
							background: "#fff",
							borderRadius: isMobile ? 0 : 12,
							zIndex: 1300,
							boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
							display: "flex",
							flexDirection: "column"
						}}
					>
						{isMobile && (
							<div style={{ display: "flex", justifyContent: "flex-end", padding: 16 }}>
								<motion.i
									className="fa-solid fa-xmark"
									style={{ fontSize: 22, cursor: "pointer" }}
									whileTap={{ scale: 0.85, rotate: 90 }}
									onClick={() => setNotifOpen(false)}
								></motion.i>
							</div>
						)}
						<NotificationPanel />
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);

	// Plan badge style helper
	const getPlanBadgeStyle = () => ({
		fontSize: 12,
		padding: "2px 10px",
		borderRadius: 8,
		fontWeight: 600,
		marginLeft: 8,
		background: plan === "pro" ? themeColors.primary : "#eee",
		color: plan === "pro" ? "#fff" : "#333",
		border: plan === "pro" ? "none" : "1px solid #ccc",
		textTransform: "uppercase",
		letterSpacing: 1,
		display: "inline-block"
	});

	// Sidebar (vertical nav)
	const Sidebar = () => (
		<AnimatePresence>
			{(sidebarOpen || !isMobile) && (
				<motion.div
					className={styles.verticalNav}
					style={{
						zIndex: 1100,
						position: "fixed",
						left: 0,
						top: 0,
						bottom: 0,
						width: 260,
						padding: 10,
						background: "#fff",
						borderRight: "1px solid #eee",
						boxShadow: isMobile ? "2px 0 16px rgba(0,0,0,0.08)" : undefined,
					}}
					initial={isMobile ? { x: -300, opacity: 0 } : false}
					animate={isMobile ? { x: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 32 } } : { x: 0, opacity: 1 }}
					exit={isMobile ? { x: -300, opacity: 0, transition: { type: "spring", stiffness: 400, damping: 32 } } : { x: 0, opacity: 1 }}
					transition={{ type: "spring", stiffness: 400, damping: 32 }}
				>
					{isMobile && (
						<div style={{ width: "100%", display: "flex", justifyContent: "flex-end", padding: 16 }}>
							<motion.i
								className="fa-solid fa-xmark"
								style={{ fontSize: 22, cursor: "pointer" }}
								whileTap={{ scale: 0.85, rotate: 90 }}
								onClick={() => setSidebarOpen(false)}
							></motion.i>
						</div>
					)}
					<div className={styles.businessProfile} style={{ alignItems: "center", textAlign: "center", marginBottom: 18 }}>
						{/* Logo section */}
						<div style={{ width: 70, height: 70, margin: "0 auto", borderRadius: "50%", overflow: "hidden", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
							{bizLogoLoading ? (
								<i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 28, color: themeColors.primary }}></i>
							) : (
								<img src={bizLogo} alt="companyLogo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
							)}
						</div>
						{/* Name & plan section */}
						<div style={{ marginTop: 10, minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
							{bizNameLoading ? (
								<i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 16, color: "#888" }}></i>
							) : (
								<>
									<span style={{ fontWeight: 600, fontSize: 16, color: "#222" }}>{bizName}</span>
									{planLoading ? (
										<i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 12, marginLeft: 8, color: "#888" }}></i>
									) : (
										<span style={getPlanBadgeStyle()}>{plan}</span>
									)}
								</>
							)}
						</div>
					</div>
					<div className={styles.businessTabs}>
						{NAV_ITEMS.map(tab => (
							<NavTab key={tab.label} {...tab} />
						))}
					</div>
					<div className={styles.logoutFunction} style={{ marginTop: 18 }}>
						<button
							onClick={handleLogout}
							disabled={logoutLoading}
							style={{
								background: themeColors.primary,
								color: "#fff",
								border: "none",
								borderRadius: 8,
								padding: "10px 18px",
								fontWeight: 600,
								fontSize: 15,
								cursor: logoutLoading ? "not-allowed" : "pointer",
								width: "90%",
								transition: "background 0.2s"
							}}
						>
							{logoutLoading ? (
								<i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
							) : (
								<i className="fa-solid fa-right-from-bracket" style={{ marginRight: 8 }}></i>
							)}
							Logout
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	return (
		<div className={styles.Interface} style={{ position: "relative", zIndex: 100 }}>
			{/* Topbar */}
			<div className={styles.horizontalNav} style={{ background: "#fff", borderBottom: "1px solid #eee" }}>
				<div className={styles.harmburgerSection}>
					{isMobile && (
						<motion.i
							className="fas fa-bars"
							style={{ fontSize: 22, cursor: "pointer" }}
							whileTap={{ scale: 0.85, rotate: 90 }}
							onClick={() => setSidebarOpen(true)}
						></motion.i>
					)}
				</div>
				<div className={styles.menuSection} style={{ position: "relative" }}>
					<div className={styles.notification}>
						<i
							className="fas fa-bell"
							style={{ fontSize: 20, cursor: "pointer", color: notifOpen ? "var(--primary-color, #43B5F4)" : undefined }}
							onClick={() => setNotifOpen(v => !v)}
						></i>
						<NotificationPanelWrapper />
					</div>
					<div className={styles.menu}>
						<i
							className="fa-solid fa-ellipsis"
							style={{ fontSize: 20, cursor: "pointer" }}
							onClick={() => setMenuOpen(v => !v)}
						></i>
						<MenuDropdown />
					</div>
				</div>
			</div>

			{/* Sidebar */}
			{!isMobile && <Sidebar />}
			<AnimatePresence>
				{isMobile && sidebarOpen && (
					<>
						<Overlay onClick={() => setSidebarOpen(false)} zIndex={1050} />
						<Sidebar />
					</>
				)}
			</AnimatePresence>
		</div>
	);
};

export default Navbar;