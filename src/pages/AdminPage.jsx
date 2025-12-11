import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

// Use environment variable for password in production
const getAdminPassword = () => {
  // In production, this should come from environment variables
  // For now, we'll use a fallback but it's visible in the code
  return process.env.REACT_APP_ADMIN_PASSWORD || "natan@2023";
};

const getLocalProducts = () => {
  const data = localStorage.getItem("products");
  return data ? JSON.parse(data) : [];
};

const getInitialUsdRate = () => {
  const savedRate = localStorage.getItem("usdRate");
  return savedRate ? parseFloat(savedRate) : 154;
};

const fetchRealTimeExchangeRate = async () => {
  try {
    const apis = [
      'https://api.frankfurter.app/latest?from=USD&to=ETB',
      'https://api.exchangerate-api.com/v4/latest/USD',
    ];

    for (const apiUrl of apis) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(apiUrl, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          if (apiUrl.includes('frankfurter')) {
            return data.rates.ETB;
          } else if (apiUrl.includes('exchangerate-api')) {
            return data.rates.ETB;
          }
        }
      } catch (error) {
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

const fetchExchangeRateWithBackup = async () => {
  const cached = localStorage.getItem('exchangeRateCache');
  if (cached) {
    const { rate, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 3600000) {
      return rate;
    }
  }

  const rate = await fetchRealTimeExchangeRate();
  
  if (rate) {
    localStorage.setItem('exchangeRateCache', JSON.stringify({
      rate,
      timestamp: Date.now()
    }));
    return rate;
  }
  
  return getInitialUsdRate();
};

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [usdRate, setUsdRate] = useState(154);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUsdModal, setShowUsdModal] = useState(false);
  const [newUsdRate, setNewUsdRate] = useState("");
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [rateSource, setRateSource] = useState("local");
  const navigate = useNavigate();

  const ADMIN_PASSWORD = getAdminPassword();

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

  // Check authentication on mount
  useEffect(() => {
    const authExpiry = localStorage.getItem("adminAuthExpiry");
    const isAuth = localStorage.getItem("adminAuthenticated");
    
    if (isAuth === "true" && authExpiry) {
      const expiryTime = parseInt(authExpiry);
      if (Date.now() < expiryTime) {
        setIsAuthenticated(true);
        setProducts(getLocalProducts());
        setUsdRate(getInitialUsdRate());
        
        const lastUpdate = localStorage.getItem('rateLastUpdated');
        if (lastUpdate) {
          setLastUpdated(new Date(parseInt(lastUpdate)).toLocaleString());
        }
      } else {
        // Session expired
        localStorage.removeItem("adminAuthenticated");
        localStorage.removeItem("adminAuthExpiry");
      }
    }
  }, []);

  // Check if user is locked out
  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        if (Date.now() > lockoutTime) {
          setLockoutTime(null);
          setLoginAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const fetchCurrentRate = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingRate(true);
    try {
      const newRate = await fetchExchangeRateWithBackup();
      if (newRate && newRate !== usdRate) {
        setUsdRate(newRate);
        setRateSource("live");
        localStorage.setItem('rateLastUpdated', Date.now().toString());
        setLastUpdated(new Date().toLocaleString());
        
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
  }, [usdRate, products, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentRate();
      const interval = setInterval(fetchCurrentRate, 3600000);
      return () => clearInterval(interval);
    }
  }, [fetchCurrentRate, isAuthenticated]);

  // Auto-logout after inactivity
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInactivity = () => {
      const expiry = localStorage.getItem("adminAuthExpiry");
      if (expiry && Date.now() > parseInt(expiry)) {
        handleLogout();
        alert("Session expired. Please login again.");
      }
    };

    const interval = setInterval(checkInactivity, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("products", JSON.stringify(products));
    }
  }, [products, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("usdRate", usdRate.toString());
    }
  }, [usdRate, isAuthenticated]);

  useEffect(() => {
    return () => {
      form.images.forEach((url) => URL.revokeObjectURL(url));
      form.videos.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.images, form.videos]);

  useEffect(() => {
    if (form.sheinPrice) {
      const birr = Math.round(parseFloat(form.sheinPrice) * usdRate);
      setForm(prev => ({
        ...prev,
        birrPrice: birr
      }));
    }
  }, [usdRate, form.sheinPrice]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    // Check lockout
    if (lockoutTime && Date.now() < lockoutTime) {
      const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
      setError(`Too many attempts. Please wait ${remaining} seconds.`);
      return;
    }

    // Check password
    if (password === ADMIN_PASSWORD) {
      // Successful login
      setIsAuthenticated(true);
      setLoginAttempts(0);
      
      // Set session with 1-hour expiry
      const expiryTime = Date.now() + (60 * 60 * 1000);
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("adminAuthExpiry", expiryTime.toString());
      
      // Load data
      setProducts(getLocalProducts());
      setUsdRate(getInitialUsdRate());
      
      const lastUpdate = localStorage.getItem('rateLastUpdated');
      if (lastUpdate) {
        setLastUpdated(new Date(parseInt(lastUpdate)).toLocaleString());
      }
    } else {
      // Failed attempt
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        // Lockout for 5 minutes
        const lockout = Date.now() + (5 * 60 * 1000);
        setLockoutTime(lockout);
        setError("Too many failed attempts. Account locked for 5 minutes.");
      } else {
        setError(`Invalid password. ${3 - newAttempts} attempts remaining.`);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminAuthExpiry");
    setPassword("");
    navigate("/");
  };

  const handleRefreshRate = async () => {
    setIsLoadingRate(true);
    await fetchCurrentRate();
    setIsLoadingRate(false);
  };

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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit
    
    if (validFiles.length !== files.length) {
      alert("Some files exceed 5MB limit and were skipped.");
    }

    Promise.all(
      validFiles.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      })
    ).then((base64Images) => {
      setForm({ ...form, images: [...form.images, ...base64Images].slice(0, 10) }); // Max 10 images
    });
  };

  const removeImage = (index) => {
    const newImages = [...form.images];
    URL.revokeObjectURL(newImages[index]);
    newImages.splice(index, 1);
    setForm({ ...form, images: newImages });
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        alert("Video file too large. Maximum size is 20MB.");
        return;
      }
      
      form.videos.forEach(url => URL.revokeObjectURL(url));
      const url = URL.createObjectURL(file);
      setForm({ ...form, videos: [url] });
    }
  };

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
      setProducts(products.map(p => p.id === editingId ? newProduct : p));
      setEditingId(null);
    } else {
      setProducts([...products, newProduct]);
    }

    resetForm();
  };

  const resetForm = () => {
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
      
      const updatedProducts = products.map(p => ({
        ...p,
        birrPrice: Math.round((p.sheinPrice || 0) * rate)
      }));
      setProducts(updatedProducts);
    } else {
      alert("Please enter a valid rate.");
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

  if (!isAuthenticated) {
    const remainingLockout = lockoutTime ? Math.ceil((lockoutTime - Date.now()) / 1000) : 0;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-600 mt-2">Enter password to access admin panel</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-50"
                placeholder="Enter password"
                required
                disabled={!!lockoutTime}
              />
            </div>
            
            {error && (
              <div className={`p-3 rounded-lg ${
                error.includes("locked") ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
              }`}>
                <p className="text-sm font-medium">{error}</p>
                {lockoutTime && (
                  <p className="text-xs mt-1">Locked until: {new Date(lockoutTime).toLocaleTimeString()}</p>
                )}
              </div>
            )}
            
            {lockoutTime ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                  <span className="text-red-600 font-bold">{remainingLockout}</span>
                </div>
                <p className="text-sm text-gray-600">
                  Too many failed attempts. Try again in {remainingLockout} seconds.
                </p>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Login
              </button>
            )}
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              ⚠️ For security: Session expires after 1 hour of inactivity
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Top Bar - SIMPLIFIED */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              Admin Panel
            </h2>
            <p className="text-gray-600 text-sm">Manage products and settings</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards - SIMPLIFIED */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Total Value</p>
            <p className="text-xl font-semibold text-gray-900">{totalValue.toLocaleString()} ETB</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">On Hand</p>
            <p className="text-xl font-semibold text-gray-900">{onHandCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">By Order</p>
            <p className="text-xl font-semibold text-gray-900">{byOrderCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">Sold</p>
            <p className="text-xl font-semibold text-gray-900">{soldCount}</p>
          </div>
        </div>

        {/* Exchange Rate Card - SIMPLIFIED */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">${usdRate.toFixed(2)}</span>
                <span className="text-gray-600">ETB per USD</span>
              </div>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Updated: {lastUpdated} 
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {rateSource === "live" ? "Auto" : "Manual"}
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefreshRate}
                disabled={isLoadingRate}
                className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${isLoadingRate ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => setShowUsdModal(true)}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
              >
                Set Rate
              </button>
            </div>
          </div>
        </div>

        {/* Product Form */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Product" : "Add New Product"}
            </h3>
            {editingId && (
              <button onClick={handleCancelEdit} className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                Cancel Edit
              </button>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input 
                type="text" 
                name="name" 
                placeholder="Enter product name" 
                value={form.name} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
                required 
              />
            </div>

            <div className="lg:col-span-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
              <p className="text-2xl font-bold text-gray-900">
                {form.finalPrice ? form.finalPrice.toLocaleString() : "0"} ETB
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shein Cost (USD) *</label>
              <input 
                type="number" 
                name="sheinPrice" 
                placeholder="e.g., 15.5" 
                value={form.sheinPrice} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
                step="0.01" 
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Converted: {form.birrPrice.toLocaleString()} ETB</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping & Tax (ETB)</label>
              <input 
                type="number" 
                name="agentPrice" 
                placeholder="Shipping + Tax" 
                value={form.agentPrice} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profit (ETB)</label>
              <input 
                type="number" 
                name="profit" 
                placeholder="Your profit" 
                value={form.profit} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                name="status" 
                value={form.status} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="onhand">On Hand</option>
                <option value="byorder">By Order</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input 
                type="text" 
                name="category" 
                placeholder="e.g., Dress, Top" 
                value={form.category} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input 
                type="text" 
                name="size" 
                placeholder="e.g., S, M, L" 
                value={form.size} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input 
                type="text" 
                name="color" 
                placeholder="e.g., Red, Black" 
                value={form.color} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                placeholder="Product description..."
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Media Upload */}
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images (Max 10)
              </label>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" 
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {form.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img src={image} alt={`Product ${index}`} className="w-16 h-16 object-cover rounded border" />
                    <button 
                      onClick={() => removeImage(index)} 
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Video (Max 1)
              </label>
              <input 
                type="file" 
                accept="video/mp4,video/webm" 
                onChange={handleVideoUpload} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" 
              />
              {form.videos.length > 0 && (
                <div className="mt-3">
                  <div className="relative">
                    <video src={form.videos[0]} controls className="w-full max-w-xs rounded border" />
                    <button 
                      onClick={removeVideo} 
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleAddProduct}
              className="px-5 py-3 flex-1 font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
            >
              {editingId ? "Update Product" : "Add Product"}
            </button>
            {editingId && (
              <button 
                onClick={resetForm} 
                className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Product List */}
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full md:w-1/3">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent" 
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="w-full md:w-1/4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="onhand">On Hand</option>
              <option value="byorder">By Order</option>
              <option value="sold">Sold</option>
            </select>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          {p.images.length > 0 ? (
                            <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded border" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{p.name}</div>
                            <div className="text-sm text-gray-500 mt-1 line-clamp-1">{p.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="space-y-1">
                          <div className="text-gray-900">Shein: ${p.sheinPrice || 0}</div>
                          <div className="text-gray-600">Shipping: {p.agentPrice || 0} ETB</div>
                          <div className="text-green-600">Profit: {p.profit || 0} ETB</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">{p.finalPrice?.toLocaleString()} ETB</div>
                      </td>
                      <td className="px-4 py-4">
                        {statusBadge(p.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(products, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const link = document.createElement('a');
                  link.setAttribute('href', dataUri);
                  link.setAttribute('download', `products_backup_${new Date().toISOString().split('T')[0]}.json`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                Backup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* USD Rate Modal */}
      {showUsdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Set USD Rate</h3>
            <p className="mb-4 text-gray-600">Current: {usdRate.toFixed(2)} ETB/USD</p>
            <input
              type="number"
              placeholder="Enter new rate"
              value={newUsdRate}
              onChange={(e) => setNewUsdRate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              step="0.01"
              min="0"
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowUsdModal(false)} 
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateUsdRate} 
                className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;