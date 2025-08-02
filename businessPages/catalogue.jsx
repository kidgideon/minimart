import styles from "./catalogue.module.css"
import Navbar from "../businessComponent/navbar";
import Featured from "../businessComponent/featured";
import Products from "../businessComponent/products";
import Services from "../businessComponent/services";

const Catalogue = () => {
    return(
        <div className="container">
             <Navbar/>
            <div className="displayArea">
            <Featured/>
            <Products/>
            <Services/>
            </div>
        </div>
    )
}

export default Catalogue;