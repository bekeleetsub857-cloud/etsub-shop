import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Header from "../components/Header";

// Get products from localStorage or default empty array
const getLocalProducts = () => {
  const data = localStorage.getItem("products");
  return data ? JSON.parse(data) : [];
};

// Get USD rate with updated default
const getInitialUsdRate = () => {
  const savedRate = localStorage.getItem("usdRate");
  return savedRate ? parseFloat(savedRate) : 154;
};

// Fetch real-time exchange rate
const fetchRealTimeExchangeRate = async () => {
  try {
    // Try multiple APIs for reliability
    const apis = [
      'https://api.frankfurter.app/latest?from=USD&to=ETB',
      'https://api.exchangerate-api.com/v4/latest/USD',
      // Add fallback API if needed
    ];

    for (const apiUrl of apis) {
      try {
        const response = await fetch(apiUrl, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Handle different API response formats
          if (apiUrl.includes('frankfurter')) {
            return data.rates.ETB;
          } else if (apiUrl.includes('exchangerate-api')) {
            return data.rates.ETB || data.rates.ETB;
          }
        }
      } catch (apiError) {
        console.log(`API ${apiUrl} failed, trying next...`);
        continue;
      }
    }
    
    throw new Error('All APIs failed');
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return null;
  }
};

// Alternative: Use free-tier commercial API (requires signup)
const fetchExchangeRateWithBackup = async () => {
  // First try to get from localStorage cache
  const cached = localStorage.getItem('exchangeRateCache');
  if (cached) {
    const { rate, timestamp } = JSON.parse(cached);
    // Use cache if less than 1 hour old
    if (Date.now() - timestamp < 3600000) {
      return rate;
    }
  }

  // Fetch fresh rate
  const rate = await fetchRealTimeExchangeRate();
  
  if (rate) {
    // Cache the rate
    localStorage.setItem('exchangeRateCache', JSON.stringify({
      rate,
      timestamp: Date.now()
    }));
    return rate;
  }
  
  // Fallback to saved rate
  return getInitialUsdRate();
};

export default function AdminPage() {
  const [products, setProducts] = useState(getLocalProducts());
  const [editingId, setEditingId] = useState(null);
  const [usdRate, setUsdRate] = useState(getInitialUsdRate());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUsdModal, setShowUsdModal] = useState(false);
  const [newUsdRate, setNewUsdRate] = useState("");
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [rateSource, setRateSource] = useState("local");
  
  const [form, setForm] = useState({
    name: "",
    sheinPrice: "",
    birrPrice: 0,
    agentPrice: "",
    profit: "",
    finalPrice: 0,
    status: "onhand",
    images: [],
    videos: [],
    description: "",
    category: "",
    size: "",
    color: "",
  });

  // Load last updated time on mount
  useEffect(() => {
    const lastUpdate = localStorage.getItem('rateLastUpdated');
    if (lastUpdate) {
      setLastUpdated(new Date(parseInt(lastUpdate)).toLocaleString());
    }
  }, []);

  // Fetch real-time exchange rate on component mount
  const fetchCurrentRate = useCallback(async () => {
    setIsLoadingRate(true);
    try {
      const newRate = await fetchExchangeRateWithBackup();
      if (newRate && newRate !== usdRate) {
        setUsdRate(newRate);
        setRateSource("live");
        localStorage.setItem('rateLastUpdated', Date.now().toString());
        setLastUpdated(new Date().toLocaleString());
        
        // Auto-update all products with new rate
        const updatedProducts = products.map(p => ({
          ...p,
          birrPrice: Math.round((p.sheinPrice || 0) * newRate)
        }));
        setProducts(updatedProducts);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
    } finally {
      setIsLoadingRate(false);
    }
  }, [usdRate, products]);

  // Auto-fetch rate on mount and every hour
  useEffect(() => {
    fetchCurrentRate();
    
    // Set up interval for hourly updates
    const interval = setInterval(fetchCurrentRate, 3600000); // 1 hour
    
    return () => clearInterval(interval);
  }, [fetchCurrentRate]);

  // Save to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  // Save USD rate to localStorage
  useEffect(() => {
    localStorage.setItem("usdRate", usdRate.toString());
  }, [usdRate]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      form.images.forEach((url) => URL.revokeObjectURL(url));
      form.videos.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.images, form.videos]);

  // Auto-calculate birr price when sheinPrice or usdRate changes
  useEffect(() => {
    if (form.sheinPrice) {
      const birr = Math.round(parseFloat(form.sheinPrice) * usdRate);
      setForm(prev => ({
        ...prev,
        birrPrice: birr
      }));
    }
  }, [usdRate, form.sheinPrice]);

  // Handle manual refresh of exchange rate
  const handleRefreshRate = async () => {
    setIsLoadingRate(true);
    await fetchCurrentRate();
    setIsLoadingRate(false);
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "sheinPrice") {
      const usd = parseFloat(value) || 0;
      const birr = Math.round(usd * usdRate);
      setForm({
        ...form,
        sheinPrice: usd,
        birrPrice: birr,
        finalPrice: (parseFloat(form.agentPrice) || 0) + (parseFloat(form.profit) || 0),
      });
    } else if (name === "agentPrice") {
      const agent = parseFloat(value) || 0;
      setForm({
        ...form,
        agentPrice: agent,
        finalPrice: agent + (parseFloat(form.profit) || 0),
      });
    } else if (name === "profit") {
      const profit = parseFloat(value) || 0;
      setForm({
        ...form,
        profit: profit,
        finalPrice: (parseFloat(form.agentPrice) || 0) + profit,
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Multiple image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(
      files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      })
    ).then((base64Images) => {
      setForm({ ...form, images: [...form.images, ...base64Images] });
    });
  };

  // Remove image
  const removeImage = (index) => {
    const newImages = [...form.images];
    URL.revokeObjectURL(newImages[index]);
    newImages.splice(index, 1);
    setForm({ ...form, images: newImages });
  };

  // Video upload
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous video URL
      form.videos.forEach(url => URL.revokeObjectURL(url));
      
      const url = URL.createObjectURL(file);
      setForm({ ...form, videos: [url] });
    }
  };

  // Remove video
  const removeVideo = () => {
    form.videos.forEach(url => URL.revokeObjectURL(url));
    setForm({ ...form, videos: [] });
  };

  const handleAddProduct = () => {
    if (!form.name.trim()) {
      alert("Product Name is required");
      return;
    }

    const newProduct = {
      ...form,
      id: editingId || uuidv4(),
      birrPrice: form.birrPrice,
      finalPrice: form.finalPrice,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      // Update existing product
      setProducts(products.map(p => p.id === editingId ? newProduct : p));
      setEditingId(null);
    } else {
      // Add new product
      setProducts([...products, newProduct]);
    }

    // Reset form
    resetForm();
  };

  const resetForm = () => {
    // Clean up URLs before resetting
    form.images.forEach(url => URL.revokeObjectURL(url));
    form.videos.forEach(url => URL.revokeObjectURL(url));
    
    setForm({
      name: "",
      sheinPrice: "",
      birrPrice: 0,
      agentPrice: "",
      profit: "",
      finalPrice: 0,
      status: "onhand",
      images: [],
      videos: [],
      description: "",
      category: "",
      size: "",
      color: "",
    });
    setEditingId(null);
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      sheinPrice: product.sheinPrice,
      birrPrice: product.birrPrice,
      agentPrice: product.agentPrice,
      profit: product.profit,
      finalPrice: product.finalPrice,
      status: product.status,
      images: product.images,
      videos: product.videos,
      description: product.description || "",
      category: product.category || "",
      size: product.size || "",
      color: product.color || "",
    });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const productToDelete = products.find(p => p.id === id);
      
      // Revoke object URLs before deleting
      if (productToDelete) {
        productToDelete.images.forEach(url => URL.revokeObjectURL(url));
        productToDelete.videos.forEach(url => URL.revokeObjectURL(url));
      }
      
      setProducts(products.filter(p => p.id !== id));
      if (editingId === id) {
        resetForm();
      }
    }
  };

  const handleUpdateUsdRate = () => {
    const rate = parseFloat(newUsdRate);
    if (rate > 0) {
      setUsdRate(rate);
      setRateSource("manual");
      localStorage.setItem('rateLastUpdated', Date.now().toString());
      setLastUpdated(new Date().toLocaleString());
      setShowUsdModal(false);
      setNewUsdRate("");
      
      // Auto-update all products with new rate
      const updatedProducts = products.map(p => ({
        ...p,
        birrPrice: Math.round((p.sheinPrice || 0) * rate)
      }));
      setProducts(updatedProducts);
    } else {
      alert("Please enter a valid rate.");
    }
  };

  // Filter and sort products for the table
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Always sort by newest first for admin

  // Calculate statistics
  const totalValue = products.reduce((sum, p) => sum + p.finalPrice, 0);
  const onHandCount = products.filter(p => p.status === "onhand").length;
  const byOrderCount = products.filter(p => p.status === "byorder").length;
  const soldCount = products.filter(p => p.status === "sold").length;
  const onHandValue = products
    .filter(p => p.status === "onhand")
    .reduce((sum, p) => sum + p.finalPrice, 0);

  const statusBadge = (status) => {
    switch (status) {
      case "onhand":
        return <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700">On Hand</span>;
      case "byorder":
        return <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700">By Order</span>;
      case "sold":
        return <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-700">Sold</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-700 mb-2"> {/* Updated text-purple-700 to text-indigo-700 */}
            Admin Dashboard
          </h2>
          <p className="text-gray-600">Manage your Etsub Online Shopping products</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Value Card */}
          <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Total Inventory Value</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{totalValue.toLocaleString()} ETB</p>
          </div>
          {/* On Hand Count Card */}
          <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-500">On Hand Products</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{onHandCount.toLocaleString()}</p>
          </div>
          {/* By Order Count Card */}
          <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-500">By Order Products</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{byOrderCount.toLocaleString()}</p>
          </div>
          {/* On Hand Value Card */}
          <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-500">Value of On Hand Stock</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{onHandValue.toLocaleString()} ETB</p>
          </div>
        </div>

        {/* Exchange Rate Management */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-indigo-700">{usdRate.toFixed(2)}</span> {/* Updated text-purple-700 to text-indigo-700 */}
              <span className="text-gray-600">ETB per USD</span>
            </div>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-2"> 
                Last updated: {lastUpdated} {rateSource === "live" && " (Auto-fetched)"} 
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1"> Rates update automatically every hour </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0">
            <button 
              onClick={handleRefreshRate} 
              disabled={isLoadingRate} 
              className="px-4 py-3 bg-white text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition font-semibold flex items-center gap-2 disabled:opacity-50" // Updated colors
            >
              <svg className={`w-5 h-5 ${isLoadingRate ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoadingRate ? "Refreshing..." : "Refresh Rate"}
            </button>
            <button 
              onClick={() => setShowUsdModal(true)} 
              className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center gap-2 disabled:opacity-50" // Updated colors
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 16v-4m-6-2h12m-6 4h.01M5 12h.01M19 12h.01M6 16h.01" /></svg>
              Set Manually
            </button>
          </div>
        </div>

        {/* Add/Edit Product Form */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-indigo-700"> {/* Updated text-purple-700 to text-indigo-700 */}
                {editingId ? "Edit Product" : "Add New Product"}
              </h3>
              {editingId && ( 
                <p className="text-sm text-gray-500 mt-1">Editing product ID: {editingId}</p>
              )}
            </div>
            {editingId && (
              <button onClick={handleCancelEdit} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2" >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg> Cancel Edit 
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Product Name */}
            <div className="lg:col-span-2">
              <label className="block text-gray-700 mb-2 font-medium">Product Name *</label>
              <input type="text" name="name" placeholder="Enter product name" value={form.name} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            {/* Final Price (Calculated) */}
            <div className="lg:col-span-1 bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200"> {/* Updated colors */}
              <label className="block text-indigo-700 mb-1 font-bold">Final Price (ETB)</label> {/* Updated colors */}
              <p className="text-4xl font-extrabold text-indigo-800"> {/* Updated colors */}
                {form.finalPrice ? form.finalPrice.toLocaleString() : "0"} ETB
              </p>
            </div>
            
            {/* Pricing Details */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Shein Price (USD) *</label>
              <input type="number" name="sheinPrice" placeholder="e.g., 15.5" value={form.sheinPrice} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              <p className="text-sm text-gray-500 mt-1">Equivalent: {form.birrPrice} ETB (Calculated)</p>
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Agent Price (ETB)</label>
              <input type="number" name="agentPrice" placeholder="Shipping + Tax + Service" value={form.agentPrice} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Profit / Markup (ETB)</label>
              <input type="number" name="profit" placeholder="Your desired profit" value={form.profit} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            {/* Status */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                <option value="onhand">On Hand</option>
                <option value="byorder">By Order</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Category</label>
              <input type="text" name="category" placeholder="e.g., Dress, Top, Skirt" value={form.category} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            {/* Size */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Size</label>
              <input type="text" name="size" placeholder="e.g., S, M, L, XL" value={form.size} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            {/* Color */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Color</label>
              <input type="text" name="color" placeholder="e.g., Red, Black, White" value={form.color} onChange={handleChange} className="w-full p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            {/* Product Description */}
            <div className="lg:col-span-3">
              <label className="block text-gray-700 mb-2 font-medium">Product Description</label>
              <textarea 
                name="description" 
                placeholder="Describe your product..." 
                value={form.description} 
                onChange={handleChange} 
                rows="3" 
                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" // Updated color
              />
            </div>
          </div> 
          
          {/* Upload Images & Videos */}
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Product Images</label>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" /> {/* Updated color */}
              <div className="mt-4 flex flex-wrap gap-3">
                {form.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img src={image} alt={`Product ${index}`} className="w-20 h-20 object-cover rounded-lg border" />
                    <button onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Video Upload */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Product Video (Max 1)</label>
              <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={handleVideoUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" /> {/* Updated color */}
              <div className="mt-4 flex flex-wrap gap-3">
                {form.videos.map((video, index) => (
                  <div key={index} className="relative group">
                    <video src={video} controls className="w-40 h-20 object-cover rounded-lg border" />
                    <button onClick={removeVideo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Submit/Action Buttons */}
          <div className="mt-10 flex gap-4">
            <button 
              onClick={handleAddProduct}
              className="px-6 py-4 flex-1 font-bold text-white text-lg rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 transition transform hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-3" // Updated gradient
            >
              {editingId ? (
                <> <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> Update Product </>
              ) : (
                <> <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg> Add Product </>
              )}
            </button>
            {editingId && (
              <button onClick={resetForm} className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold" > 
                Reset Form 
              </button>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-1/3 p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full md:w-1/4 p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
              <option value="all">All Statuses</option>
              <option value="onhand">On Hand</option>
              <option value="byorder">By Order</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prices (USD/ETB/Agent/Profit)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Final Price (ETB)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-indigo-50 transition"> {/* Updated hover:bg-purple-50 to indigo */}
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        {p.images.length > 0 ? (
                          <img src={p.images[0]} alt={p.name} className="w-16 h-16 object-cover rounded-lg border" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-indigo-700">{p.name}</div> {/* Updated text-purple-700 to indigo */}
                          <div className="text-sm text-gray-500 line-clamp-2">{p.description}</div>
                          <div className="flex gap-2 mt-2">
                            {p.images.length > 0 && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded"> 📷 {p.images.length}</span>
                            )}
                            {p.videos.length > 0 && (
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded"> 📹 1</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      <p>Shein: ${p.sheinPrice || 0}</p>
                      <p>Birr Eq: {p.birrPrice?.toLocaleString() || 0} ETB</p>
                      <p>Agent: {p.agentPrice || 0} ETB</p>
                      <p>Profit: {p.profit || 0} ETB</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xl font-bold text-indigo-700"> {/* Updated text-purple-700 to indigo */}
                        {p.finalPrice?.toLocaleString()}
                      </span> ETB
                    </td>
                    <td className="p-4 text-center">
                      {statusBadge(p.status)}
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                      <button 
                        onClick={() => handleEdit(p)} 
                        className="text-indigo-600 hover:text-indigo-800 transition" // Updated color
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export/Delete Buttons */}
          <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(products, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const link = document.createElement('a');
                  link.setAttribute('href', dataUri);
                  link.setAttribute('download', 'etsub_products_backup.json');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Data
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete ALL products? This action cannot be undone.")) {
                    setProducts([]);
                    localStorage.removeItem("products");
                  }
                }}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All Products
              </button>
            </div>

            <div className="text-gray-500 text-sm">
              {filteredProducts.length} of {products.length} Products Shown
            </div>
          </div>
        </div>
      </div>

      {/* USD Rate Modal */}
      {showUsdModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 text-indigo-700">Set USD Exchange Rate Manually</h3> {/* Updated color */}
            <p className="mb-4 text-gray-600">Current Rate: {usdRate.toFixed(2)} ETB/USD</p>
            <input 
              type="number" 
              placeholder="Enter new rate (ETB)" 
              value={newUsdRate} 
              onChange={(e) => setNewUsdRate(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUsdModal(false)} className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100">Cancel</button>
              <button onClick={handleUpdateUsdRate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Update Rate</button> {/* Updated color */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}