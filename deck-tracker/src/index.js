import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";
import reportWebVitals from "./reportWebVitals.js";
import filterOptions from "./filterOptions.json";
import CardList from "./CardList.js";
import { Box } from "@mui/system";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App filterOptions={filterOptions} />
    <Box display="flex" justifyContent="center" minHeight="90vh" marginTop={'10%'}>
      <CardList cards={["Electrolyze", "Thoughtsieze", "Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze"]}/>
    </Box>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
