import styles from "./home.module.css";
import Navbar from "../components/navBar";
import Hero from "../components/hero";
import Evaluations from "../components/evaluations";
import Footer from "../components/footer";

const Home = () => {
    return(
        <div className={styles.homeInterface}>
      <Navbar/>
        <Hero/>
        <Evaluations/>
        <Footer/>
        </div>
    )
}

export default Home;