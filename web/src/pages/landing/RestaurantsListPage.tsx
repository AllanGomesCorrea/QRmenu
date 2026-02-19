import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, MapPin, Utensils, Loader2, Store } from 'lucide-react';
import api from '../../services/api';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  _count: {
    menuItems: number;
  };
}

interface RestaurantsResponse {
  data: Restaurant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function RestaurantsListPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const { data, isLoading, error } = useQuery<RestaurantsResponse>({
    queryKey: ['restaurants', debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      const response = await api.get(`/restaurants/public?${params}`);
      return response.data;
    },
  });

  const restaurants = data?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Descubra Restaurantes Incríveis
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Explore cardápios digitais, veja os pratos e faça pedidos diretamente do seu celular.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar restaurantes..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-100/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Restaurants Grid */}
      <section className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-gray-500">Erro ao carregar restaurantes</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-20">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum restaurante encontrado
              </h3>
              <p className="text-gray-500">
                {debouncedSearch
                  ? 'Tente buscar com outros termos'
                  : 'Ainda não há restaurantes cadastrados'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{data?.meta.total}</span>{' '}
                  {data?.meta.total === 1 ? 'restaurante encontrado' : 'restaurantes encontrados'}
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant, index) => (
                  <motion.div
                    key={restaurant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link
                      to={`/r/${restaurant.slug}`}
                      className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all group"
                    >
                      {/* Banner/Image */}
                      <div className="aspect-[16/9] bg-gradient-to-br from-primary-100 to-amber-100 relative overflow-hidden">
                        {restaurant.bannerUrl ? (
                          <img
                            src={restaurant.bannerUrl}
                            alt={restaurant.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="w-16 h-16 text-primary-300" />
                          </div>
                        )}
                        {/* Logo overlay */}
                        {restaurant.logoUrl && (
                          <div className="absolute bottom-3 left-3 w-14 h-14 bg-white rounded-xl shadow-lg p-1">
                            <img
                              src={restaurant.logoUrl}
                              alt=""
                              className="w-full h-full object-contain rounded-lg"
                            />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                          {restaurant.name}
                        </h3>
                        
                        {restaurant.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {restaurant.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          {restaurant.city && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {restaurant.city}
                                {restaurant.state && `, ${restaurant.state}`}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-sm text-primary-600 font-medium">
                            <Utensils className="w-4 h-4" />
                            <span>{restaurant._count.menuItems} itens</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

