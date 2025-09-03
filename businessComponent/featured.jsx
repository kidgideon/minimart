import styles from "./featured.module.css";
import design from "./itemDesign.module.css";
import { motion } from "framer-motion";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { auth, db } from "../src/hooks/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";

const Featured = () => {
  const scrollRef = useRef();
  const [imgSlider, setImgSlider] = useState({});

  // --- Fetch featured items with React Query ---
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["featuredItems"],
    queryFn: () =>
      new Promise((resolve, reject) => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) {
            unsub();
            return reject(new Error("User not authenticated"));
          }
          try {
            const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
            const userData = userDoc.exists() ? userDoc.data() : null;
            if (!userData?.businessId) throw new Error("No business linked");

            const businessDoc = await getDoc(doc(db, "businesses", userData.businessId));
            const businessData = businessDoc.exists() ? businessDoc.data() : null;

            const featuredArr = businessData?.featured || [];
            const items = [];

            featuredArr.forEach((f) => {
              if (f.type === "product") {
                const prod = businessData.products?.find(p => p.prodId === f.id);
                if (prod) items.push({ ...prod, _ftype: "product" });
              } else if (f.type === "service") {
                const svc = businessData.services?.find(s => s.serviceId === f.id);
                if (svc) items.push({ ...svc, _ftype: "service" });
              }
            });

            resolve({ user: firebaseUser, business: businessData, featuredArr, items });
          } catch (err) {
            reject(err);
          } finally {
            unsub();
          }
        });
      }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const business = data?.business || null;
  const items = data?.items || [];
  const featuredArr = data?.featuredArr || [];

  // --- Image preloading & slider setup ---
  useEffect(() => {
    items.forEach((item, idx) => {
      const id = item.prodId || item.serviceId || idx;
      const imgs = item.images?.slice(0, 3) || [];
      const slider = imgSlider[id] || { idx: 0 };
      if (imgs.length > 1) {
        const nextIdx = (slider.idx + 1) % imgs.length;
        const prevIdx = (slider.idx - 1 + imgs.length) % imgs.length;
        [nextIdx, prevIdx].forEach(i => {
          if (imgs[i]) new window.Image().src = imgs[i];
        });
      }
    });
  }, [items, imgSlider]);

  const goToImg = (id, slider, newIdx) => {
    if (slider.isSliding || newIdx === slider.idx) return;
    setImgSlider(prev => ({
      ...prev,
      [id]: { idx: newIdx, direction: newIdx > slider.idx ? 1 : -1, isSliding: true }
    }));
    setTimeout(() => {
      setImgSlider(prev => ({
        ...prev,
        [id]: { ...prev[id], isSliding: false }
      }));
    }, 400);
  };

   // Truncate description
  const truncate = (str, n) => (str && str.length > n ? str.slice(0, n) + "..." : str);


  return (
    <div className={styles.featured}>
      <div className={styles.top}>
        <p className={styles.tag}>Featured Items</p>
      </div>
      <div className={styles.scrollableArea}>
        <div className={styles.starArea}><i className="fa-solid fa-star"></i></div>

        {isLoading ? (
          <div className={styles.loadingElement}><i className="fa-solid fa-spinner fa-spin"></i></div>
        ) : items.length === 0 ? (
          <div className={styles.noFeatured}>
            <i className="fa-solid fa-inbox"></i>
            <p>No featured Item</p>
          </div>
        ) : (
          <div ref={scrollRef} className={styles.featuredScroll}>
            {items.map((item, idx) => {
              const id = item.prodId || item.serviceId || idx;
              const imgs = item.images?.slice(0, 3) || [];
              const slider = imgSlider[id] || { idx: 0, direction: 0, isSliding: false };

              return (
                <motion.div
                  key={id}
                  className={`${design.card} ${item._ftype === 'service' ? design.serviceCard : design.featuredCard}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.32 }}
                >
                  <div className={design.featuredImgWrap}>
                    <motion.div
                      key={slider.idx}
                      initial={{ x: slider.direction > 0 ? 120 : -120, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.38 }}
                      className={design.featuredImgContainer}
                    >
                      {imgs[slider.idx] && (
                        <img src={imgs[slider.idx]} alt={item.name} className={design.featuredImg} />
                      )}
                    </motion.div>
                    {imgs.length > 1 && (
                      <div className={design.sliderDots}>
                        {imgs.map((_, i) => (
                          <span key={i} onClick={() => goToImg(id, slider, i)} className={i === slider.idx ? `${design.dot} ${design.activeDot}` : design.dot}></span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={design.featuredCardInfo}>
                    <p className={design.itemName}>{item.name}</p>
                    <p className={design.itemPrice}>{item.price ? `₦${item.price.toLocaleString()}` : ''}</p>
                    <p className={design.itemDescription}>{truncate(item.description, 60)}</p>
                    <div className={design.shareable}>
                      <p className={design.collection}>{item.category}</p>
                      <p
                        className={design.nodeShare}
                        style={{ cursor: "pointer" }}
                        onClick={async () => {
                          const shareData = {
                            url: `https://${business?.businessId}.minimart.ng/product/${id}`,
                          };
                          try {
                            if (navigator.share) await navigator.share(shareData);
                            else await navigator.clipboard.writeText(shareData.url);
                          } catch (err) { console.error(err); }
                        }}
                      >
                        <i className="fa-solid fa-share-nodes"></i>
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Featured;
