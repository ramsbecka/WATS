import { create } from 'zustand';

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  product?: { name_sw?: string; name_en?: string; price_tzs: number; product_images?: { url: string }[] };
};

type CartStore = {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  total: () => number;
  count: () => number;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({
    items: [...s.items.filter((i) => i.product_id !== item.product_id), { ...item, id: `${item.product_id}-${Date.now()}` }],
  })),
  updateQuantity: (productId, quantity) => set((s) => ({
    items: quantity <= 0
      ? s.items.filter((i) => i.product_id !== productId)
      : s.items.map((i) => i.product_id === productId ? { ...i, quantity } : i),
  })),
  removeItem: (productId) => set((s) => ({ items: s.items.filter((i) => i.product_id !== productId) })),
  total: () => get().items.reduce((sum, i) => sum + (i.product?.price_tzs ?? 0) * i.quantity, 0),
  count: () => get().items.reduce((c, i) => c + i.quantity, 0),
}));
