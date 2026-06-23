import axios from "axios";
import toast from "react-hot-toast";

const getProducts = async () => {
  const req = await fetch("https://api.toymarket.site/products");
  const res = await req.json();

  return Array.isArray(res) ? res : res?.data ?? res;
};
const getProductsByType = async (id) => {
  const req = await fetch("https://api.toymarket.site/products?type=" + id);
  const res = await req.json();

  return Array.isArray(res) ? res : res?.data ?? res;
};
const getProductsById = async (id) => {
  try {
    const req = await fetch("https://api.toymarket.site/products/models/" + id);
    const res = await req.json();

    return res;
  } catch (err) {
    // if (err.status == 401) {
    //   localStorage.removeItem("user");
    //   window.location.href = "/auth";
    // }
  }
};
const getProductsByTypeWithLimit = async (id, limit) => {
  const req = await fetch(
    "https://api.toymarket.site/products?category=" +
      id +
      (limit ? "&limit=" + limit : "")
  );
  const res = await req.json();

  return Array.isArray(res) ? res : res?.data ?? res;
};

const getNewProducts = async (limit) => {
  const req = await fetch(
    "https://api.toymarket.site/products?category=-1" + "&limit=" + limit
  );
  const res = await req.json();

  return Array.isArray(res) ? res : res?.data ?? res;
};

const getProductsBySearch = async (value) => {
  const query = value ? `'"${value}"'` : "";
  const req = await fetch(
    "https://api.toymarket.site/products?query=" + encodeURIComponent(query)
  );
  const res = await req.json();

  return Array.isArray(res) ? res : res?.data ?? res;
};

const getUser = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    const req = await fetch("https://api.toymarket.site/auth/me/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "WebApp",
      },
      body: JSON.stringify({
        tgUserData: user,
      }),
    });

    const res = await req.json();

    return res.data;
  } catch (err) {
    toast.error("Не удалось войти в систему, попробуйте снова.");
    localStorage.removeItem("user");
    window.location.href = "/auth";
    return null;
  }
};

const newOrder = async (data) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const req = await fetch("https://api.toymarket.site/order/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: "WebApp",
    },
    body: JSON.stringify({
      tgUserData: user,
      ...data,
    }),
  });
  const res = await req.json();

  return res;
};

const payTBank = async (orderID) => {
  const user = JSON.parse(localStorage.getItem("user"));

  const req = await fetch(`https://api.toymarket.site/payment/tbank/init/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: "WebApp",
    },
    body: JSON.stringify({
      tgUserData: user,
      orderID: orderID,
    }),
  });
  const res = await req.json();

  return res;
};

const getSingleProduct = async (id) => {
  const req = await fetch(`https://api.toymarket.site/product?id=${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const res = await req.json();

  const data = Array.isArray(res) ? res : res?.data ?? res;
  return Array.isArray(data) ? data[0] : data;
};

const getCategories = async () => {
  const req = await fetch(`https://api.toymarket.site/products/categories`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization: "WebApp",
    },
  });
  const res = await req.json();

  return Array.isArray(res) ? res : res?.data ?? res;
};

const api = axios.create({
  baseURL: "https://api.toymarket.site/",
  withCredentials: true,
});

export const getToken = async () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));

    const response = await axios.post(
      "https://api.toymarket.site/auth/login/telegram/widget",
      {
        data: user,
      },
      {
        withCredentials: true,
      }
    );

    return response.data;
  } catch (err) {
    toast.error("Не удалось войти в систему, попробуйте снова.");
    localStorage.removeItem("user");
    window.location.href = "/auth";
    return null;
  }
};

export const getCart = async () => {
  const response = await api.get("/cart", {
    withCredentials: true,
    headers: {
      authorization: `WebApp`,
    },
  });
  return response.data;
};

export const addCartItem = async ({ product_id, quantity = 1 }) => {
  const response = await api.post(
    "/cart",
    {
      product_id,
      quantity,
    },
    {
      withCredentials: true,
    }
  );

  return response.data;
};

export const updateCartItemQuantity = async ({ product_id, quantity }) => {
  const response = await api.patch(
    `/cart/${product_id}`,
    {
      quantity,
    },
    {
      withCredentials: true,
      headers: {
        authorization: `WebApp`,
      },
    }
  );

  return response.data;
};

export const removeCartItem = async (product_id) => {
  const response = await api.delete(`/cart/${product_id}`, {
    headers: {
      authorization: `WebApp`,
    },
  });
  return response.data;
};

export const clearServerCart = async () => {
  const response = await api.delete("/cart", {
    headers: {
      authorization: `WebApp`,
    },
  });
  return response.data;
};

export {
  getProducts,
  newOrder,
  payTBank,
  getUser,
  getSingleProduct,
  getCategories,
  getProductsByType,
  getProductsById,
  getProductsByTypeWithLimit,
  getNewProducts,
  getProductsBySearch,
};
