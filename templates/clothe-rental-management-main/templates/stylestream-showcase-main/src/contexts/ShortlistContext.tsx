import React, { createContext, useContext, useState, useCallback } from 'react';

interface ShortlistItem {
  productId: string;
  note: string;
}

interface ShortlistContextType {
  items: ShortlistItem[];
  add: (productId: string) => void;
  remove: (productId: string) => void;
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
  updateNote: (productId: string, note: string) => void;
  count: number;
}

const ShortlistContext = createContext<ShortlistContextType | null>(null);

export const useShortlist = () => {
  const ctx = useContext(ShortlistContext);
  if (!ctx) throw new Error('useShortlist must be inside ShortlistProvider');
  return ctx;
};

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShortlistItem[]>([]);

  const add = useCallback((productId: string) => {
    setItems(prev => prev.some(i => i.productId === productId) ? prev : [...prev, { productId, note: '' }]);
  }, []);

  const remove = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const toggle = useCallback((productId: string) => {
    setItems(prev => prev.some(i => i.productId === productId) ? prev.filter(i => i.productId !== productId) : [...prev, { productId, note: '' }]);
  }, []);

  const has = useCallback((productId: string) => items.some(i => i.productId === productId), [items]);

  const updateNote = useCallback((productId: string, note: string) => {
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, note } : i));
  }, []);

  return (
    <ShortlistContext.Provider value={{ items, add, remove, toggle, has, updateNote, count: items.length }}>
      {children}
    </ShortlistContext.Provider>
  );
}
