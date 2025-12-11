import { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Header from "../components/Header";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [isCarouselLoading, setIsCarouselLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroImages = [
    { url: `${process.env.PUBLIC_URL}/images/fashion1.jpg` },
    { url: `${process.env.PUBLIC_URL}/images/fashion2.jpg` },
    { url: `${process.env.PUBLIC_URL}/images/fashion3.jpg` },
    { url: `${process.env.PUBLIC_URL}/images/fashion4.jpg` },
    { url: `${process.env.PUBLIC_URL}/images/fashion5.jpg` },
    { url: `${process.env.PUBLIC_URL}/images/fashion6.jpg` },
    { url: `${process.env.PUBLIC_URL}/images/fashion7.jpg` },
    { url: `${process.env.PUBLIC_URL}/images/fashion8.jpg` },
    { url: `${process.env.PUBLIC_URL}/images/fashion9.jpg` },
    { url: `${process.env.PUBLIC_URL}/images/fashion10.jpg` },
  ];

  // Load Products
  useEffect(() => {
    const data = localStorage.getItem("products");
    if (data) {
      const loaded = JSON.parse(data);
      setProducts(loaded);
      setFilteredProducts(loaded);

      const uniqueCategories = [
        ...new Set(
          loaded
            .map((p) => p.category)
            .filter((x) => x && x.trim() !== "")
        ),
      ];
      setCategories(uniqueCategories);
    }
    setIsCarouselLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCategory === "all") setFilteredProducts(products);
    else
      setFilteredProducts(
        products.filter(
          (p) =>
            p.category &&
            p.category.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
  }, [selectedCategory, products]);

  const ProductImage = ({ images, productName }) => {
    if (!images || images.length === 0)
      return (
        <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      );

    return (
      <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 relative">
        <img
          src={images[0]}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-500"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Header />

      {/* HERO CAROUSEL */}
      <section className="relative h-screen w-full overflow-hidden">
        {isCarouselLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <Carousel
              showThumbs={false}
              autoPlay
              infiniteLoop
              interval={4000}
              transitionTime={900}
              showStatus={false}
              showArrows={false}
              swipeable
              emulateTouch
              showIndicators={true}
              dynamicHeight={false}
              stopOnHover={false}
              useKeyboardArrows={true}
              onChange={setCurrentSlide}
              selectedItem={currentSlide}
              className="h-full"
            >
              {heroImages.map((img, index) => (
                <div key={index} className="relative h-screen bg-black">

                  {/* BACKGROUND IMAGE (darkened) */}
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${img.url})`,
                      opacity: 0.15,
                    }}
                  ></div>

                  {/* FOREGROUND IMAGE (clear contain + shadow) */}
                  <div className="hidden md:flex absolute inset-0 items-center justify-center">
                    <div
                      className="
                        w-[70%] h-[80%] bg-contain bg-center bg-no-repeat
                        opacity-95 
                        shadow-[0_0_70px_rgba(0,0,0,0.9)]
                        rounded-xl
                      "
                      style={{ backgroundImage: `url(${img.url})` }}
                    ></div>
                  </div>

                  {/* MOBILE ONLY (full cover) */}
                  <div className="md:hidden absolute inset-0">
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </Carousel>

            {/* Slide Counter */}
            <div className="absolute bottom-12 right-6 z-20">
              <div className="text-white/80 text-xs font-mono bg-black/40 px-2 py-1 rounded">
                {currentSlide + 1}/{heroImages.length}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* PRODUCTS */}
      <section id="products" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-light">Our Products</h2>
            <p className="text-gray-500 mt-2">Browse and order our available fashion items</p>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-8 py-3 text-sm rounded-full border ${
                  selectedCategory === "all"
                    ? "bg-black text-white"
                    : "bg-white border-gray-300 hover:bg-gray-100"
                }`}
              >
                All Products
              </button>

              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-8 py-3 text-sm rounded-full border ${
                    selectedCategory === category
                      ? "bg-black text-white"
                      : "bg-white border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No products available
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-xl transition-all"
                >
                  <ProductImage images={product.images} productName={product.name} />
                  <div className="pt-4">
                    <h3 className="font-medium text-lg">{product.name}</h3>
                    {product.category && <p className="text-sm text-gray-500">{product.category}</p>}
                    {product.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xl font-semibold">
                        {product.finalPrice?.toLocaleString()} ETB
                      </span>

                      <a
                        href={`https://wa.me/251992011629?text=${encodeURIComponent(
                          `Hello! I'm interested in "${product.name}" (${product.finalPrice} ETB)`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800"
                      >
                        Order
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-white py-10 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Etsub Fashion — All Rights Reserved
      </footer>
    </div>
  );
}
