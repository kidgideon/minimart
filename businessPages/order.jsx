// so this is the orders page where you will list all the orders 
// i have already given you the structure so you will have to follow
// the structure up to complete it 
// remember you must get the current user logged in , using on auth state changed and then after getting that user ,you can query his firestore collection and get his businessId and then use that businessId to query the businesses collection then get his orders array and then his orders array has objects of date and orderId 
// so you get the orderId and then you go ahead and query the orders collection 
// and get the needed data of each order like the 
// paymentInfo.amount (total amount)
// customer.email(customet email)
// customer.number(customers number)
// customer.firstName(customers firstname)
// customer.lastName(customers lastName)
// completed (false or true)
// date
//then wrap each up in their diffrent links which is "/orders/order/orderId"
//make sure they are sortable by date (which is the newest) , then amount (the ones which are most expensive), then the completed status , the incomplete once , then the completed status , the completed ones,
//always list the number of them close to the orders title ,e,g (54)

//and add neet animations on them , with framer motion  , the page shoulnt be boring 

// then for completed orders then instead of using that orange there use green so that its visually pleasing 

//cancelled orders too , for orders that the vendor cancells just because of something , so the cancelled orders should be red 

import styles from "./order.module.css"
import Navbar from "../businessComponent/navbar";

const DashboardOrder = () => {
    return(
        <div className="container">
            <Navbar/>
            <div className="displayArea">
              <div className={styles.title}>
                <div className={styles.titleText}>  Orders <i class="fa-solid fa-bag-shopping"></i></div>
                
                 <div className={styles.sortArea}>
                 <select name="" id="">
                <var>date</var>
                 </select>
              </div>
                </div>

                <div className={styles.orders}>
                    <div className={styles.order}>
                        <div className={styles.orderTop}>
                            <div className={styles.iconArea}>
                    <i className="fa-solid fa-circle-user"></i>
                            </div>
                            <div className={styles.customeInformation}>
                    <p>John Doe</p>
                    <p>kofigideon065@gmail.com</p>  
                    <p>08013567890</p>  
                    <p>$ 87,000</p>
                    <p className={styles.uncompleted}><i className="fa-solid fa-circle"></i> incompleted</p>
                            </div>
                        </div>
                           <div className={styles.dateArea}>
   <p>
    15th, 20th of august 
   </p>
<i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </div>
                    </div>

                     <div className={styles.order}>
                        <div className={styles.orderTop}>
                            <div className={styles.iconArea}>
                    <i className="fa-solid fa-circle-user"></i>
                            </div>
                            <div className={styles.customeInformation}>
                    <p>John Doe</p>
                    <p>kofigideon065@gmail.com</p>  
                    <p>08013567890</p>  
                    <p>$ 87,000</p>
                    <p className={styles.uncompleted}><i className="fa-solid fa-circle"></i> incompleted</p>
                            </div>
                        </div>
                           <div className={styles.dateArea}>
   <p>
    15th, 20th of august 
   </p>
<i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </div>
                    </div>

                     <div className={styles.order}>
                        <div className={styles.orderTop}>
                            <div className={styles.iconArea}>
                    <i className="fa-solid fa-circle-user"></i>
                            </div>
                            <div className={styles.customeInformation}>
                    <p>John Doe</p>
                    <p>kofigideon065@gmail.com</p>  
                    <p>08013567890</p>  
                    <p>$ 87,000</p>
                    <p className={styles.uncompleted}><i className="fa-solid fa-circle"></i> incompleted</p>
                            </div>
                        </div>
                           <div className={styles.dateArea}>
   <p>
    15th, 20th of august 
   </p>
<i class="fa-solid fa-arrow-up-right-from-square"></i>
                            </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardOrder;