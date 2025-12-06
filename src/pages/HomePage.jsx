import Header from "../components/Header";
import { useState, useEffect } from "react";
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Link } from "react-router-dom"; 

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  // Load products from localStorage
  useEffect(() => {
    const data = localStorage.getItem("products");
    if (data) {
      const loadedProducts = JSON.parse(data);
      setProducts(loadedProducts);
      setFilteredProducts(loadedProducts);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(loadedProducts
        .map(p => p.category)
        .filter(category => category && category.trim() !== "")
      )];
      setCategories(uniqueCategories);
    }
  }, []);

  // Filter products by category
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter(product => 
          product.category && 
          product.category.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }
  }, [selectedCategory, products]);
  
  // ✅ FIX: Using PUBLIC_URL for robust local image paths
  const heroImages = [
    process.env.PUBLIC_URL + "/images/fashion1.jpg", 
    process.env.PUBLIC_URL + "/images/fashion2.jpg", 
    process.env.PUBLIC_URL + "/images/fashion3.jpg", 
    process.env.PUBLIC_URL + "/images/fashion4.jpg"
  ];


  // Simple image gallery component for product cards
  const ProductImageGallery = ({ images, videos }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    if (!images || images.length === 0) {
      return (
        <div className="h-64 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500">No Image</span>
        </div>
      );
    }

    return (
      // ADDED: group class to enable group-hover utility on the image below
      <div className="relative h-64 overflow-hidden group"> 
        {/* ENHANCEMENT: Added zoom on hover effect */}
        <img 
          src={images[currentIndex]} 
          alt="Product" 
          // ADDED: transition-transform and group-hover:scale-110
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />
        
        {images.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1)); }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10 opacity-0 group-hover:opacity-100 transition"
            >
              ‹
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1)); }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10 opacity-0 group-hover:opacity-100 transition"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
        
        {videos && videos.length > 0 && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded z-10">
            📹 Video
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header />
      
      {/* Hero Section with Carousel */}
      <div className="relative h-[70vh] overflow-hidden">
        <Carousel 
          showThumbs={false} 
          autoPlay={true} 
          infiniteLoop={true} 
          interval={3000}
          showStatus={false}
          className="h-full"
        >
          {heroImages.map((img, index) => (
            <div key={index} className="h-[70vh]">
              <img 
                src={img} // Now uses PUBLIC_URL prefix
                alt={`Fashion ${index + 1}`} 
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                <div className="text-white ml-10 md:ml-20 max-w-xl">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4">
                    {index === 0 ? "Trendy Fashion" : 
                     index === 1 ? "Quality Styles" : 
                     "Affordable Prices"}
                  </h1>
                  <p className="text-lg md:text-xl mb-6">
                    {index === 0 ? "Discover the latest trends from Shein market" : 
                     index === 1 ? "Premium quality at unbeatable prices" : 
                     "Shop now and save big on fashionable items"}
                  </p>
                  <a 
                    href="#products" 
                    className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold text-lg transition-all transform hover:-translate-y-1"
                  >
                    Shop Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-700 mb-2">{products.length}</div>
              <div className="text-gray-600">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {products.filter(p => p.status === "onhand").length}
              </div>
              <div className="text-gray-600">On hand</div> {/* ETHIOPIAN TERM */}
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {products.filter(p => p.status === "byorder").length}
              </div>
              <div className="text-gray-600">By Order</div> {/* ETHIOPIAN TERM */}
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-600 mb-2">
                {products.filter(p => p.status === "sold").length}
              </div>
              <div className="text-gray-600">Sold</div> {/* ETHIOPIAN TERM */}
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <section id="products" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-purple-700 mb-4">
              Our Collection
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover our carefully curated selection of fashionable items from Shein market
            </p>
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-500 mb-2">No products found</h3>
              <p className="text-gray-400">
                {selectedCategory === "all" 
                  ? "No products available yet. Check back soon!" 
                  : `No products found in "${selectedCategory}" category`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  // ADDED: group class for the zoom effect to work
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200"
                >
                  {/* Product Image/Gallery */}
                  <ProductImageGallery images={product.images} videos={product.videos} />

                  {/* Product Info */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-800 truncate">{product.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.status === "onhand"
                          ? "bg-green-100 text-green-800"
                          : product.status === "byorder"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {/* UPDATED: Ethiopian Status Terms */}
                        {product.status === "onhand"
                          ? "🟢 On hand"
                          : product.status === "byorder"
                          ? "🔵 By Order"
                          : "🔴 Sold"}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-2 mb-4">
                      {product.category && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {product.category}
                        </div>
                      )}
                      {product.size && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Size: {product.size}
                        </div>
                      )}
                      {product.color && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          Color: {product.color}
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="text-2xl font-bold text-purple-700">
                        {product.finalPrice?.toLocaleString()} ETB
                      </div>
                      {/* Shein Price removed */}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <a
                        href={`https://wa.me/251992011629?text=Hi! I'm interested in ${encodeURIComponent(product.name)} (${product.finalPrice} ETB)`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-all hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        </svg>
                        WhatsApp
                      </a>
                      <a
                        href={`https://t.me/EtsubOnline?text=Hi! I'm interested in ${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all hover:shadow-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.06-.2-.07-.06-.17-.04-.24-.02-.1.02-1.74 1.11-4.92 3.26-.46.32-.88.48-1.25.47-.41-.01-1.21-.23-1.8-.42-.73-.24-1.31-.37-1.26-.78.03-.2.28-.4.77-.61 2.99-1.31 4.99-2.18 6-2.65 2.78-1.13 3.36-1.33 3.73-1.33.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                        </svg>
                        Telegram
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Start Shopping Today!
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join hundreds of satisfied customers. Contact us now to place your order.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/251992011629"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-white text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:-translate-y-1 hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
              Chat on WhatsApp
            </a>
            <a
              href="https://t.me/EtsubOnline"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:-translate-y-1 hover:shadow-xl"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.06-.2-.07-.06-.17-.04-.24-.02-.1.02-1.74 1.11-4.92 3.26-.46.32-.88.48-1.25.47-.41-.01-1.21-.23-1.8-.42-.73-.24-1.31-.37-1.26-.78.03-.2.28-.4.77-.61 2.99-1.31 4.99-2.18 6-2.65 2.78-1.13 3.36-1.33 3.73-1.33.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              Join Telegram
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-purple-300 mb-4">Etsub Online Shopping</h3>
              <p className="text-gray-400">
                Bringing you the latest fashion trends from Shein market at affordable prices.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#products" className="text-gray-400 hover:text-purple-300 transition">Products</a></li>
                <li><a href="https://wa.me/251992011629" className="text-gray-400 hover:text-purple-300 transition">Contact Us</a></li>
                {/* FIXED: Using Link component for client-side routing */}
                <li><Link to="/admin" className="text-gray-400 hover:text-purple-300 transition">Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4">Contact Info</h4>
              <div className="space-y-3">
                <div className="flex items-center text-gray-400">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +251 992 011 629
                </div>
                <div className="flex items-center text-gray-400">
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  Available on WhatsApp & Telegram
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© 2025 Etsub Online Shopping. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}