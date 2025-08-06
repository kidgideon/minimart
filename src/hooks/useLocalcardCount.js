// hooks/useLocalCartCount.js
import { useCallback, useEffect, useState } from "react";

function useLocalCartCount(storeId) {
  const storageKey = `cart_${storeId}`;

  const parseCart = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return 0;

      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        return Object.values(obj).reduce((sum, qty) => sum + qty, 0);
      }
    } catch (err) {
      console.error("Failed to parse cart:", err);
    }
    return 0;
  };

  const [count, setCount] = useState(parseCart());

  const refresh = useCallback(() => {
    setCount(parseCart());
  }, [storeId]);

  useEffect(() => {
    // Handle manual storage event (different tabs)
    const onStorage = (e) => {
      if (e.key === storageKey) refresh();
    };
    window.addEventListener("storage", onStorage);

    // Listen to local custom event
    const onCartUpdate = (e) => {
      if (e.detail === storeId) refresh();
    };
    window.addEventListener("cartUpdated", onCartUpdate);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cartUpdated", onCartUpdate);
    };
  }, [refresh, storageKey, storeId]);

  return count;
}

export default useLocalCartCount;
