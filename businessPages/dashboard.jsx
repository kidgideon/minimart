import styles from "./dashboard.module.css"
import Navbar from "../businessComponent/navbar";

const Dashboard = () => {
    return(
        <div className={styles.dashboardInterface}>
 <Navbar/>
        </div>
    )
}

export default Dashboard;