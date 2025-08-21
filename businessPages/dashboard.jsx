import styles from "./dashboard.module.css"
import Navbar from "../businessComponent/navbar";

const Dashboard = () => {
    return(
        
        <div className="container">
             <Navbar/>
            <div className="displayArea">
    <div className={styles.storeMenu}>
    </div>
            </div>
        </div>
    )
}

export default Dashboard;