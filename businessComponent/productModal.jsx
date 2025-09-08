// ProductModal.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

/**
 * ProductModal props:
 * - isOpen
 * - onClose()
 * - initialProduct (or null)
 * - categories (array)
 * - saveProduct({ fields, imageFiles, previews, editProduct }) -> returns updatedProducts
 * - onSaved(updatedProducts) optional callback
 */
export default function ProductModal({ isOpen, onClose, initialProduct = null, categories = [], saveProduct, onSaved }) {
  const [fields, setFields] = useState({ name: "", description: "", price: "", category: "", availability: true });
  const [modalImages, setModalImages] = useState([null, null, null]); // File objects
  const [modalPreviews, setModalPreviews] = useState([null, null, null]); // URLs (existing)
  const [loading, setLoading] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  useEffect(() => {
    if (initialProduct) {
      setFields({
        name: initialProduct.name || "",
        description: initialProduct.description || "",
        price: initialProduct.price ? String(initialProduct.price) : "",
        category: initialProduct.category || "",
        availability: initialProduct.availability !== false,
      });
      setModalImages([null, null, null]);
      setModalPreviews([
        initialProduct.images && initialProduct.images[0] ? initialProduct.images[0] : null,
        initialProduct.images && initialProduct.images[1] ? initialProduct.images[1] : null,
        initialProduct.images && initialProduct.images[2] ? initialProduct.images[2] : null,
      ]);
      setNewCategoryInput("");
    } else {
      setFields({ name: "", description: "", price: "", category: "", availability: true });
      setModalImages([null, null, null]);
      setModalPreviews([null, null, null]);
      setNewCategoryInput("");
    }
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setModalImages((prev) => {
      const arr = [...prev];
      arr[idx] = file;
      return arr;
    });
    setModalPreviews((prev) => {
      const arr = [...prev];
      arr[idx] = url;
      return arr;
    });
  };

  const handlePriceChange = (e) => {
    // accept digits only (no decimals)
    const val = e.target.value.replace(/\D/g, "");
    setFields((f) => ({ ...f, price: val }));
  };

  const handleSave = async () => {
    // concise validation
    if (!fields.name.trim()) {
      toast.error("No name");
      return;
    }
    if (!fields.price || Number(fields.price) <= 0) {
      toast.error("No price");
      return;
    }
    if (!fields.category || fields.category === "__new__") {
      // if "__new__" is selected but newCategoryInput provided then accept it
      if (fields.category === "__new__" && newCategoryInput.trim()) {
        setFields((f) => ({ ...f, category: newCategoryInput.trim() }));
      } else {
        toast.error("No category");
        return;
      }
    }
    if (!modalPreviews[0] && !modalImages[0]) {
      toast.error("No photo");
      return;
    }

    setLoading(true);
    try {
      const updatedProducts = await saveProduct({
        fields,
        imageFiles: modalImages,
        previews: modalPreviews,
        editProduct: initialProduct,
      });
      toast.success(initialProduct ? "Product updated!" : "Product added!");
      if (onSaved) onSaved(updatedProducts);
      onClose();
    } catch (err) {
      console.error("saveProduct err:", err);
      toast.error("Error saving product.");
    } finally {
      setLoading(false);
    }
  };

  // Inject small CSS for modal, price input, and custom select (keeps this single-file)
  const injectedStyles = `
.product-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.18); display:flex; align-items:center; justify-content:center; z-index:1000;
}
.product-modal-box {
  background:#fff; border-radius:12px; max-width:460px; width:92%; padding:20px; box-shadow:0 8px 40px rgba(0,0,0,0.12);
}
.image-upload-row { display:flex; gap:12px; justify-content:center; margin-bottom:14px; }
.img-uploader { width:64px; height:64px; border-radius:50%; background:#f2f2f2; border:2px solid #ddd; display:flex; align-items:center; justify-content:center; overflow:hidden; cursor:pointer; position:relative; }
.img-uploader img { width:95%; height:100%; object-fit:cover; display:block; }
.priceInputWrapper { position:relative; width:95%; margin-bottom:10px; }
.priceInputWrapper .currencyTag { position:absolute; left:12px; top:50%; transform:translateY(-50%); font-weight:700; color:#444; }
.priceInputWrapper input { width: 93%; padding:10px 10px 10px 34px; border-radius:8px; border:1px solid #eee; font-size:14px; }
.customSelect { margin-bottom:10px; }
.customSelect select { -webkit-appearance:none; -moz-appearance:none; appearance:none; width:100%; padding:10px 12px; border-radius:8px; border:1px solid #eee; background: #fff url("data:image/svg+xml;utf8,<svg fill='%23555' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>") no-repeat right 12px center; background-size:14px; cursor:pointer; }
.customSelect input.new-cat { margin-top:8px; width:95%; padding:10px; border-radius:8px; border:1px solid #eee; outline: none; }
.modal-actions { display:flex; gap:10px; margin-top:14px; }
.modal-actions button { flex:1; padding:10px 0; border-radius:8px; border:none; cursor:pointer; font-weight:600; }
.btn-save { background:var(--secondary-color); color:#fff; }
.btn-cancel { background:#eee; color:#333; }
.small-required { font-size:11px; color:#888; margin-top:6px; text-align:center; }
`;

  return (
    <div className="product-modal-root">
      <style>{injectedStyles}</style>
      <div className="product-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.22 }}
          className="product-modal-box"
        >
          <h3 style={{ marginBottom: 12 }}>{initialProduct ? "Edit Product" : "Add Product"}</h3>

          <div className="image-upload-row">
            {[0, 1, 2].map((idx) => (
              <label key={idx} className="img-uploader" title={`Photo ${idx + 1}`}>
                {modalPreviews[idx] ? (
                  <img src={modalPreviews[idx]} alt={`preview-${idx}`} />
                ) : (
                  <span style={{ color: "#888", fontSize: 12 }}>{`Photo ${idx + 1}`}</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleImageChange(e, idx)}
                />
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <input
              type="text"
              placeholder="Product Name"
              value={fields.name}
              onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #eee" }}
            />
          </div>

          <textarea
            placeholder="Description"
            value={fields.description}
            onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
            style={{ width: "95%", minHeight: 64, padding: 10, borderRadius: 8, border: "1px solid #eee", marginBottom: 10 }}
          />

          <div className="priceInputWrapper">
            <span className="currencyTag">₦</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Price"
              value={fields.price}
              onChange={handlePriceChange}
            />
          </div>

          <div className="customSelect">
            <select
              value={fields.category}
              onChange={(e) => {
                const val = e.target.value;
                setFields((f) => ({ ...f, category: val }));
                if (val !== "__new__") setNewCategoryInput("");
              }}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__new__">+ Add new category</option>
            </select>

            {fields.category === "__new__" && (
              <input
                className="new-cat"
                placeholder="New category name"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onBlur={() => {
                  if (newCategoryInput.trim()) {
                    setFields((f) => ({ ...f, category: newCategoryInput.trim() }));
                  }
                }}
              />
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 14, color: "#555" }}>
              <input
                type="checkbox"
                checked={fields.availability}
                onChange={(e) => setFields((f) => ({ ...f, availability: e.target.checked }))}
                style={{ marginRight: 8 }}
              />
              Available
            </label>
          </div>

          <div className="modal-actions">
            <button className="btn-save" onClick={handleSave} disabled={loading}>
              {loading ? <i className="fa-solid fa-spinner fa-spin" /> : "Save"}
            </button>
            <button className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>

          <div className="small-required">
            <span style={{ color: "#888" }}>* All photos are required</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
