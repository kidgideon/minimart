import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import styles from "./home.module.css";
import Navbar from "../components/navBar";
import Hero from "../components/hero";
import Evaluations from "../components/evaluations";
import Footer from "../components/footer";
import HowItWorks from "../components/works";
import Features from "../components/features";
import Comments from "../components/comments";
import CallToAction from "../components/cta";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard");
      }
    });

    return () => unsubscribe(); // cleanup on unmount
  }, [navigate]);

  return (
    <div className={styles.homeInterface}>
      <Navbar />
      <Hero />
      <Evaluations />
      <Features />
      <HowItWorks />
      <Comments />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Home;
