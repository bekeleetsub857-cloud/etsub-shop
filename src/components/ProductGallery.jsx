import Header from "../components/Header";
import { useState, useEffect } from "react";
import ProductGallery from "../components/ProductGallery";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  // Load products from localStorage
  useEffect(() => {
    const data = localStorage.getItem("products");
    if (data) {
      const parsedData = JSON.parse(data);
      setProducts(parsedData);
      setFilteredProducts(parsedData);
      
      // Extract unique categories
      const uniqueCategories = ["all", ...new Set(parsedData.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    }
    setLoading(false);
  }, []);

  // Apply filters whenever criteria change
  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(product => product.status === selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.finalPrice - b.finalPrice;
        case "price-high":
          return b.finalPrice - a.finalPrice;
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, selectedStatus, sortBy]);

  // Calculate statistics
  const stats = {
    total: products.length,
    onHand: products.filter(p => p.status === "onhand").length,
    byOrder: products.filter(p => p.status === "byorder").length,
    soldOut: products.filter(p => p.status === "sold").length,
  };

  const handleQuickOrder = (product) => {
    const message = `Hello! I'm interested in ordering: ${product.name} (${product.finalPrice} ETB)`;
    const whatsappUrl = `https://wa.me/251992011629?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="relative text-center py-20 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Affordable Fashion From <span className="text-pink-200">Shen Market</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            Colorful, clean, and modern styles curated by Etsub
          </p>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-6 mb-8 flex-wrap">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm opacity-80">Products</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-2xl font-bold text-green-300">{stats.onHand}</div>
              <div className="text-sm opacity-80">Available</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="text-2xl font-bold text-blue-300">{stats.byOrder}</div>
              <div className="text-sm opacity-80">By Order</div>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#products"
              className="px-8 py-3 bg-white text-purple-700 font-bold rounded-full hover:bg-gray-100 transition-all transform hover:-translate-y-1 shadow-lg"
            >
              Shop Now
            </a>
            <a
              href="https://wa.me/251992011629"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-all transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2"
            >
              <span>💬</span> Chat with Us
            </a>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Products Section */}
      <div id="products" className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters & Controls */}
        <div className="mb-10 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-3xl font-bold text-purple-700">
                Our Products <span className="text-gray-400">({filteredProducts.length})</span>
              </h2>
              <p className="text-gray-600 mt-2">
                All prices include shipping, taxes, and service fees
              </p>
            </div>

            <div className="w-full lg:w-auto space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full lg:w-64 px-4 py-3 pl-12 rounded-full border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="absolute left-4 top-3.5 text-gray-400">
                  🔍
                </div>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-3">
                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none px-4 py-2 pr-8 rounded-full border border-gray-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {categories.filter(cat => cat !== "all").map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-2.5 pointer-events-none">▼</div>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedStatus("all")}
                    className={`px-4 py-2 rounded-full transition ${selectedStatus === "all" ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedStatus("onhand")}
                    className={`px-4 py-2 rounded-full transition ${selectedStatus === "onhand" ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => setSelectedStatus("byorder")}
                    className={`px-4 py-2 rounded-full transition ${selectedStatus === "byorder" ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    By Order
                  </button>
                </div>

                {/* Sort By */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none px-4 py-2 pr-8 rounded-full border border-gray-300 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                  <div className="absolute right-3 top-2.5 pointer-events-none">▼</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-inner">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {products.length === 0
                ? "No products available yet. Check back soon!"
                : "Try changing your search or filter criteria."}
            </p>
            {(searchTerm || selectedCategory !== "all" || selectedStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                }}
                className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Product Image/Video Gallery - IMPORTANT: Fixed the carousel link issue */}
                <div className="relative overflow-hidden">
                  <div className="relative">
                    <ProductGallery images={product.images} videos={product.videos} />
                    
                    {/* Add overlay to prevent carousel link interference */}
                    <div className="absolute inset-0 z-10 pointer-events-none"></div>
                    
                    {/* Quick Order Overlay - Now properly positioned */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 pointer-events-auto">
                      <button
                        onClick={() => handleQuickOrder(product)}
                        className="px-6 py-3 bg-white text-purple-700 font-bold rounded-full hover:bg-gray-100 transition transform hover:scale-105"
                      >
                        Quick Order
                      </button>
                    </div>
                  </div>
                  
                  {/* Status Badge - Now above overlay */}
                  <div className="absolute top-3 left-3 z-30">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                        product.status === "onhand"
                          ? "bg-green-500"
                          : product.status === "byorder"
                          ? "bg-blue-500"
                          : "bg-red-500"
                      }`}
                    >
                      {product.status === "onhand"
                        ? "Available"
                        : product.status === "byorder"
                        ? "By Order"
                        : "Sold Out"}
                    </span>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{product.name}</h3>
                    <div className="flex gap-1">
                      {product.category && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  )}

                  {/* Product Specs */}
                  <div className="flex gap-2 mb-4">
                    {product.size && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        Size: {product.size}
                      </span>
                    )}
                    {product.color && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        Color: {product.color}
                      </span>
                    )}
                  </div>

                  {/* Pricing - SHOW ONLY FINAL PRICE */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-purple-700">
                          {product.finalPrice?.toLocaleString()} ETB
                        </p>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          All-inclusive price
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Includes shipping, taxes & service fees
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.createdAt && (
                        <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <a
                      href={`https://wa.me/251992011629?text=${encodeURIComponent(`Hello! I'm interested in: ${product.name} (${product.finalPrice} ETB)`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
                    >
                      <span>💬</span> WhatsApp
                    </a>
                    <a
                      href="https://t.me/EtsubOnline"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    >
                      <span>📱</span> Telegram
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Explanation Section */}
      <section className="bg-gradient-to-r from-gray-50 to-gray-100 py-12 mt-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-purple-700 mb-4">Transparent Pricing</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our prices are all-inclusive, so you know exactly what you're paying for
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <div className="text-3xl mb-4">🚢</div>
              <h3 className="font-bold text-lg mb-2">Shipping Included</h3>
              <p className="text-gray-600">All shipping costs from China to Ethiopia are covered</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="font-bold text-lg mb-2">Taxes & Customs</h3>
              <p className="text-gray-600">All import duties and taxes are already included</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <div className="text-3xl mb-4">💼</div>
              <h3 className="font-bold text-lg mb-2">Service Fees</h3>
              <p className="text-gray-600">Agent service fees and handling are included</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-700 bg-purple-50 inline-block px-6 py-3 rounded-full">
              <span className="font-bold">No hidden costs!</span> The price you see is what you pay
            </p>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {stats.onHand > 0 && (
        <section className="bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 py-16 mt-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-purple-700 mb-4">Featured Products</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Check out our most popular items that are ready for immediate purchase
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {products
                .filter(p => p.status === "onhand")
                .slice(0, 3)
                .map(product => (
                  <div key={product.id} className="bg-white rounded-xl shadow-lg p-6">
                    {product.images[0] && (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                    <p className="text-2xl font-bold text-purple-700 mb-4">{product.finalPrice} ETB</p>
                    <a
                      href={`https://wa.me/251992011629?text=${encodeURIComponent(`Hello! I want to buy: ${product.name} (${product.finalPrice} ETB)`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center rounded-lg font-bold hover:opacity-90 transition"
                    >
                      Buy Now
                    </a>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="bg-gradient-to-r from-purple-700 to-blue-700 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Upgrade Your Style?</h2>
          <p className="text-xl mb-10 opacity-90">
            Contact us today to place your order or ask about our latest arrivals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/251992011629"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition flex items-center justify-center gap-3 text-lg"
            >
              <span className="text-xl">💬</span> Chat on WhatsApp
            </a>
            <a
              href="https://t.me/EtsubOnline"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition flex items-center justify-center gap-3 text-lg"
            >
              <span className="text-xl">📱</span> Join Telegram
            </a>
          </div>
          <p className="mt-8 text-lg">
            📞 Call us: <a href="tel:+251992011629" className="underline font-bold">+251 992 011 629</a>
          </p>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-r from-purple-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Etsub Online</h3>
              <p className="text-gray-300">
                Bringing you the best fashion from Shen Market with quality and affordability.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#products" className="text-gray-300 hover:text-white transition">All Products</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">Available Items</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition">By Order</a></li>
                <li><a href="https://wa.me/251992011629" className="text-gray-300 hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Contact Info</h4>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span>📞</span> +251 992 011 629
                </li>
                <li className="flex items-center gap-2">
                  <span>💬</span> WhatsApp Available
                </li>
                <li className="flex items-center gap-2">
                  <span>📱</span> Telegram: @EtsubOnline
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">Business Hours</h4>
              <ul className="space-y-2 text-gray-300">
                <li>Mon - Fri: 9AM - 8PM</li>
                <li>Saturday: 10AM - 6PM</li>
                <li>Sunday: 12PM - 5PM</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p>© 2025 Etsub Online Shopping – All rights reserved.</p>
            <p className="mt-2 text-gray-400">Ethiopian fashion curated with ❤️</p>
          </div>
        </div>
      </footer>
    </>
  );
}