// Packages
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Amplify } from "aws-amplify";
//import { Provider } from 'react-redux';

// Local
import App from "./App";
//import { store } from './redux/store';
import config from "./Development/config";
import { ContextProvider } from "./Development/Context/ContextProvider";
import { InstitutionContextProvider } from "./Development/Context/InstitutionContextProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Flowbite } from "flowbite-react";
import customTheme from "./Development/common/Flowbite/customTheme";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

// Code
Amplify.configure(config);
console.log("Welcome")
const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    {/*<Provider store={store}>*/}
    <ContextProvider>
      <InstitutionContextProvider>
        <Flowbite theme={{ theme: customTheme }}>
          <App />
          <ToastContainer
            position="top-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            bodyClassName="toastBody"
          />
        </Flowbite>
      </InstitutionContextProvider>
    </ContextProvider>
    {/*</Provider>*/}
  </BrowserRouter>
);
