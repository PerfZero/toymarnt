import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { HelmetProvider } from "react-helmet-async";

import Home from "./routes/home/Home";
import Footer from "./components/footer/Footer";
import SinglePage from "./routes/singlepage/SinglePage";
import NewCart from "./routes/cart/NewCart";
import { Header } from "./components/header/Header";
import Order from "./routes/orders/Order";
import OrderInfo from "./routes/orderInfo/OrderInfo";
import CategoryProducts from "./routes/categoryProducts/CategoryProducts";
import AuthTelegram from "./auth/Auth";
import { getToken } from "./api";
import { setUserInfo } from "./context/cartSlice";
import News from "./routes/categoryProducts/News";
import Search from "./routes/categoryProducts/Search";
import TypesProducts from "./routes/categoryProducts/TypesProducts";
import BySubcategories from "./routes/categoryProducts/BySubcategoriyes";
import { NotFound } from "./routes/NotFound/NotFound";
import BrandProducts from "./routes/categoryProducts/BrandProducts";

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isAuthReady, setIsAuthReady] = useState(false);

  const isAuthPage = location.pathname === "/auth";
  const user = localStorage.getItem("user");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready();
      tg.expand();
      document.body.classList.add("telegram-webapp");

      // Применяем safe area только если оно реально есть
      const topInset = tg.contentSafeAreaInset?.top;
      if (topInset && topInset > 0) {
        document.body.style.setProperty("--safe-top", `${topInset}px`);
      }
    }
  }, []);

  useEffect(() => {
    const protectedRoutes = ["/cart", "/orders", "/orderInfo"];

    const isProtectedRoute = protectedRoutes.some((route) =>
      location.pathname.startsWith(route),
    );

    const isTMA = !!window.Telegram?.WebApp?.initData;

    if (!user && isProtectedRoute && !isTMA) {
      window.location.href = "/auth";
      return;
    }

    (async () => {
      if ((user || isTMA) && isProtectedRoute) {
        const userData = await getToken();
        if (userData) {
          dispatch(setUserInfo(userData));
        }
      }
      setIsAuthReady(true);
    })();
  }, [location.pathname, dispatch, user]);

  return (
    <div className="app">
      <HelmetProvider>
        <Toaster />

        {!isAuthPage && <Header />}

        {isAuthReady ? (
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
        ) : (
          <div className="auth-loading" />
        )}

        {!isAuthPage && <Footer />}
      </HelmetProvider>
    </div>
  );
}

export default App;
