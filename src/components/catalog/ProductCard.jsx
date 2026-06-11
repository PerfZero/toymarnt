import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMinus, FiPlus } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { decrementQuantity, incrementQuantity } from "../../context/cartSlice";
import formatNumber from "../../utils/numberFormat";
import noImg from "../../img/no_img.png";

export const getStock = (product) =>
  Number(product?.inStock ?? product?.in_stock_count ?? 0);

export const getModelId = (product) =>
  product?.modelID ?? product?.model_id ?? product?.modelId ?? "";

export const getArticle = (product) => String(product?.article || "");

export const getSize = (product) => {
  const directSize =
    product?.size ??
    product?.productSize ??
    product?.sizeName ??
    product?.shoeSize ??
    product?.clothesSize;

  if (directSize !== undefined && directSize !== null && directSize !== "") {
    return String(directSize);
  }

  const article = getArticle(product);

  if (article.includes("_")) {
    return article.split("_").pop();
  }

  const match = article.match(/(\d{2,3}(?:\.\d+)?)$/);

  return match?.[1] ?? "";
};

export const getArticleWithoutSize = (product) => {
  const article = getArticle(product);

  if (!article) return "";

  if (article.includes("_")) {
    return article.split("_").slice(0, -1).join("_");
  }

  const size = getSize(product);

  if (size && article.endsWith(size)) {
    return article.slice(0, -size.length).replace(/[-_\s]+$/, "");
  }

  return article;
};

export const getGroupKey = (product) => {
  const modelId = getModelId(product);
  const articleWithoutSize = getArticleWithoutSize(product);

  if (modelId && articleWithoutSize) return `${modelId}-${articleWithoutSize}`;
  if (modelId) return modelId;
  if (articleWithoutSize) return articleWithoutSize;

  return String(product?.id);
};

export const getRetailPrice = (product) =>
  Number(product?.retail_price ?? product?.price ?? 0);

export const getMarketingPrice = (product) =>
  Number(product?.marketing_price ?? 0);

export const getQuantitySteps = (product) =>
  Number(
    product?.recommended_order_quantity ??
      product?.quantitySteps ??
      product?.min_quantity ??
      product?.minQuantity ??
      0
  );

export const isRshzEnabled = (product) => {
  return Boolean(product.primary_price != "retail" ?? false);
};

export const getPrice = (product) => {
  const retailPrice = getRetailPrice(product);
  const marketingPrice = getMarketingPrice(product);

  if (isRshzEnabled(product)) {
    return marketingPrice || retailPrice;
  }

  return retailPrice;
};

export const getProductTypeId = (product) =>
  product?.productTypeID ?? product?.type_id ?? product?.typeId ?? product?.id;

export const getAvailabilityId = (product) => {
  if (product?.accessabilitySettingsID) {
    return Number(product.accessabilitySettingsID);
  }

  if (product?.availability === "needs_preorder") return 223;
  if (product?.availability === "always_available") return 224;

  return 222;
};

export const getPrepayPercent = (product) =>
  product?.prepayPercent ??
  product?.prepay_amount ??
  product?.prepay_percent ??
  0;

export const getIsNew = (product) =>
  product?.isNew === 1 || product?.is_new === true;

export const canBuyProduct = (product) => {
  const availabilityId = getAvailabilityId(product);

  if (availabilityId === 222) return getStock(product) > 0;
  if (availabilityId === 223) return true;
  if (availabilityId === 224) return true;

  return getStock(product) > 0;
};

export const canShowGroup = (products = []) =>
  products.some((product) => getPrice(product));

function ProductCard({ products = [] }) {
  const nav = useNavigate();
  const dispatch = useDispatch();
  const cartData = useSelector((state) => state.cart.items);

  const variants = useMemo(() => {
    const uniqueById = new Map();

    products.forEach((product) => {
      uniqueById.set(product.id, product);
    });

    return Array.from(uniqueById.values()).sort((a, b) => {
      const sizeA = Number(getSize(a));
      const sizeB = Number(getSize(b));

      if (Number.isNaN(sizeA) || Number.isNaN(sizeB)) {
        return String(getSize(a)).localeCompare(String(getSize(b)));
      }

      return sizeA - sizeB;
    });
  }, [products]);

  const cartVariant = useMemo(
    () =>
      variants.find((product) =>
        cartData.some((item) => item.id === product.id)
      ),
    [variants, cartData]
  );

  const firstAvailableVariant = useMemo(
    () => variants.find(canBuyProduct) || variants[0],
    [variants]
  );

  const [selectedProductId, setSelectedProductId] = useState(null);

  useEffect(() => {
    if (cartVariant) {
      setSelectedProductId(cartVariant.id);
      return;
    }

    if (!selectedProductId && firstAvailableVariant?.id) {
      setSelectedProductId(firstAvailableVariant.id);
      return;
    }

    if (
      selectedProductId &&
      !variants.some((product) => product.id === selectedProductId)
    ) {
      setSelectedProductId(firstAvailableVariant?.id ?? null);
    }
  }, [cartVariant, firstAvailableVariant, selectedProductId, variants]);

  const product =
    variants.find((variant) => variant.id === selectedProductId) ??
    firstAvailableVariant;

  if (!product) return null;

  const inCart = cartData.find((item) => item.id === product.id);
  const displayQuantity = inCart?.quantity ?? 0;

  const retailPrice = getRetailPrice(product);
  const marketingPrice = getMarketingPrice(product);
  const quantitySteps = getQuantitySteps(product);
  const rshzEnabled = isRshzEnabled(product);

  const finalPrice = getPrice(product);
  const stock = getStock(product);
  const canBuySelectedProduct = canBuyProduct(product);

  if (!finalPrice) return null;

  const imageSrc = product?.id
    ? `https://api.toymarket.site/assets/products/${product.id}/image`
    : noImg;

  const handleIncrement = () => {
    if (!canBuySelectedProduct) return;

    dispatch(
      incrementQuantity({
        productId: product.id,
        inBox: product.inBox,
        inPackage: product.inPackage,
        inStock: stock,
        inTheBox: product.inTheBox,
      })
    );
  };

  const handleDecrement = () => {
    dispatch(
      decrementQuantity({
        productId: product.id,
        inBox: product.inBox,
        inPackage: product.inPackage,
        inTheBox: product.inTheBox,
      })
    );
  };

  if (!canShowGroup(variants)) return null;
  if (variants.length > 1 && !variants.some(canBuyProduct)) return null;

  return (
    <div className="catalogItem_card">
      <Link className="product-img-link" to={`/item/${getModelId(product)}`}>
        {rshzEnabled &&
        marketingPrice &&
        retailPrice &&
        marketingPrice < retailPrice ? (
          <div className="mark_discount">
            -{Math.round(((retailPrice - marketingPrice) / retailPrice) * 100)}%
          </div>
        ) : null}

        <img
          src={imageSrc}
          alt={product.article || product.name}
          onError={(e) => {
            e.currentTarget.src = noImg;
          }}
          className="product-image"
        />

        {getIsNew(product) ? (
          <div className="mark_new_product">
            <span>Новинка</span>
          </div>
        ) : null}
      </Link>

      <p className="name">{product.name}</p>

      <div className="product-sizes">
        {variants.length > 1 &&
          variants.map((variant) => {
            const size = getSize(variant);
            const variantInCart = cartData.some(
              (item) => item.id === variant.id
            );
            const isSelected = variant.id === product.id;
            const isDisabled = !canBuyProduct(variant);

            if (!size) return null;

            return (
              <button
                key={variant.id}
                type="button"
                className={[
                  "product-size",
                  isSelected ? "active" : "",
                  variantInCart ? "in-cart" : "",
                  isDisabled ? "disabled" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedProductId(variant.id)}
              >
                {size}
              </button>
            );
          })}
      </div>

      <div>
        {stock > 0 ? <p className="weight">Осталось: {stock} шт</p> : null}

        {rshzEnabled && quantitySteps && retailPrice ? (
          <p className="weight">
            от {quantitySteps} шт по {formatNumber(retailPrice)} ₽
          </p>
        ) : null}
      </div>

      {canBuySelectedProduct ? (
        inCart ? (
          <div className="add catalog_counter">
            <FiMinus onClick={handleDecrement} />
            <p className="amount">{displayQuantity}</p>
            <FiPlus onClick={handleIncrement} />
          </div>
        ) : (
          <div
            className="price"
            onClick={() => nav(`/item/${getModelId(product)}`)}
          >
            {formatNumber(finalPrice)} ₽
          </div>
        )
      ) : (
        <div className="price notInStock">Нет в наличии</div>
      )}
    </div>
  );
}

export default ProductCard;
