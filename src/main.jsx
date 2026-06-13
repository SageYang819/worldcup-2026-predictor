import React from "react";
import { createRoot } from "react-dom/client";
import WorldCupPredictor from "./WorldCupPredictor.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WorldCupPredictor />
  </React.StrictMode>
);
