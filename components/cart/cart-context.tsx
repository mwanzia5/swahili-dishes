"use client";

import type { Cart, CartItem } from "lib/insforge/types";
import React, { createContext, use, useCallback, useContext, useMemo, useOptimistic, useTransition } from "react";

type UpdateType = "plus" | "minus" | "delete";

type CartAction =
  | { type: "UPDATE_ITEM"; payload: { itemId: string; updateType: UpdateType } }
  | { type: "ADD_ITEM"; payload: { item: CartItem } }
  | { type: "REPLACE_ALL"; payload: { cart: Cart } };

export type CartState = {
  id: string | undefined;
  items: CartItem[];
  total_quantity: number;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
};

type CartContextType = {
  cartPromise: Promise<CartState>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function calculateItemCost(quantity: number, unitPrice: string): number {
  return Number(unitPrice) * quantity;
}

function updateCartItemOptimistic(item: CartItem, updateType: UpdateType): CartItem | null {
  if (updateType === "delete") return null;
  const newQty = updateType === "plus" ? item.quantity + 1 : item.quantity - 1;
  if (newQty <= 0) return null;
  return { ...item, quantity: newQty };
}

function updateCartTotals(items: CartItem[]): Omit<CartState, "id"> {
  const total_quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + calculateItemCost(item.quantity, item.unit_price),
    0,
  );
  return { items, total_quantity, subtotal, delivery_fee: 0, discount: 0, total: subtotal };
}

function createEmptyCart(): CartState {
  return { id: undefined, items: [], total_quantity: 0, subtotal: 0, delivery_fee: 0, discount: 0, total: 0 };
}

function cartReducer(state: CartState | undefined, action: CartAction): CartState {
  const current = state ?? createEmptyCart();
  switch (action.type) {
    case "REPLACE_ALL":
      return {
        id: action.payload.cart.id,
        items: action.payload.cart.items ?? [],
        total_quantity: action.payload.cart.total_quantity ?? 0,
        subtotal: action.payload.cart.subtotal ?? 0,
        delivery_fee: Number(action.payload.cart.delivery_fee ?? 0),
        discount: Number(action.payload.cart.discount ?? 0),
        total: action.payload.cart.total ?? 0,
      };
    case "UPDATE_ITEM": {
      const { itemId, updateType } = action.payload;
      const updated = current.items
        .map((item) => (item.id === itemId ? updateCartItemOptimistic(item, updateType) : item))
        .filter(Boolean) as CartItem[];
      return { ...current, ...updateCartTotals(updated) };
    }
    case "ADD_ITEM": {
      const { item } = action.payload;
      const existing = current.items.find((i) => i.product_id === item.product_id && i.variant_id === item.variant_id);
      let updatedItems: CartItem[];
      if (existing) {
        updatedItems = current.items.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
      } else {
        updatedItems = [...current.items, item];
      }
      return { ...current, ...updateCartTotals(updatedItems) };
    }
    default:
      return current;
  }
}

export function CartProvider({
  children,
  cartPromise,
}: {
  children: React.ReactNode;
  cartPromise: Promise<CartState>;
}) {
  return (
    <CartContext.Provider value={{ cartPromise }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error("useCart must be used within a CartProvider");

  const initialCart = use(context.cartPromise);
  const [optimisticCart, updateOptimisticCart] = useOptimistic(initialCart, cartReducer);
  const [isPending, startTransition] = useTransition();

  const updateCartItem = useCallback((itemId: string, updateType: UpdateType) => {
    startTransition(() => {
      updateOptimisticCart({ type: "UPDATE_ITEM", payload: { itemId, updateType } });
    });
  }, [updateOptimisticCart]);

  const addCartItem = useCallback((item: CartItem) => {
    startTransition(() => {
      updateOptimisticCart({ type: "ADD_ITEM", payload: { item } });
    });
  }, [updateOptimisticCart]);

  const setCart = useCallback((cart: CartState) => {
    startTransition(() => {
      updateOptimisticCart({ type: "REPLACE_ALL", payload: { cart: cart as any } });
    });
  }, [updateOptimisticCart]);

  return useMemo(
    () => ({ cart: optimisticCart, updateCartItem, addCartItem, setCart, isPending }),
    [optimisticCart, updateCartItem, addCartItem, setCart, isPending],
  );
}