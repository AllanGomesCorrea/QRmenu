import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Building2, ChevronDown, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

interface RestaurantSearchResult {
  data: Restaurant[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function RestaurantSelector() {
  const { user, selectedRestaurant, setSelectedRestaurant } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Only render for Super Admin
  if (!user?.isSuperAdmin) return null;

  const searchRestaurants = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const response = await api.get<RestaurantSearchResult>('/restaurants', {
        params: { search: query || undefined, limit: 20, page: 1 },
      });
      setResults(response.data.data);
      setTotalResults(response.data.meta.total);
    } catch (error) {
      console.error('Error searching restaurants:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchRestaurants(search);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, isOpen, searchRestaurants]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsOpen(false);
    setSearch('');
    // Force reload of all queries by refreshing the page
    window.location.reload();
  };

  const handleClear = () => {
    setSelectedRestaurant(null);
    window.location.reload();
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors max-w-[280px] ${
          selectedRestaurant
            ? 'border-primary-300 bg-primary-50 text-primary-700'
            : 'border-amber-300 bg-amber-50 text-amber-700'
        }`}
      >
        <Building2 className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          {selectedRestaurant ? selectedRestaurant.name : 'Selecionar Restaurante'}
        </span>
        {selectedRestaurant ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-0.5 hover:bg-primary-100 rounded"
            title="Remover seleção"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar restaurante..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {totalResults} restaurante(s) encontrado(s)
            </p>
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : results.length > 0 ? (
              results.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => handleSelect(restaurant)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    selectedRestaurant?.id === restaurant.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{restaurant.name}</p>
                    <p className="text-xs text-gray-500 truncate">{restaurant.slug}</p>
                  </div>
                  {selectedRestaurant?.id === restaurant.id && (
                    <span className="ml-auto text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                      Ativo
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500 text-sm">
                Nenhum restaurante encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
