import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FoodOrderConfig, MenuItem } from '../types';
import CategoryBar from './CategoryBar';
import SearchBar from './SearchBar';
import FoodCard from './FoodCard';
import CartFooter from './CartFooter';
import { filterByCategory, filterBySearch } from '../utils/filters';
import { computeSubtotal, getCartItemCount } from '../utils/cart';

interface BrowseMenuScreenProps {
  config: FoodOrderConfig;
  locale: string;
  cart: Map<string, number>;
  onAddToCart: (itemId: string) => void;
  onRemoveFromCart: (itemId: string) => void;
  onContinue: () => void;
}

const BrowseMenuScreen: React.FC<BrowseMenuScreenProps> = ({
  config,
  locale,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onContinue,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    let items = config.menu_items;
    items = filterByCategory(items, selectedCategory);
    if (debouncedQuery) {
      items = filterBySearch(items, debouncedQuery);
    }
    return items;
  }, [config.menu_items, selectedCategory, debouncedQuery]);

  const handleCategorySelect = useCallback((id: string) => {
    setSelectedCategory(id);
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  const itemCount = getCartItemCount(cart);
  const subtotal = computeSubtotal(cart, config.menu_items);

  return (
    <section className="browse-screen" aria-labelledby="browse-heading">
      <header className="browse-screen__header">
        <h2 id="browse-heading" className="browse-screen__brand">{config.brand_name}</h2>
        <p className="browse-screen__greeting">{config.labels.home_greeting}</p>
      </header>

      <SearchBar
        placeholder={config.labels.search_placeholder}
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <CategoryBar
        categories={config.categories}
        activeId={selectedCategory}
        onSelect={handleCategorySelect}
      />

      <div className="food-grid">
        {filteredItems.length === 0 ? (
          <p className="food-grid__empty">
            {debouncedQuery ? config.labels.no_search_results : config.labels.no_items}
          </p>
        ) : (
          filteredItems.map((item: MenuItem) => (
            <FoodCard
              key={item.id}
              item={item}
              quantity={cart.get(item.id) ?? 0}
              onAdd={() => onAddToCart(item.id)}
              onRemove={() => onRemoveFromCart(item.id)}
              currency={config.currency}
              locale={locale}
            />
          ))
        )}
      </div>

      <CartFooter
        itemCount={itemCount}
        total={subtotal}
        currency={config.currency}
        locale={locale}
        onContinue={onContinue}
        continueLabel={config.labels.continue}
        itemsLabel={config.labels.items_in_cart}
      />
    </section>
  );
};

export default BrowseMenuScreen;
