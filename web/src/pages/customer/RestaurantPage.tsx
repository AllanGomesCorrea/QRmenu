import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Search, 
  ShoppingBag, 
  Loader2,
  AlertCircle,
  ClipboardList,
  Bell,
  Receipt,
} from 'lucide-react';
import { useMenu } from '@/hooks/useMenu';
import { useCartStore } from '@/stores/cartStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSocket } from '@/hooks/useSocket';
import { useMyOrders } from '@/hooks/useOrders';
import { formatCurrency, formatPhone } from '@/utils/formatters';
import MenuCategory from '@/components/menu/MenuCategory';
import MenuItemModal from '@/components/menu/MenuItemModal';
import CartDrawer from '@/components/cart/CartDrawer';
import OrdersDrawer from '@/components/orders/OrdersDrawer';
import { MenuItem } from '@/types';

export default function RestaurantPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useMenu(slug!);
  
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  
  const itemCount = useCartStore((state) => state.getItemCount());
  const subtotal = useCartStore((state) => state.getSubtotal());
  
  const session = useSessionStore((state) => state.session);
  const isSessionValid = useSessionStore((state) => state.isSessionValid());
  
  // Socket connection for real-time updates
  const { callWaiter, requestBill } = useSocket();
  
  // Get active orders count
  const { data: orders = [] } = useMyOrders();
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Restaurante não encontrado
          </h1>
          <p className="text-gray-600">
            O restaurante que você procura não existe ou está temporariamente indisponível.
          </p>
        </div>
      </div>
    );
  }

  const { restaurant, categories, featuredItems } = data;

  // Filter categories/items by search
  const filteredCategories = searchQuery
    ? categories.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((cat) => cat.items.length > 0)
    : categories;

  const handleItemClick = (itemId: string) => {
    const item = categories
      .flatMap((c) => c.items)
      .find((i) => i.id === itemId);
    if (item) {
      setSelectedItem(item);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with banner */}
      <header className="relative">
        {restaurant.bannerUrl ? (
          <img
            src={restaurant.bannerUrl}
            alt={restaurant.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-r from-primary-500 to-amber-500" />
        )}

        {/* Restaurant info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="container mx-auto max-w-3xl flex items-end gap-4">
            {restaurant.logoUrl ? (
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="w-20 h-20 rounded-xl bg-white object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center shadow-lg">
                <span className="text-3xl">🍽️</span>
              </div>
            )}
            <div className="text-white pb-1">
              <h1 className="font-heading text-2xl font-bold">{restaurant.name}</h1>
              <div className="flex items-center gap-4 text-sm text-white/80 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {restaurant.city}, {restaurant.state}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {formatPhone(restaurant.phone)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search bar */}
      <div className="sticky top-0 bg-white shadow-sm z-20 px-4 py-3">
        <div className="container mx-auto max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      {!searchQuery && categories.length > 1 && (
        <div className="sticky top-[68px] bg-white border-b border-gray-100 z-10 overflow-x-auto">
          <div className="container mx-auto max-w-3xl flex gap-1 px-4 py-2">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`#category-${category.id}`}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 whitespace-nowrap rounded-lg hover:bg-gray-100 transition-colors"
              >
                {category.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Featured items */}
      {!searchQuery && featuredItems.length > 0 && (
        <section className="container mx-auto max-w-3xl px-4 py-6">
          <h2 className="font-heading text-lg font-bold text-gray-900 mb-4">
            ⭐ Destaques
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {featuredItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="flex-shrink-0 w-40 bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {item.name}
                  </h3>
                  <p className="text-primary-600 font-bold text-sm mt-1">
                    {formatCurrency(item.price)}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Menu content */}
      <main className="container mx-auto max-w-3xl px-4 py-6 pb-32">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum item encontrado</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <MenuCategory
              key={category.id}
              category={category}
              onItemClick={handleItemClick}
            />
          ))
        )}
      </main>

      {/* Floating action buttons (only if session valid) */}
      {isSessionValid && (
        <div className="fixed right-4 top-56 z-30 flex flex-col gap-2">
          {/* Call waiter */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              callWaiter();
              alert('Garçom chamado! Aguarde um momento.');
            }}
            className="w-12 h-12 bg-amber-500 text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <Bell className="w-5 h-5" />
          </motion.button>
          
          {/* Request bill */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              requestBill();
              alert('Conta solicitada! Aguarde um momento.');
            }}
            className="w-12 h-12 bg-purple-500 text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <Receipt className="w-5 h-5" />
          </motion.button>
          
          {/* View orders */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOrdersOpen(true)}
            className="w-12 h-12 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center relative"
          >
            <ClipboardList className="w-5 h-5" />
            {activeOrdersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {activeOrdersCount}
              </span>
            )}
          </motion.button>
        </div>
      )}

      {/* Session info banner */}
      {isSessionValid && session && (
        <div className="fixed top-0 left-0 right-0 bg-primary-500 text-white text-center py-2 text-sm z-50">
          Mesa {session.tableNumber} • {session.customerName}
        </div>
      )}

      {/* Cart button */}
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-30"
        >
          <div className="container mx-auto max-w-3xl">
            <button
              onClick={() => setIsCartOpen(true)}
              className="btn-primary w-full py-4 justify-between"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Ver carrinho ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
              </span>
              <span>{formatCurrency(subtotal)}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Item modal */}
      {selectedItem && (
        <MenuItemModal
          item={selectedItem}
          restaurantSlug={slug!}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Cart drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        restaurantSlug={slug!}
      />

      {/* Orders drawer */}
      <OrdersDrawer
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />
    </div>
  );
}

