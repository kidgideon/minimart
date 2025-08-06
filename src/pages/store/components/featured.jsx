import { useEffect, useState } from "react";
import styles from "./featured.module.css";
import { db } from "../../../hooks/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import ProductCard from "./productCard";
import { v4 as uuidv4 } from "uuid";

const Featured = ({ storeId }) => {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const cartLogged = JSON.parse(localStorage.getItem("cart")) || {};

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "businesses", storeId));
      const biz = snap.data();
      let arr = [];
      if (biz.featured && Array.isArray(biz.featured)) {
        arr = biz.featured.map((f) => {
          const src = f.type === "product"
            ? biz.products?.find(p => p.prodId === f.id)
            : biz.services?.find(s => s.serviceId === f.id);
          return src ? { ...src, _ft: f.type } : null;
        }).filter(Boolean);
        arr.sort((a,b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      }
      setItems(arr);
      setCart(cartLogged);
    };
    load();
  }, [storeId]);  

  const refreshCart = () => {
    const newC = JSON.parse(localStorage.getItem("cart")) || {};
    setCart(newC);
  };

  return (
    <div className={styles.featured}>
      <div className={styles.Intro}>
        <p className={styles.introText}>Featured {items[0]?._ft === "service" ? "Services" : "Products"}</p>
      </div>
      <div className={styles.slidableArea}>
        {items.map(item => (
          <ProductCard
            key={item._ft==="product"?item.prodId:item.serviceId}
            storeId={storeId}
            item={item}
            quantity={cart[item._ft==="product"?item.prodId:item.serviceId] || 0}
            onCartChange={refreshCart}
          />
        ))}
      </div>
    </div>
  );
};

export default Featured;
