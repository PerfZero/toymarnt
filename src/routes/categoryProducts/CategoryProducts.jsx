import React, { useState, useEffect } from "react";
import "./CategoryProducts.css";
import { useLazyGetProductsByCategoryNameWithLimitQuery } from "../../context/service/productsApi";
import filterIcon from "../../img/filter.svg";
import sortIcon from "../../img/sort.svg";
import { useDispatch, useSelector } from "react-redux";
import { decrementQuantity, incrementQuantity } from "../../context/cartSlice";
import { FiPlus, FiMinus } from "react-icons/fi";
import formatNumber from "../../utils/numberFormat";
import { useNavigate, Link, useParams } from "react-router-dom";
import FilterModal from "./FilterModal";
import { BsChevronLeft } from "react-icons/bs";
import SortModal from "./SortModal";
import noImg from "../../img/no_img.png";
import { useGoBackOrHome } from "../../utils/goBackOrHome";
import loader from "../../components/catalog/loader1.svg";
import { BiPlus } from "react-icons/bi";
import { getModelId } from "../../components/catalog/ProductCard";

function CategoryProducts() {
  const dispatch = useDispatch();
  const { id } = useParams();
  const nav = useNavigate();

  const [triggerGetProducts, { isLoading }] =
    useLazyGetProductsByCategoryNameWithLimitQuery();

  const searchQuery = useSelector((state) => state.search.searchQuery);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusAccordionOpen, setStatusAccordionOpen] = useState(false);
  const [statusPriceOpen, setStatusPriceOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState({
    status: "all",
    priceFrom: "",
    priceTo: "",
    article: "",
  });
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState("");
  const cartData = useSelector((state) => state.cart.items);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalData, setTotalData] = useState([]);
  const [buttonLoading, setButtonLoading] = useState(false);

  const fetchMoreData = () => {
    if (hasMore) {
      setButtonLoading(true);
      setOffset(offset + 100);
    } else {
      setHasMore(false);
    }
  };

  // 1. offset ni boshlang‘ich holatga o‘rnatish (id o‘zgarganda)
  useEffect(() => {
    setOffset(0); // offset 0 bo‘lsa 20 qilamiz
    setTotalData([]); // yangi kategoriya tanlanganda eski ma'lumotlarni tozalaymiz
  }, [id]);

  // 2. Ma'lumotlarni olib kelish
  useEffect(() => {
    const fetchProducts = async () => {
      const { data: products1 } = await triggerGetProducts({
        id: id,
        limit: 100,
        offset,
      });

      let seen = new Set();
      let products = [];

      products1?.data?.forEach((product) => {
        // Unikal aniqlash uchun _id va id ni olib tashlaymiz
        const { _id, id, ...rest } = product;
        const key = JSON.stringify(rest);

        if (!seen.has(key)) {
          seen.add(key);

          if (
            !products.some(
              (u) => u.modelID == product.modelID && u.color == product.color
            ) ||
            product.isMultiProduct == false
          ) {
            products.push(product);
          }

          // if (product.categoryID === 3) {
          //   const cat3Key = `${product.color}-${product.size}`;
          //   if (!seenCat3.has(cat3Key)) {
          //     seenCat3.add(cat3Key);
          //     products.push(product);
          //   }
          // } else {
          //   products.push(product);
          // }
        }
      });

      const updatedTotalData = [...totalData, ...products];

      setTotalData(updatedTotalData);
      setProducts(updatedTotalData);
      setFilteredProducts(updatedTotalData);
      setButtonLoading(false);

      if (products1.data.length < 100) {
        setHasMore(false);
      }
    };

    fetchProducts();
  }, [offset, id, totalData, triggerGetProducts]);

  useEffect(() => {
    let result = [...products];

    // Apply status filter
    if (pendingFilters.status === "inStock") {
      result = result.filter((product) => product.inStock > 0);
    } else if (pendingFilters.status === "outOfStock") {
      result = result.filter((product) => product.inStock === 0);
    }

    // Apply price range filter
    if (pendingFilters.priceFrom) {
      result = result.filter(
        (product) => +product.price >= +pendingFilters.priceFrom
      );
    }
    if (pendingFilters.priceTo) {
      result = result.filter(
        (product) => +product.price <= +pendingFilters.priceTo
      );
    }

    // Apply article filter
    if (pendingFilters.article) {
      result = result.filter((product) =>
        product.article
          .toLowerCase()
          .includes(pendingFilters.article.toLowerCase())
      );
    }

    // Apply search query filter
    if (searchQuery) {
      result = result.filter((product) =>
        product.article.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(result);
  }, [products, pendingFilters, searchQuery]);

  const getDisplayQuantity = (inCart, product) => {
    if (!inCart || !product) return 0;

    // const boxQuantity = Number(inCart.quantity) * Number(product.inBox);
    // const packageSize = Number(product.inPackage);
    // return packageSize && boxQuantity % packageSize !== 0
    //   ? Math.ceil(boxQuantity)
    //   : Math.floor(boxQuantity);

    return inCart.quantity;
  };

  const handleIncrement = (product) => {
    dispatch(
      incrementQuantity({
        productId: product.id,
        inBox: product.inBox,
        inPackage: product.inPackage,
        inStock: product.inStock,
        inTheBox: product.inTheBox,
      })
    );
  };

  const handleDecrement = (product) => {
    dispatch(
      decrementQuantity({
        productId: product.id,
        inBox: product.inBox,
        inPackage: product.inPackage,
        inTheBox: product.inTheBox,
      })
    );
  };
  const handleSearchChange = (e) =>
    setFilteredProducts(
      filteredProducts.filter((product) =>
        product.name.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );

  const back = useGoBackOrHome();

  if (isLoading)
    return (
      <div className="loader">
        <img width={100} src={loader} alt="" />
      </div>
    );

  return (
    <div className="container categoryProducts">
      <div className="categoryProducts_title">
        <div onClick={back} className="left">
          <BsChevronLeft />
          <span>{filteredProducts[0]?.categoryName}</span>
        </div>
        <input
          onChange={handleSearchChange}
          className="search_input"
          type="text"
          placeholder="Поиск...."
        />
        <div className="right">
          <div className="form-filter">
            <button onClick={() => setIsFilterOpen(true)}>
              <img src={filterIcon} alt="filter icon" />
              <span style={{ color: "#363636" }}>Фильтры</span>
            </button>
          </div>
          <div className="form-sort">
            <button onClick={() => setIsSortOpen(true)}>
              <img src={sortIcon} alt="sort icon" />
              <span style={{ color: "#363636" }}>Сортировка</span>
            </button>
          </div>
        </div>
      </div>
      <div className="catalogItem_cards">
        {filteredProducts?.map((product, inx) => {
          const inCart = cartData.find((item) => item.id === product.id);
          const displayQuantity = getDisplayQuantity(inCart, product);

          return (product?.price != 0 || product?.discountedPrice != 0) &&
            [222, 223, 224].includes(product.accessabilitySettingsID) ? (
            <div key={product.id} className="catalogItem_card">
              <Link
                className="product-img-link"
                to={`/item/${getModelId(product)}`}
              >
                {+product?.discountedPrice !== +product?.price &&
                +product?.price &&
                +product?.discountedPrice ? (
                  <div className="mark_discount">
                    -
                    {Math.round(
                      ((+product.price - +product.discountedPrice) /
                        +product.price) *
                        100
                    )}
                    %
                  </div>
                ) : null}
                <img
                  src={`https://api.toymarket.site/assets/products/${product.id}/image`}
                  alt={product.article}
                  // className="picture"
                  className={`product-image`}
                  onError={(e) => {
                    e.currentTarget.src = noImg;
                  }}
                />
                {product.isNew === 1 ? (
                  <div className="mark_new_product">
                    <span>Новинка</span>
                  </div>
                ) : null}
              </Link>
              <p className="name">{product.name}</p>
              {product?.accessabilitySettingsID == 222 ? (
                product?.inStock > 0 ? (
                  <p className="weight">Осталось: {product.inStock} шт</p>
                ) : (
                  ""
                )
              ) : product?.accessabilitySettingsID == 223 ? (
                product?.storeDeliveryInDays != "" &&
                product?.prepayPercent != "" ? (
                  <>
                    <p className="weight">
                      Под заказ: {product?.storeDeliveryInDays} дн.
                    </p>

                    <p className="weight">
                      Предоплата: {product?.prepayPercent} %
                    </p>
                  </>
                ) : (
                  <p className="weight">Осталось: {product.inStock} шт</p>
                )
              ) : product?.accessabilitySettingsID == 224 ? (
                <p className="weight">Всегда в наличии</p>
              ) : (
                ""
              )}

              {product?.discountedPrice != 0 &&
                product?.price != 0 &&
                product?.recomendedMinimalSizeEnabled === 1 &&
                product?.recomendedMinimalSize > 1 && (
                  <p className="weight">
                    от {product?.recomendedMinimalSize} шт по{" "}
                    {product?.discountedPrice} ₽{" "}
                  </p>
                )}
              {product?.inStock > 0 ? (
                inCart ? (
                  <div className="add catalog_counter">
                    <FiMinus onClick={() => handleDecrement(product)} />
                    <p className="amount">{displayQuantity}</p>
                    <FiPlus onClick={() => handleIncrement(product)} />
                  </div>
                ) : (
                  <div
                    className="price"
                    onClick={() => nav(`/item/${getModelId(product)}`)}
                  >
                    {formatNumber(+product.discountedPrice || +product.price)} ₽
                  </div>
                )
              ) : product.accessabilitySettingsID == 222 ? (
                <div className="price notInStock">Нет в наличии</div>
              ) : inCart ? (
                <div className="add catalog_counter">
                  <FiMinus onClick={() => handleDecrement(product)} />
                  <p className="amount">{displayQuantity}</p>
                  <FiPlus onClick={() => handleIncrement(product)} />
                </div>
              ) : (
                <div
                  className="price"
                  onClick={() => nav(`/item/${getModelId(product)}`)}
                >
                  {formatNumber(+product.discountedPrice || +product.price)} ₽
                </div>
              )}
            </div>
          ) : (
            ""
          );
        })}
      </div>
      {buttonLoading && hasMore && (
        <div className="loader" style={{ marginTop: 20 }}>
          <img width={100} src={loader} alt="" />
        </div>
      )}
      {!hasMore && filteredProducts.length > 0 && (
        <p className="noMore">Других товаров нет!</p>
      )}
      {hasMore && !buttonLoading && (
        <button className="load_more" onClick={fetchMoreData}>
          <BiPlus /> Показать еще
        </button>
      )}
      <FilterModal
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        pendingFilters={pendingFilters}
        setPendingFilters={setPendingFilters}
        statusAccordionOpen={statusAccordionOpen}
        setStatusAccordionOpen={setStatusAccordionOpen}
        statusPriceOpen={statusPriceOpen}
        setStatusPriceOpen={setStatusPriceOpen}
      />
      <SortModal
        isSortOpen={isSortOpen}
        setIsSortOpen={setIsSortOpen}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        filteredProducts={filteredProducts}
        setFilteredProducts={setFilteredProducts}
      />
    </div>
  );
}

export default CategoryProducts;
