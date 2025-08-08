import styles from "./order.module.css"
import Navbar from "./components/navbar";
import Footer from "./components/footer";

const Order = ({storeId}) => {
    return(
        <div className={styles.interface}>
            <Navbar storeId={storeId}/>
     <h1>Order Area</h1>
             <Footer storeId={storeId}/>
        </div>
    )
}

export default Order;