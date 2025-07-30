import styles from "./home.module.css";
import Navbar from "../components/navBar";
import Hero from "../components/hero";

const Home = () => {
    return(
        <div className={styles.homeInterface}>
        <Hero/>
   <Navbar/>
        </div>
    )
}

export default Home;