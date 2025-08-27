import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";


import Login from "./routes/login";
import Register from "./routes/register";
import User from "./routes/user";
import Maps from "./pages/maps"
import Profil from "./pages/Profil"
import Path from "./pages/path"
import Price from "./pages/price"
import ErrorPage from "./error";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/user",
    element: <User />,
  },
  {
    path: "/maps",
    element: <Maps />
  },
  {
    path: "/profil",
    element : <Profil />
  },
  {
    path: "/path",
    element : <Path />
  },
  {
    path: "/price",
    element : <Price />
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
