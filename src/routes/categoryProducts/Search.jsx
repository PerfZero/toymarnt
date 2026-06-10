import React, { useState, useEffect, useMemo } from "react";
import "./CategoryProducts.css";
import { useGetProductsBySearchQuery } from "../../context/service/productsApi";
import filterIcon from "../../img/filter.svg";
import sortIcon from "../../img/sort.svg";
import { useDispatch, useSelector } from "react-redux";
import FilterModal from "./FilterModal";
import { BsChevronLeft } from "react-icons/bs";
import SortModal from "./SortModal";
import { getDeclination } from "../../utils/getDeclination";
import { setSearchQuery } from "../../context/searchSlice";
import loader from "../../components/catalog/loader1.svg";
import { useGoBackOrHome } from "../../utils/goBackOrHome";
import ProductCard, {
  getGroupKey,
  canShowGroup,
  getPrice,
  getStock,
} from "../../components/catalog/ProductCard";

function TypesProducts() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const searchQuery = useSelector((state) => state.search.searchQuery);
  const { data: productsData } = useGetProductsBySearchQuery(searchQuery);

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

  const handleSearchChange = (e) => dispatch(setSearchQuery(e.target.value));

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const allProducts = (await productsData) || [];

      const processedProducts = allProducts.reduce((unique, product) => {
        const key = `${product.color}-${product.size}`;
        const exists = unique.some(
          (item) => `${item.color}-${item.size}` === key
        );

        if (!exists || product.isMultiProduct === false) {
          unique.push(product);
        }

        return unique;
      }, []);

      setProducts(processedProducts);
      setFilteredProducts(processedProducts);
      setIsLoading(false);
    };

    fetchData();
  }, [searchQuery, productsData]);

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
      const q = searchQuery.toLowerCase();

      result = result.filter(
        (product) =>
          String(product.name || "")
            .toLowerCase()
            .includes(q) ||
          String(product.article || "")
            .toLowerCase()
            .includes(q)
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

  const back = useGoBackOrHome();

  return (
    <div className="container categoryProducts">
      <div className="categoryProducts_title">
        <div onClick={back} className="left">
          <BsChevronLeft />
          <span>Поиск</span>
          <span className="countOfProducts">
            {getDeclination(productGroups.length, [
              "товар",
              "товара",
              "товаров",
            ])}
          </span>
        </div>

        <input
          value={searchQuery}
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

      {isLoading && searchQuery ? (
        <div
          style={{
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "calc(100vh - 100px)",
          }}
        >
          <img src={loader} alt="" />
        </div>
      ) : productGroups.length === 0 ? (
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

export default TypesProducts;
