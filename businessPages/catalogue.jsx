
import Navbar from "../businessComponent/navbar";
import Featured from "../businessComponent/featured";
import Products from "../businessComponent/products";

const Catalogue = () => {
    return(
        <div className="container">
             <Navbar/>
            <div className="displayArea">
            <Featured/>
            <Products/>
            </div>
        </div>
    )
}

export default Catalogue;