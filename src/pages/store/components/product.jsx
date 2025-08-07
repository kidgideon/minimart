import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./product.module.css";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../hooks/firebase";
import { v4 as uuidv4 } from "uuid";
import Navbar from "./navbar";
import Featured from "./featured";
import Products from "./products";
import Services from "./services";
import ProductCard from "./productCard";
import Footer from "./footer";


const DEFAULT_PRIMARY = "#1C2230";
const DEFAULT_SECONDARY = "#43B5F4";

const applyThemeToRoot = (primary, secondary) => {
  document.documentElement.style.setProperty("--storePrimary", primary || DEFAULT_PRIMARY);
  document.documentElement.style.setProperty("--storeSecondary", secondary || DEFAULT_SECONDARY);
};

const ProductDetail = ({ storeId }) => {
  const { id } = useParams();
  const [biz, setBiz] = useState(null);
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [curImg, setCurImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeDisabled, setLikeDisabled] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const navigate = useNavigate();

  const cartKey = `cart_${storeId}`;
  const localLikeKey = `${product?._ft}_${id}`;

   
     useEffect(() => {
       if (!storeId) {
         navigate("/");
         return;
       }
   
       const fetch = async () => {
         try {
           const bizRef = doc(db, "businesses", storeId);
           const snap = await getDoc(bizRef);
           if (!snap.exists()) {
             toast.error("Store not found.");
             navigate("/");
             return;
           }
           const data = snap.data();
           setBusiness(data);
   
           // Determine theme colors: if pro with colors, use theirs; else fallback to defaults
           let primary = DEFAULT_PRIMARY;
           let secondary = DEFAULT_SECONDARY;
   
           if (data.plan?.plan === "pro" && data.customTheme) {
             if (data.customTheme.primaryColor?.trim()) primary = data.customTheme.primaryColor;
             if (data.customTheme.secondaryColor?.trim()) secondary = data.customTheme.secondaryColor;
           }
   
           applyThemeToRoot(primary, secondary);
         } catch (err) {
           console.error("Error loading storefront:", err);
           toast.error("Failed to load store.");
           navigate("/");
         } finally {
           setLoading(false);
         }
       };
   
       fetch();
     }, [storeId, navigate]);
   

  useEffect(() => {
    const fetchData = async () => {
      const bizRef = doc(db, "businesses", storeId);
      const snap = await getDoc(bizRef);
      if (!snap.exists()) return;

      const data = snap.data();
      setBiz(data);

      let found = (data.products || []).find(p => p.prodId === id);
      if (found) {
        setProduct({ ...found, _ft: "product" });
        await trackView(bizRef, "products", "prodId");
        return;
      }

      found = (data.services || []).find(s => s.serviceId === id);
      if (found) {
        setProduct({ ...found, _ft: "service" });
        await trackView(bizRef, "services", "serviceId");
      }
    };

    fetchData();
  }, [storeId, id]);

  useEffect(() => {
    if (!product || !biz) return;

    // Set like status
    const likedProducts = JSON.parse(localStorage.getItem("likedProducts")) || [];
    if (likedProducts.includes(localLikeKey)) {
      setLiked(true);
      setLikeDisabled(true);
    }

    // Load similar products
    if (product._ft === "product") {
      const sameCategory = (biz.products || []).filter(
        p => p.category === product.category && p.prodId !== id
      ).map(p => ({ ...p, _ft: "product" }));

      setSimilarProducts(sameCategory);
    }

  }, [product, biz]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem(cartKey)) || {};
    setQuantity(cart[id] || 0);
  }, [id, cartKey]);

  const dispatchCartUpdate = () => {
    window.dispatchEvent(new CustomEvent("cartUpdated", { detail: storeId }));
  };

  const trackView = async (bizRef, key, idKey) => {
    const snap = await getDoc(bizRef);
    const data = snap.data();
    const items = data[key] || [];

    const updated = items.map(p => {
      if (p[idKey] === id) {
        const views = p.views || 0;
        return { ...p, views: views + 1 };
      }
      return p;
    });

    await updateDoc(bizRef, { [key]: updated });
  };

  const toggleLike = async () => {
    if (likeDisabled || !product) return;

    try {
      const key = product._ft === "product" ? "products" : "services";
      const idKey = key === "products" ? "prodId" : "serviceId";
      const bizRef = doc(db, "businesses", storeId);
      const snap = await getDoc(bizRef);
      const data = snap.data();

      const arr = data[key] || [];
      const updated = arr.map(p => {
        if (p[idKey] === id) {
          return { ...p, likes: (p.likes || 0) + 1 };
        }
        return p;
      });

      await updateDoc(bizRef, { [key]: updated });

      const likedProducts = JSON.parse(localStorage.getItem("likedProducts")) || [];
      likedProducts.push(localLikeKey);
      localStorage.setItem("likedProducts", JSON.stringify(likedProducts));

      setLiked(true);
      setLikeDisabled(true);
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const incCart = () => {
    const cartId = localStorage.getItem("cartId") || uuidv4();
    let cart = JSON.parse(localStorage.getItem(cartKey)) || {};
    cart[id] = (cart[id] || 0) + 1;

    localStorage.setItem(cartKey, JSON.stringify(cart));
    localStorage.setItem("cartId", cartId);

    let analysis = JSON.parse(localStorage.getItem("cartAnalysis")) || {};
    if (!analysis[cartId]) {
      analysis[cartId] = { open: true, closed: false, products: [id] };
    } else if (!analysis[cartId].products.includes(id)) {
      analysis[cartId].products.push(id);
    }
    localStorage.setItem("cartAnalysis", JSON.stringify(analysis));

    setQuantity(cart[id]);
    dispatchCartUpdate();
  };

  const decCart = () => {
    let cart = JSON.parse(localStorage.getItem(cartKey)) || {};
    if (!cart[id]) return;

    if (cart[id] <= 1) delete cart[id];
    else cart[id] -= 1;

    if (Object.keys(cart).length === 0) localStorage.removeItem(cartKey);
    else localStorage.setItem(cartKey, JSON.stringify(cart));

    setQuantity(cart[id] || 0);
    dispatchCartUpdate();
  };
const handleNativeShare = async () => {
  if (!navigator.share) return alert("Native share not supported");

  try {
    const res = await fetch(product.images?.[0], { mode: 'cors' });

    if (!res.ok) throw new Error("Image fetch failed");

    const blob = await res.blob();
    const file = new File([blob], "product.jpg", { type: blob.type });

    await navigator.share({
      title: product.name,
      text: `Check out this ${product._ft} on Minimart`,
      url: window.location.href,
      files: [file],
    });
  } catch (err) {
    console.error("Share failed:", err);
    alert("Share failed: " + err.message);
  }
};




  if (!product || !biz) return <p>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <Navbar storeId={storeId} />
      <div className={styles.top}>
        <div className={styles.left}>
          <img src={product.images?.[curImg]} alt="product" className={styles.mainImg} />
          <div className={styles.thumbRow}>
            {product.images?.map((img, i) => (
              <img
                key={i}
                src={img}
                className={`${styles.thumb} ${i === curImg ? styles.active : ""}`}
                onClick={() => setCurImg(i)}
              />
            ))}
          </div>
        </div>
        <div className={styles.right}>
          <h2 className={styles.name}>{product.name}</h2>
          <p className={styles.price}>₦{(product.price || 0).toLocaleString()}</p>
          <p className={styles.desc}>{product.description}</p>
          <p className={styles.category}>{product.category}</p>
          <div className={styles.cart}>
            {quantity > 0 ? (
              <>
                <button onClick={decCart}>–</button>
                <span>{quantity}</span>
                <button onClick={incCart}>+</button>
              </>
            ) : (
              <button onClick={incCart}>Add to Cart</button>
            )}
          </div>
          <div className={styles.actions}>
            <button className={liked ? styles.liked : ""} onClick={toggleLike}>
              <i className="fa-solid fa-heart"></i> {liked ? "Liked" : "Like"}
            </button>
            <button onClick={handleNativeShare}>
              <i className="fa-solid fa-share-nodes"></i> Share
            </button>
          </div>
          {biz.refundPolicy && (
            <div className={styles.section}>
              <strong>Refunds:</strong> {biz.refundPolicy}
            </div>
          )}
          {biz.shippingPolicy && (
            <div className={styles.section}>
              <strong>Shipping:</strong> {biz.shippingPolicy}
            </div>
          )}
        </div>
      </div>

      <div className={styles.addOns}>
        {similarProducts.length > 0 && (
          <>
            <h3 className={styles.sectionTitle}>Similar Products</h3>
            <div className={styles.similarList}>
              {similarProducts.map((item) => (
                <ProductCard key={item.prodId} storeId={storeId} item={item} />
              ))}
            </div>
          </>
        )}
        <Featured storeId={storeId} />
        <Products storeId={storeId} />
        <Services storeId={storeId} />
        <Footer/>
      </div>
    </div>
  );
};

export default ProductDetail;
