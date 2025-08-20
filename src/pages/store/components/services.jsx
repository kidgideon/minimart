import { useEffect, useState } from "react";
import styles from "./services.module.css";
import { db } from "../../../hooks/firebase";
import { doc, getDoc } from "firebase/firestore";
import ProductCard from "./productCard";

const Services = ({ storeId }) => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const fetchServices = async () => {
      if (!storeId) return;
      const docRef = doc(db, "businesses", storeId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const serviceData = docSnap.data().services || [];
        setServices(serviceData);
        setFilteredServices(serviceData);
      }
    };
    fetchServices();
  }, [storeId]);

  useEffect(() => {
    
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  }, [searchTerm, selectedCategory, services]);

  if (services.length === 0) return null;

  const categories = ["All", ...new Set(services.map(s => s.category).filter(Boolean))];

  return (
    <div className={styles.servicesContainer}>
      <div className={styles.header}>
        <h2>Our Services</h2>

        <div className={styles.filters}>
          <div className={styles.inputGroup}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <i className="fas fa-filter"></i>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {filteredServices.map(service => (
          <ProductCard
            key={service.serviceId}
            storeId={storeId}
            item={{ ...service, _ft: "service" }} // Inject _ft for ProductCard compatibility
          />
        ))}
      </div>
    </div>
  );
};

export default Services;
