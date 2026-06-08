import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./routes/home/Home";
import Footer from "./components/footer/Footer";
import SinglePage from "./routes/singlepage/SinglePage";
import NewCart from "./routes/cart/NewCart";
import { Header } from "./components/header/Header";
import Order from "./routes/orders/Order";
import OrderInfo from "./routes/orderInfo/OrderInfo";
import CategoryProducts from "./routes/categoryProducts/CategoryProducts";
import AuthTelegram from "./auth/Auth";
import { useDispatch } from "react-redux";
import { getToken, getUser } from "./api";
import { setUserInfo } from "./context/cartSlice";
import News from "./routes/categoryProducts/News";
import Search from "./routes/categoryProducts/Search";
import TypesProducts from "./routes/categoryProducts/TypesProducts";
import BySubcategories from "./routes/categoryProducts/BySubcategoriyes";
import { useLocation } from "react-router-dom";
import { NotFound } from "./routes/NotFound/NotFound";
import BrandProducts from "./routes/categoryProducts/BrandProducts";
import { HelmetProvider } from "react-helmet-async";

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const isAuthPage = location.pathname === "/auth";
  const user = localStorage.getItem("user");

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("user") && !isAuthPage) {
      // window.location.href = "/auth";
    }

    if (user) {
      const fetchData = async () => {
        const userData = await getToken();
        if (userData) {
          dispatch(setUserInfo(userData));
        }
      };
      fetchData();
    }
  }, [isAuthPage]);

  return (
    <div className="app">
      <HelmetProvider>
        <Toaster />

        {!isAuthPage && <Header />}
        {/* <Header /> */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/item/:id" element={<SinglePage />} />
          <Route path="/cart" element={<NewCart />} />
          <Route path="/orders" element={<Order />} />
          <Route path="/orderInfo/:id" element={<OrderInfo />} />
          <Route path="/cat/:id" element={<CategoryProducts />} />
          <Route path="/type/:id" element={<TypesProducts />} />
          <Route path="/subcat/:id" element={<BySubcategories />} />
          <Route path="/brand/:id" element={<BrandProducts />} />

          <Route path="/search" element={<Search />} />
          <Route path="/new" element={<News />} />
          <Route path="/auth" element={<AuthTelegram />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {!isAuthPage && <Footer />}
        {/* <Footer /> */}
      </HelmetProvider>
    </div>
  );
}

export default App;
