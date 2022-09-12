import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";
import reportWebVitals from "./reportWebVitals.js";
import filterOptions from "./filterOptions.json";
import CardList from "./CardList.js";
import { Box } from "@mui/system";
import PrimarySearchAppBar from "./navBar.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

let cards = ["Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze","Thoughtsieze"];

root.render(
  <React.StrictMode>
    <PrimarySearchAppBar />
    <App filterOptions={filterOptions} />
    <Box display="flex" justifyContent="center" minHeight="90vh" marginTop={'10%'} marginBottom={'10%'}>
      <CardList cards={cards}/>
    </Box>
  </React.StrictMode>
);




// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
