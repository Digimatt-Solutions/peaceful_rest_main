import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Helmet, HelmetProvider } from "react-helmet-async";

const root = document.getElementById("root");
if (root) createRoot(root).render(
  <HelmetProvider>
    <Helmet>
      <title>Makiwa</title>
      <meta name="description" content="Helping Families Honor & Remember" />
      <meta property="og:title" content="Makiwa" />
      <meta property="og:description" content="Helping Families Honor & Remember" />
      <meta property="og:site_name" content="Makiwa" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Makiwa" />
      <meta name="twitter:description" content="Helping Families Honor & Remember" />
    </Helmet>
    <App />
  </HelmetProvider>,
);
