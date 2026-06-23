import React, { useState, useEffect, useMemo } from "react";
import { useLazyGetProductsByBrandQuery } from "../../context/service/productsApi";
import filterIcon from "../../img/filter.svg";
import sortIcon from "../../img/sort.svg";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import FilterModal from "./FilterModal";
import { BsChevronLeft } from "react-icons/bs";
import "./CategoryProducts.css";
import SortModal from "./SortModal";
import { useGoBackOrHome } from "../../utils/goBackOrHome";
import loader from "../../components/catalog/loader1.svg";
import { BiPlus } from "react-icons/bi";
import ProductCard, {
  getGroupKey,
  canShowGroup,
  getStock,
  getPrice,
} from "../../components/catalog/ProductCard";

function BrandProducts() {
  const { id } = useParams();

  const [getProductsByBrand, { isLoading }] = useLazyGetProductsByBrandQuery();
  const searchQuery = useSelector((state) => state.search.searchQuery);

  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("");
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
  const limit = 50;

  const fetchMoreData = () => {
    if (hasMore) {
      setButtonLoading(true);
      setOffset(offset + 50);
    } else {
      setHasMore(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      setButtonLoading(true);

      const { data: products1 } = await getProductsByBrand({
        id,
        limit,
        offset,
      });

      const productsData = products1?.reduce((unique, product) => {
        const isDuplicate = unique.some((p) => {
          const { _id, id, ...pRest } = p;
          const { _id: _, id: __, ...productRest } = product;

          return JSON.stringify(pRest) === JSON.stringify(productRest);
        });

        if (product.isMultiProduct === false || !isDuplicate) {
          unique.push(product);
        }

        return unique;
      }, []);

      setButtonLoading(false);
      setProducts(productsData || []);
      setFilteredProducts(productsData || []);
      setCategoryName(productsData?.[0]?.tradeMarkName || "Товары");

      if ((products1 || []).length < 50) {
        setHasMore(false);
      }
    };

    fetchData();
  }, [id, offset, getProductsByBrand]);

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
        product.article
          .toLowerCase()
          .includes(pendingFilters.article.toLowerCase())
      );
    }

    if (searchQuery) {
      result = result.filter((product) =>
        product.article.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(result);
  }, [products, pendingFilters, searchQuery]);

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
    const value = e.target.value.toLowerCase();

    setFilteredProducts(
      products.filter((product) => product.name.toLowerCase().includes(value))
    );
  };

  const back = useGoBackOrHome();

  if (isLoading) {
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
          <span>{categoryName}</span>
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

      {productGroups.length === 0 ? (
        <div className="noProducts">
          <p className="noMore">Товаров нет!</p>
        </div>
      ) : (
        <>
          <div className="catalogItem_cards">
            {productGroups.map((group) => (
              <ProductCard key={group.id} products={group.products} />
            ))}
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
        </>
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

export default BrandProducts;
