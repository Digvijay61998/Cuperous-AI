import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { EcommerceConfig, Product, CartEntry } from '../types';
import CategoryRow from './CategoryRow';
import SearchBar from './SearchBar';
import ProductCard from './ProductCard';
import CartFooter from './CartFooter';
import { filterByCategory, filterBySearch } from '../utils/filters';
import { computeSubtotal, getCartItemCount } from '../utils/cart';

interface BrowseProductsScreenProps {
  config: EcommerceConfig;
  locale: string;
  cart: Map<string, CartEntry>;
  onAddToCart: (productId: string) => void;
  onProductTap: (product: Product) => void;
  onContinue: () => void;
}

const BrowseProductsScreen: React.FC<BrowseProductsScreenProps> = ({
  config,
  locale,
  cart,
  onAddToCart,
  onProductTap,
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

  const filteredProducts = useMemo(() => {
    let products = config.products;
    products = filterByCategory(products, selectedCategory);
    if (debouncedQuery) {
      products = filterBySearch(products, debouncedQuery);
    }
    return products;
  }, [config.products, selectedCategory, debouncedQuery]);

  const handleCategorySelect = useCallback((id: string) => {
    setSelectedCategory(id);
    setSearchQuery('');
    setDebouncedQuery('');
  }, []);

  // Compute cart quantity per product (all sizes combined)
  const getProductCartQty = (productId: string): number => {
    let qty = 0;
    for (const entry of cart.values()) {
      if (entry.productId === productId) {
        qty += entry.quantity;
      }
    }
    return qty;
  };

  const itemCount = getCartItemCount(cart);
  const subtotal = computeSubtotal(cart, config.products);

  return (
    <section className="browse-screen" aria-labelledby="browse-heading">
      <header className="browse-screen__header">
        <h2 id="browse-heading" className="browse-screen__brand">{config.brand_name}</h2>
      </header>

      <SearchBar
        placeholder={config.labels.search_placeholder}
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <CategoryRow
        categories={config.categories}
        activeId={selectedCategory}
        onSelect={handleCategorySelect}
      />

      <div className="product-grid">
        {filteredProducts.length === 0 ? (
          <p className="product-grid__empty">
            {debouncedQuery ? config.labels.no_search_results : config.labels.no_products}
          </p>
        ) : (
          filteredProducts.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartQuantity={getProductCartQty(product.id)}
              onAdd={() => onAddToCart(product.id)}
              onTap={() => onProductTap(product)}
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

export default BrowseProductsScreen;
