import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";



import { HelmetProvider } from "react-helmet-async";

// ponytail: deleted vercel analytics & speed insights (causes ERR_BLOCKED_BY_CLIENT, bloats FCP, YAGNI)

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);
