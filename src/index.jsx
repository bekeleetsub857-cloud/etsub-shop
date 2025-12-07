import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { HashRouter } from "react-router-dom";  // ← Changed to HashRouter
import { ProductProvider } from "./context/ProductContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ProductProvider>
      <HashRouter>  {/* ← No basename needed */}
        <App />
      </HashRouter>
    </ProductProvider>
  </React.StrictMode>
);
