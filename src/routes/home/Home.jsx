import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Banner from "../../components/banner/Banner";
import Catalog from "../../components/catalog/Catalog";
import formatNumber from "../../utils/numberFormat";

import "./home.css";

function Home() {
  const [totalPrice, setTotalPrice] = useState(0);
  const cart = useSelector((state) => state.cart.items);

  const getDisplayQuantity = (product) => {
    if (!product) return 0;
    return Number(product.quantity);
  };

  const getRetailPrice = (product) =>
    Number(product?.retail_price ?? product?.discountedPrice ?? 0);

  const getMarketingPrice = (product) =>
    Number(product?.marketing_price ?? product?.price ?? 0);

  const getCurrentPrice = (product) => {
    const displayQuantity = getDisplayQuantity(product);

    if (
      (displayQuantity >= Number(product?.recomendedMinimalSize ?? product?.recommended_order_quantity ?? Infinity) &&
        getRetailPrice(product)) ||
      product?.recomendedMinimalSizeEnabled === false ||
      Number(product?.recomendedMinimalSize ?? product?.recommended_order_quantity ?? 1) <= 1
    ) {
      return getRetailPrice(product);
    }
    return getMarketingPrice(product);
  };

  useEffect(() => {
    const totalPrice = cart?.reduce((acc, product) => {
      const displayQuantity = getDisplayQuantity(product);
      const availabilityId = Number(
        product?.accessabilitySettingsID ??
          (product?.availability === "needs_preorder" ? 223
          : product?.availability === "always_available" ? 224
          : 222)
      );
      const currentPrice =
        availabilityId === 223
          ? Number(product?.prepayAmount ?? product?.prepay_amount ?? 0)
          : getCurrentPrice(product);

      acc += displayQuantity * currentPrice;
      return acc;
    }, 0);
    setTotalPrice(parseInt(totalPrice));
  }, [cart]);

  return (
    <div className="home">
      <Banner />
      <Catalog />
      {totalPrice > 0 && (
        <div className="go-to-order-wrap ">
          В корзине товаров на {formatNumber(totalPrice)} ₽
        </div>
      )}
    </div>
  );
}

export default Home;
