import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Papa from "papaparse";
import ProductCard from "../components/ProductCard";
import RecommendedModal from "../components/RecommendedModal";
import categoryImages from "../data/CategoryImages"; // Adjust if path is different
import sampleProducts from "../sampleProducts";

const Products = ({ addToCart, wishlist, toggleWishlist }) => {
  const location = useLocation();
  const categoryFromHome = location.state?.selectedCategory || null;

  const [allProducts, setAllProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        // Get UserID from localStorage
        const storedUserId = localStorage.getItem("loggedInUserID");
        if (storedUserId) {
          setUserId(storedUserId);
        }

        // Load product data
        const productsPromise = new Promise((resolve, reject) => {
          Papa.parse("/curated_product_sample.csv", {
            download: true,
            header: true,
            complete: (result) => {
              if (isMounted) {
                const data = result.data.filter(item => item.ProductID);
                setAllProducts(data);
                const categories = Array.from(
                  new Map(data.map(item => [item.CategoryID, item.CategoryName])).entries()
                ).map(([id, name]) => ({ id, name }));
                setUniqueCategories(categories);

                if (categoryFromHome) {
                  const matched = categories.find(cat => cat.name === categoryFromHome);
                  if (matched) {
                    setSelectedCategory(matched.id);
                    setSelectedCategoryName(matched.name);
                  }
                }
                resolve();
              }
            },
            error: (error) => {
              if (isMounted) {
                setError("Failed to load products data");
                reject(error);
              }
            }
          });
        });

        // Load recommendation data
        const recommendationsPromise = new Promise((resolve, reject) => {
          Papa.parse("/Recommendations.csv", {
            download: true,
            header: true,
            complete: (result) => {
              if (isMounted) {
                setRecommendations(result.data);
                resolve();
              }
            },
            error: (error) => {
              if (isMounted) {
                setError("Failed to load recommendations data");
                reject(error);
              }
            }
          });
        });

        await Promise.all([productsPromise, recommendationsPromise]);
        if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [categoryFromHome]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const filteredCategories = uniqueCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = selectedCategory
    ? allProducts.filter(p => p.CategoryID === selectedCategory)
    : [];

  const handleRecommendClick = (productId) => {
    console.log("userId:", userId, typeof userId);
    console.log("productId:", productId, typeof productId);
    console.log("Sample recommendations:", recommendations.slice(0, 3));

    const match = recommendations.find(
      r => String(r.UserID).trim() === String(userId).trim() &&
           String(r.ProductID).trim() === String(productId).trim()
    );

    console.log("Match found:", match);

    if (match) {
      const recIDs = [
        match.Recommendation1,
        match.Recommendation2,
        match.Recommendation3,
        match.Recommendation4,
        match.Recommendation5
      ].filter(Boolean);

      console.log("recIDs:", recIDs);
      const recProducts = allProducts.filter(p => recIDs.includes(p.ProductID));
      console.log("recProducts:", recProducts);
      setRecommendedProducts(recProducts);
    } else {
      setRecommendedProducts([]);
    }

    setShowRecommendation(true);
  };

  return (
    <div>
      <h2>Products</h2>

      <input
        type="text"
        placeholder="Search for category..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: "8px", width: "100%", marginBottom: "16px" }}
      />

      {!selectedCategory && (
        <div
          className="category-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px"
          }}
        >
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              style={{
                border: "1px solid #ccc",
                padding: "12px",
                borderRadius: "6px",
                cursor: "pointer",
                textAlign: "center",
                backgroundColor: "#f9f9f9"
              }}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedCategoryName(cat.name);
              }}
            >
              <img
                src={categoryImages[cat.name] || "/images/categories/default.jpg"}
                alt={cat.name}
                style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "4px" }}
              />
              <h4 style={{ marginTop: "8px" }}>{cat.name}</h4>
            </div>
          ))}
        </div>
      )}

      {selectedCategory && (
        <>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedCategoryName("");
            }}
            style={{ margin: "20px 0" }}
          >
            ← Back to Categories
          </button>

          <h3>{selectedCategoryName} Products</h3>

          {/* Product Grid */}
          <div
            className="product-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px"
            }}
          >
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.ProductID || index}
                product={{
                  id: product.ProductID,
                  name: product.ModelID,
                  brand: product.BrandName,
                  category: product.CategoryName,
                  specification: product.SpecificationName,
                  price: Number(product.Price),
                  feature: product.UniqueFeature,
                  stock: product.Stock,
                  image: categoryImages[product.CategoryName] || "/images/categories/default.jpg"
                }}
                addToCart={addToCart}
                toggleWishlist={toggleWishlist}
                wishlist={wishlist}
                onRecommendClick={() => handleRecommendClick(product.ProductID)}
              />
            ))}
          </div>
        </>
      )}

      {showRecommendation && (
        <RecommendedModal
          recommendedProducts={recommendedProducts}
          onClose={() => setShowRecommendation(false)}
          addToCart={addToCart}
          toggleWishlist={toggleWishlist}
          wishlist={wishlist}
        />
      )}
    </div>
  );
};

export default Products;