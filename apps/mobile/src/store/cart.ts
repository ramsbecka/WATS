import { create } from 'zustand';

export type CartItem = {
  id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  product?: { name_sw?: string; name_en?: string; price_tzs: number; product_images?: { url: string }[] };
};

type CartStore = {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  total: () => number;
  count: () => number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => {
    const key = item.variant_id ? `${item.product_id}-${item.variant_id}` : item.product_id;
    return {
      items: [...s.items.filter((i) => {
        const iKey = i.variant_id ? `${i.product_id}-${i.variant_id}` : i.product_id;
        return iKey !== key;
      }), { ...item, id: `${key}-${Date.now()}` }],
    };
  }),
  updateQuantity: (productId, quantity, variantId) => set((s) => {
    const key = variantId ? `${productId}-${variantId}` : productId;
    return {
      items: quantity <= 0
        ? s.items.filter((i) => {
          const iKey = i.variant_id ? `${i.product_id}-${i.variant_id}` : i.product_id;
          return iKey !== key;
        })
        : s.items.map((i) => {
          const iKey = i.variant_id ? `${i.product_id}-${i.variant_id}` : i.product_id;
          return iKey === key ? { ...i, quantity } : i;
        }),
    };
  }),
  removeItem: (productId, variantId) => set((s) => {
    const key = variantId ? `${productId}-${variantId}` : productId;
    return {
      items: s.items.filter((i) => {
        const iKey = i.variant_id ? `${i.product_id}-${i.variant_id}` : i.product_id;
        return iKey !== key;
      }),
    };
  }),
  total: () => get().items.reduce((sum, i) => sum + (i.product?.price_tzs ?? 0) * i.quantity, 0),
  count: () => get().items.reduce((c, i) => c + i.quantity, 0),
}));
