import { useEffect, useState } from "react";
import styles from "./products.module.css";
import ProductCard from "./productCard";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../hooks/firebase";

const Products = ({ storeId }) => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);

  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return;
      try {
        const ref = doc(db, "businesses", storeId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const allProducts = data.products || [];
          setProducts(allProducts);
          setFiltered(allProducts);

          const uniqueCategories = [
            "All",
            ...new Set(allProducts.map(p => p.category).filter(Boolean)),
          ];
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    fetchData();
  }, [storeId]);

  useEffect(() => {
    let result = [...products];

    if (searchTerm.trim()) {
      result = result.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory);
    }

    setFiltered(result);
  }, [searchTerm, selectedCategory, products]);

  if (products.length === 0) return null;

  return (
    <div className={styles.productsPage}>
      <h2 className={styles.header}>All Products</h2>

      <div className={styles.controls}>
        <div className={styles.inputGroup}>
          <i className="fa fa-search" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.inputGroup}>
          <i className="fa fa-filter" />
          <select
            className={styles.dropdown}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.productsWrapper}>
        {filtered.length > 0 ? (
          filtered.map(product => (
            <ProductCard
              key={product.prodId}
              storeId={storeId}
              item={{ ...product, _ft: "product" }} // FIXED: consistent _ft
            />
          ))
        ) : (
          <p className={styles.noResults}>No matching products found.</p>
        )}
      </div>
    </div>
  );
};

export default Products;
