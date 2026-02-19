import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Search, 
  Loader2,
  AlertCircle,
  ArrowLeft,
  Utensils,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';
import { formatCurrency, formatPhone } from '../../utils/formatters';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { MenuItem } from '../../types';

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
}

function MenuItemCard({ item, onClick }: MenuItemCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-primary-200 transition-all text-left group"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex">
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {item.name}
            </h3>
            {item.isFeatured && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                ⭐ Destaque
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <span className="text-primary-600 font-bold">
              {formatCurrency(item.price)}
            </span>
            {item.prepTime && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {item.prepTime} min
              </span>
            )}
            {item.isVegetarian && (
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                🌱 Vegetariano
              </span>
            )}
          </div>
        </div>
        {item.imageUrl && (
          <div className="w-28 h-28 flex-shrink-0">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </motion.button>
  );
}

interface ItemModalProps {
  item: MenuItem;
  onClose: () => void;
}

function ItemModal({ item, onClose }: ItemModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {item.imageUrl && (
          <div className="aspect-video relative">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="font-heading text-2xl font-bold text-gray-900">
              {item.name}
            </h2>
            {item.isFeatured && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                ⭐ Destaque
              </span>
            )}
          </div>
          
          {item.description && (
            <p className="text-gray-600 mb-4">{item.description}</p>
          )}

          <div className="flex items-center gap-4 mb-6">
            <span className="text-2xl font-bold text-primary-600">
              {formatCurrency(item.price)}
            </span>
            {item.prepTime && (
              <span className="flex items-center gap-1 text-gray-500">
                <Clock className="w-4 h-4" />
                {item.prepTime} min
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {item.isVegetarian && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                🌱 Vegetariano
              </span>
            )}
            {item.isVegan && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                🥬 Vegano
              </span>
            )}
            {item.isGlutenFree && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                🌾 Sem Glúten
              </span>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-amber-800 text-sm">
              Para fazer pedidos, escaneie o QR Code na mesa do restaurante.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function RestaurantPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useMenu(slug!);
  
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Restaurante não encontrado
            </h1>
            <p className="text-gray-600 mb-6">
              O restaurante que você procura não existe ou está temporariamente indisponível.
            </p>
            <Link to="/" className="btn-primary">
              Voltar aos Restaurantes
            </Link>
          </div>
        </div>
        <Footer />
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

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Back button */}
      <div className="bg-white border-b border-gray-100 pt-16">
        <div className="container mx-auto max-w-4xl px-4 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos restaurantes
          </Link>
        </div>
      </div>

      {/* Restaurant Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              {restaurant.logoUrl ? (
                <img
                  src={restaurant.logoUrl}
                  alt={restaurant.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover shadow-lg border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-primary-100 to-amber-100 flex items-center justify-center shadow-lg border-4 border-white">
                  <Utensils className="w-12 h-12 text-primary-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {restaurant.name}
              </h1>
              
              {restaurant.description && (
                <p className="text-gray-600 mb-4 max-w-2xl">
                  {restaurant.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {restaurant.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {restaurant.address && `${restaurant.address}, `}
                    {restaurant.city}
                    {restaurant.state && `, ${restaurant.state}`}
                  </span>
                )}
                {restaurant.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {formatPhone(restaurant.phone)}
                  </span>
                )}
                <span className="flex items-center gap-1 text-primary-600 font-medium">
                  <Utensils className="w-4 h-4" />
                  {totalItems} itens no cardápio
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search & Categories */}
      <div className="sticky top-16 bg-white border-b border-gray-100 z-20">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category tabs */}
          {!searchQuery && categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`#category-${category.id}`}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 whitespace-nowrap rounded-full bg-gray-100 hover:bg-primary-50 transition-all"
                >
                  {category.name}
                  <span className="ml-1 text-gray-400">({category.items.length})</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Menu Content */}
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-4xl px-4">
          {/* Featured Items */}
          {!searchQuery && featuredItems.length > 0 && (
            <section className="mb-10">
              <h2 className="font-heading text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Destaques
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {featuredItems.slice(0, 4).map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Categories */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Nenhum item encontrado
              </h3>
              <p className="text-gray-500">
                Tente buscar com outros termos
              </p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="mb-10 scroll-mt-40"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-gray-900">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-gray-500 text-sm mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {category.items.length} {category.items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {category.items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}

          {/* CTA to visit */}
          <div className="bg-gradient-to-r from-primary-500 to-amber-500 rounded-2xl p-8 text-center text-white mt-12">
            <h3 className="font-heading text-2xl font-bold mb-3">
              Gostou do cardápio?
            </h3>
            <p className="text-primary-100 mb-6">
              Visite o restaurante e escaneie o QR Code na mesa para fazer seus pedidos em tempo real!
            </p>
            {restaurant.address && (
              <div className="flex items-center justify-center gap-2 text-white/80">
                <MapPin className="w-5 h-5" />
                <span>
                  {restaurant.address}
                  {restaurant.city && `, ${restaurant.city}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Item Modal */}
      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

