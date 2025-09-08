// Products.jsx
import React, { useEffect, useMemo, useState } from "react";
import useProducts from "./useProducts";
import ProductCard from "./productCard";
import ProductModal from "./productModal";
import { Toaster, toast } from "sonner";


export default function Products() {
  const { data, isLoading, isError, refetch, saveProduct, deleteProduct, toggleFeature, toggleAvailability } = useProducts();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [imgIndexes, setImgIndexes] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (data?.products) setProducts(data.products);
  }, [data]);

  const categories = useMemo(() => {
    const s = new Set();
    (products || []).forEach((p) => p.category && s.add(p.category));
    return Array.from(s);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let arr = products || [];
    if (categoryFilter && categoryFilter !== "all") arr = arr.filter((p) => p.category === categoryFilter);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      arr = arr.filter((p) => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
    }
    return arr;
  }, [products, search, categoryFilter]);

  const currency = data?.business?.currency || "₦";

  // open modal for new product
  const openAdd = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  // open modal for edit
  const openEdit = (prod) => {
    setEditProduct(prod);
    setModalOpen(true);
  };


  const handleDelete = async (prod) => {
    // confirm first
    setDeleteConfirm(prod.prodId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const updated = await deleteProduct(deleteConfirm);
      setProducts(updated);
      toast.success("Product deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting product.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleFeature = async (prod) => {
    try {
      await toggleFeature(prod.prodId);
      toast.success("Product feature toggled.");
    } catch (err) {
      console.error(err);
      toast.error("Error toggling feature.");
    }
  };

  const handleAvailable = async (prod) => {
    try {
      const updated = await toggleAvailability(prod.prodId);
      setProducts(updated);
      toast.success("Availability updated.");
    } catch (err) {
      console.error(err);
      toast.error("Error updating availability.");
    }
  };

  return (
    <div style={{width: "95%"}} >
      <Toaster position="top-right" richColors />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Products</h2>
        <button onClick={openAdd} style={{ padding: "8px 12px", borderRadius: 8, background: "var(--secondary-color, #2b6cb0)", color: "#fff", border: "none" }}>
          <i className="fa-solid fa-plus" style={{ marginRight: 8 }} /> Add product
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 12, marginBottom: 18 }}>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
          <option value="">Sort by category</option>
          <option value="all">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, borderRadius: 8, flex: 1 , outline: "none", border: "1px solid grey", maxWidth: "300px"}}
        />
      </div>

      {isLoading ? (
        <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 28 }} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: "center", color: "#777", padding: 40 }}>
          <i className="fa-solid fa-inbox" style={{ fontSize: 36 }} />
          <div style={{ marginTop: 8 }}>No Products</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 16, width: "100%", alignItems: "center", justifyContent: "center"}}>
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.prodId}
              prod={prod}
              currency={currency}
              imgIndex={imgIndexes[prod.prodId] || 0}
              setImgIndex={(idx) => setImgIndexes((prev) => ({ ...prev, [prod.prodId]: idx }))}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              featuredArr={data?.business?.featured || []}
              onEdit={(p) => openEdit(p)}
              onFeature={handleFeature}
              onAvailable={handleAvailable}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialProduct={editProduct}
        categories={categories}
        saveProduct={async (args) => {
          // call saveProduct from hook and update local products immediately
          try {
            const updated = await saveProduct(args);
            setProducts(updated);
            return updated;
          } catch (err) {
            throw err;
          }
        }}
        onSaved={(updatedProducts) => {
          setProducts(updatedProducts);
        }}
      />

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.18)" }}>
          <div style={{ width: 360, background: "#fff", padding: 20, borderRadius: 10, boxShadow: "0 8px 40px rgba(0,0,0,0.12)", textAlign: "center" }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ color: "#e74c3c", fontSize: 28 }} />
            <h4 style={{ marginTop: 8 }}>Delete Product?</h4>
            <p style={{ color: "#666" }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={confirmDelete} style={{ flex: 1, padding: 10, background: "#e74c3c", color: "#fff", border: "none", borderRadius: 8 }}>Delete</button>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: 10, background: "#eee", border: "none", borderRadius: 8 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
