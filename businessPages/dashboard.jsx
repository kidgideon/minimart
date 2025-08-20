import styles from "./dashboard.module.css"
import Navbar from "../businessComponent/navbar";
import Banner from "../businessComponent/adminBanner";

const Dashboard = () => {
    return(
        
        <div className="container">
             <Navbar/>
            <div className="displayArea">
    <Banner/>
    <div className={styles.storeMenu}>
    </div>
            </div>
        </div>
    )
}

export default Dashboard;