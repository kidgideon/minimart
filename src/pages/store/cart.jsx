import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../hooks/firebase";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import Navbar from "./components/navbar";
import styles from "./cart.module.css";
import Featured from "./components/featured";
import Products from "./components/products";
import Services from "./components/services";
import Footer from "./components/footer";

const Cart = ({ storeId }) => {
  const navigate = useNavigate();
  const cartKey = `cart_${storeId}`;
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true); // NEW

  const loadCartData = async () => {
    setLoading(true); // start loading

    const cart = JSON.parse(localStorage.getItem(cartKey)) || {};
    if (!Object.keys(cart).length) {
      setCartItems([]);
      setSubtotal(0);
      setLoading(false);
      return;
    }

    const snap = await getDoc(doc(db, "businesses", storeId));
    const biz = snap.data() || {};

    const allItems = [
      ...(biz.products || []).map((p) => ({ ...p, _ft: "product" })),
      ...(biz.services || []).map((s) => ({ ...s, _ft: "service" })),
    ];

    const itemsInCart = Object.entries(cart)
      .map(([id, qty]) => {
        const found = allItems.find((i) =>
          i._ft === "product" ? i.prodId === id : i.serviceId === id
        );
        return found ? { ...found, quantity: qty } : null;
      })
      .filter(Boolean);

    setCartItems(itemsInCart);

    const total = itemsInCart.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    );
    setSubtotal(total);
    setLoading(false); // stop loading
  };

  useEffect(() => {
    loadCartData();

    const onCartUpdate = (e) => {
      if (e.detail === storeId) loadCartData();
    };
    window.addEventListener("cartUpdated", onCartUpdate);
    return () => window.removeEventListener("cartUpdated", onCartUpdate);
  }, [storeId]);

  const updateCartQuantity = (id, change) => {
    let cart = JSON.parse(localStorage.getItem(cartKey)) || {};
    cart[id] = (cart[id] || 0) + change;

    if (cart[id] <= 0) delete cart[id];

    if (Object.keys(cart).length === 0) {
      localStorage.removeItem(cartKey);
    } else {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }

    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: storeId }));
  };

 const handleCheckout = () => {
  const checkoutKey = `checkout_${storeId}`; // persistent key
  const cart = JSON.parse(localStorage.getItem(cartKey)) || {};

  // Keep checkout in sync with the current cart items
  const updatedCheckoutItems = cartItems.filter((item) => {
    const id = item._ft === "product" ? item.prodId : item.serviceId;
    return cart[id] !== undefined;
  });

  // Persist all checkout items to one place
  localStorage.setItem(checkoutKey, JSON.stringify(updatedCheckoutItems));

  // Generate orderId only for URL navigation, not for storage separation
  const orderId = "mnrt" + uuidv4().replace(/-/g, "").slice(0, 10);
  navigate(`/checkout/${orderId}`);
};

  return (
    <div className={styles.cartArea}>
      <Navbar storeId={storeId} />

      <div className={styles.cartItems}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "24px" }}></i>
          </div>
        ) : cartItems.length > 0 ? (
          <>
            {cartItems.map((item) => {
              const id = item._ft === "product" ? item.prodId : item.serviceId;
              return (
                <div key={id} className={styles.item}>
                  <div className={styles.top}>
                    <div className={styles.itemImage}>
                      <img src={item.images?.[0]} alt={item.name} />
                    </div>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemDetails}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemDescription}>
                          {item.description}
                        </div>
                        <div className={styles.itemCategory}>
                          {item.category}
                        </div>
                      </div>
                    </div>
                    <div className={styles.priceArea}>
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>

                  <div className={styles.bottom}>
                    <div className={styles.remove}>
                      <button onClick={() => updateCartQuantity(id, -item.quantity)}>
                        <i className="fa-solid fa-trash"></i> Remove
                      </button>
                    </div>
                    <div className={styles.cartToggle}>
                      <button onClick={() => updateCartQuantity(id, -1)}>–</button>
                      <p className={styles.quantity}>{item.quantity}</p>
                      <button onClick={() => updateCartQuantity(id, 1)}>+</button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className={styles.cartSummary}>
              <div className={styles.head}>
                <p>Cart Summary</p>
              </div>

              <div className={styles.subTotal}>
                <p>Subtotal</p>
                <p className={styles.overallPrice}>₦{subtotal.toLocaleString()}</p>
              </div>

              <div className={styles.checkoutBtn}>
                <button onClick={handleCheckout}>Checkout</button>
              </div>
            </div>
          </>
        ) : (
          <p>Your cart is empty.</p>
        )}
      </div>

      <Featured storeId={storeId} />
      <Products storeId={storeId} />
      <Services storeId={storeId} />
      <Footer storeId={storeId} />
    </div>
  );
};

export default Cart;
