import React, { useState, useEffect, useMemo } from "react";
import "./CategoryProducts.css";
import { useLazyGetProductsByCategoryNameWithLimitQuery } from "../../context/service/productsApi";
import filterIcon from "../../img/filter.svg";
import sortIcon from "../../img/sort.svg";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import FilterModal from "./FilterModal";
import { BsChevronLeft } from "react-icons/bs";
import SortModal from "./SortModal";
import { useGoBackOrHome } from "../../utils/goBackOrHome";
import loader from "../../components/catalog/loader1.svg";
import { BiPlus } from "react-icons/bi";
import ProductCard, {
  getGroupKey,
  canShowGroup,
  getPrice,
  getStock,
} from "../../components/catalog/ProductCard";

function CategoryProducts() {
  const { id } = useParams();
  const back = useGoBackOrHome();

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
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const fetchMoreData = () => {
    if (!hasMore || buttonLoading) return;

    setButtonLoading(true);
    setOffset((prev) => prev + 50);
  };

  useEffect(() => {
    setOffset(0);
    setProducts([]);
    setFilteredProducts([]);
    setHasMore(true);
  }, [id]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data: productsData = [] } = await triggerGetProducts({
          id,
          limit: 50,
          offset,
        });

        const seen = new Set();
        const uniqueProducts = [];

        productsData.forEach((product) => {
          const { _id, id: productId, ...rest } = product;
          const key = JSON.stringify(rest);

          if (!seen.has(key)) {
            seen.add(key);
            uniqueProducts.push(product);
          }
        });

        setProducts((prev) => {
          if (offset === 0) return uniqueProducts;

          const existingIds = new Set(prev.map((product) => product.id));
          const nextProducts = uniqueProducts.filter(
            (product) => !existingIds.has(product.id)
          );

          return [...prev, ...nextProducts];
        });

        setHasMore(productsData.length >= 50);
      } catch (error) {
        console.error("Category products loading error:", error);
        setHasMore(false);
      } finally {
        setButtonLoading(false);
      }
    };

    fetchProducts();
  }, [offset, id, triggerGetProducts]);

  useEffect(() => {
    let result = [...products];

    if (pendingFilters.status === "inStock") {
      result = result.filter((product) => getStock(product) > 0);
    } else if (pendingFilters.status === "outOfStock") {
      result = result.filter((product) => getStock(product) === 0);
    }

    if (pendingFilters.priceFrom) {
      result = result.filter(
        (product) => getPrice(product) >= Number(pendingFilters.priceFrom)
      );
    }

    if (pendingFilters.priceTo) {
      result = result.filter(
        (product) => getPrice(product) <= Number(pendingFilters.priceTo)
      );
    }

    if (pendingFilters.article) {
      result = result.filter((product) =>
        String(product.article || "")
          .toLowerCase()
          .includes(pendingFilters.article.toLowerCase())
      );
    }

    if (searchQuery) {
      result = result.filter((product) =>
        String(product.article || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    if (searchValue) {
      result = result.filter((product) =>
        String(product.name || "")
          .toLowerCase()
          .includes(searchValue.toLowerCase())
      );
    }

    setFilteredProducts(result);
  }, [products, pendingFilters, searchQuery, searchValue]);

  const productGroups = useMemo(() => {
    const groups = new Map();

    filteredProducts.forEach((product) => {
      const key = getGroupKey(product);

      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          products: [],
        });
      }

      groups.get(key).products.push(product);
    });

    return Array.from(groups.values()).filter((group) =>
      canShowGroup(group.products)
    );
  }, [filteredProducts]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  if (isLoading && offset === 0) {
    return (
      <div className="loader">
        <img width={100} src={loader} alt="" />
      </div>
    );
  }

  return (
    <div className="container categoryProducts">
      <div className="categoryProducts_title">
        <div onClick={back} className="left">
          <BsChevronLeft />
          <span>
            {filteredProducts[0]?.categoryName || products[0]?.categoryName}
          </span>
        </div>

        <input
          value={searchValue}
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

      {productGroups.length === 0 ? (
        <div className="noProducts">
          <p className="noMore">Товаров нет!</p>
        </div>
      ) : (
        <div className="catalogItem_cards">
          {productGroups.map((group) => (
            <ProductCard key={group.id} products={group.products} />
          ))}
        </div>
      )}

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
