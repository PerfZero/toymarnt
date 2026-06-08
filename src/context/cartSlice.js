import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getCart as getCartApi,
  addCartItem as addCartItemApi,
  updateCartItemQuantity as updateCartItemQuantityApi,
  removeCartItem as removeCartItemApi,
  clearServerCart as clearServerCartApi,
} from "../api";

const loadCartFromStorage = () => {
  const savedCart = localStorage.getItem("cart");
  return savedCart ? JSON.parse(savedCart) : [];
};

const saveCartToStorage = (cart) => {
  localStorage.setItem("cart", JSON.stringify(cart));
};

export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  return await getCartApi();
});

export const syncAddCartItem = createAsyncThunk(
  "cart/syncAddCartItem",
  async ({ product_id, quantity }) => {
    return await addCartItemApi({ product_id, quantity });
  }
);

export const syncUpdateCartItemQuantity = createAsyncThunk(
  "cart/syncUpdateCartItemQuantity",
  async ({ product_id, quantity }) => {
    return await updateCartItemQuantityApi({ product_id, quantity });
  }
);

export const syncRemoveCartItem = createAsyncThunk(
  "cart/syncRemoveCartItem",
  async (product_id) => {
    await removeCartItemApi(product_id);
    return product_id;
  }
);

export const syncClearServerCart = createAsyncThunk(
  "cart/syncClearServerCart",
  async () => {
    await clearServerCartApi();
    return [];
  }
);

const initialState = {
  items: loadCartFromStorage(),
  userInfo: {
    name: "",
    phone: "",
    address: "",
    companyName: "",
    inn: "",
  },
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );

      if (existingItem) {
        existingItem.quantity += Number(action.payload.inPackage || 1);
      } else {
        state.items.push({
          ...action.payload,
          quantity: Number(action.payload.recomendedMinimalSize || 1),
        });
      }

      // request to api
      
      addCartItemApi({
        product_id: action.payload.id,
        quantity: Number(action.payload.recomendedMinimalSize || 1),
      });

      saveCartToStorage(state.items);
    },

    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      saveCartToStorage(state.items);
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((item) => item.id === id);

      if (item && quantity > 0) {
        item.quantity = quantity;
      }

      saveCartToStorage(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      saveCartToStorage(state.items);
    },

    setCart: (state, action) => {
      state.items = action.payload;
      saveCartToStorage(state.items);
    },

    setUserInfo: (state, action) => {
      state.userInfo = { ...state.userInfo, ...action.payload };
    },

    incrementQuantity: (state, action) => {
      const { productId, inStock } = action.payload;
      const item = state.items.find((item) => item.id === productId);
      if (!item) return;

      const newQuantity = Number(item.quantity) + Number(item.inPackage || 1);

      if (item.accessabilitySettingsID != 222 && newQuantity <= 100) {
        item.quantity = newQuantity;

        updateCartItemQuantityApi({
          product_id: productId,
          quantity: newQuantity,
        });
      } else if (item.quantity < inStock && newQuantity <= item.inStock) {
        item.quantity = newQuantity;
        updateCartItemQuantityApi({
          product_id: productId,
          quantity: newQuantity,
        });
      }

      saveCartToStorage(state.items);
    },

    decrementQuantity: (state, action) => {
      const { productId, inPackage } = action.payload;
      const item = state.items.find((item) => item.id === productId);
      if (!item || item.quantity <= 0) return;

      const minusAmount = Number(inPackage || item.inPackage || 1);
      const newQuantity = Number(item.quantity) - minusAmount;

      if (newQuantity > 0) {
        item.quantity = newQuantity;
        // request to api

        updateCartItemQuantityApi({
          product_id: productId,
          quantity: newQuantity,
        });
      } else {
        state.items = state.items.filter((item) => item.id !== productId);
      }

      saveCartToStorage(state.items);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        saveCartToStorage(state.items);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCart,
  setUserInfo,
  incrementQuantity,
  decrementQuantity,
} = cartSlice.actions;

export default cartSlice.reducer;
