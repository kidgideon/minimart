// useProducts.js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../src/hooks/firebase";

/**
 * useProducts hook returns:
 *  - data: { user, business, products }
 *  - isLoading, isError, refetch
 *  - saveProduct({ fields, imageFiles, previews, editProduct })
 *  - deleteProduct(prodId)
 *  - toggleFeature(prodId)
 *  - toggleAvailability(prodId)
 */
export default function useProducts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["products"],
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
            if (!userData?.businessId) throw new Error("No business ID linked");

            const businessDoc = await getDoc(doc(db, "businesses", userData.businessId));
            const businessData = businessDoc.exists() ? businessDoc.data() : null;

            const sortedProducts = businessData?.products
              ? [...businessData.products].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
              : [];

            resolve({ user: firebaseUser, business: businessData, products: sortedProducts });
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

  // Save (create or update) product
  const saveProduct = async ({ fields, imageFiles = [null, null, null], previews = [null, null, null], editProduct = null }) => {
    if (!query.data) throw new Error("No user/business loaded");
    const { user, business, products = [] } = query.data;
    const businessId = business.businessId || business.id;
    // Build image links: start from previews (existing URLs) then upload files where provided
    const links = Array.from({ length: 3 }, (_, i) => (previews && previews[i] ? previews[i] : null));
    for (let i = 0; i < 3; i++) {
      if (imageFiles && imageFiles[i]) {
        const file = imageFiles[i];
        const path = `products/${user.uid}/${Date.now()}_${i}_${file.name}`;
        const sref = storageRef(storage, path);
        await uploadBytes(sref, file);
        const url = await getDownloadURL(sref);
        links[i] = url;
      }
    }
    const imageLinks = links.filter(Boolean);

    const prodId = editProduct ? editProduct.prodId : `prod${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 9000)}`;
    const newProduct = {
      prodId,
      name: (fields.name || "").trim(),
      description: (fields.description || "").trim(),
      price: Number(fields.price || 0),
      category: fields.category || "",
      images: imageLinks,
      availability: fields.availability !== false,
      featured: editProduct ? editProduct.featured : false,
      dateAdded: editProduct ? editProduct.dateAdded : new Date().toISOString(),
    };

    const updatedProducts = editProduct
      ? products.map((p) => (p.prodId === prodId ? newProduct : p))
      : [newProduct, ...products];

    const businessRef = doc(db, "businesses", businessId);
    await updateDoc(businessRef, { products: updatedProducts });

    // Update cache
    queryClient.setQueryData(["products"], { user, business: { ...business }, products: updatedProducts });

    return updatedProducts;
  };

  // Delete product
  const deleteProduct = async (prodId) => {
    if (!query.data) throw new Error("No user/business loaded");
    const { user, business, products = [] } = query.data;
    const businessId = business.businessId || business.id;
    const updatedProducts = products.filter((p) => p.prodId !== prodId);
    const businessRef = doc(db, "businesses", businessId);
    await updateDoc(businessRef, { products: updatedProducts });
    queryClient.setQueryData(["products"], { user, business: { ...business }, products: updatedProducts });
    return updatedProducts;
  };

  // Toggle feature (adds/removes from business.featured)
  const toggleFeature = async (prodId) => {
    if (!query.data) throw new Error("No user/business loaded");
    const { user, business = {}, products = [] } = query.data;
    const businessId = business.businessId || business.id;
    const featuredArr = Array.isArray(business.featured) ? business.featured : [];
    const exists = featuredArr.some((f) => f.id === prodId && f.type === "product");
    const newArr = exists
      ? featuredArr.filter((f) => !(f.id === prodId && f.type === "product"))
      : [{ id: prodId, type: "product", dateAdded: new Date().toISOString() }, ...featuredArr];
    const businessRef = doc(db, "businesses", businessId);
    await updateDoc(businessRef, { featured: newArr });
    queryClient.setQueryData(["products"], { user, business: { ...business, featured: newArr }, products });
    return newArr;
  };

  // Toggle availability
  const toggleAvailability = async (prodId) => {
    if (!query.data) throw new Error("No user/business loaded");
    const { user, business = {}, products = [] } = query.data;
    const businessId = business.businessId || business.id;
    const updatedProducts = products.map((p) => (p.prodId === prodId ? { ...p, availability: !p.availability } : p));
    const businessRef = doc(db, "businesses", businessId);
    await updateDoc(businessRef, { products: updatedProducts });
    queryClient.setQueryData(["products"], { user, business: { ...business }, products: updatedProducts });
    return updatedProducts;
  };

  return {
    ...query,
    saveProduct,
    deleteProduct,
    toggleFeature,
    toggleAvailability,
    refetch: query.refetch,
  };
}
