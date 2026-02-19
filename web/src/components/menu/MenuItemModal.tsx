import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Flame, Leaf, WheatOff, Clock } from 'lucide-react';
import { MenuItem, MenuItemExtra } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useCartStore } from '@/stores/cartStore';

interface Props {
  item: MenuItem | null;
  restaurantSlug: string;
  onClose: () => void;
}

export default function MenuItemModal({ item, restaurantSlug, onClose }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<MenuItemExtra[]>([]);
  const [notes, setNotes] = useState('');
  
  const addItem = useCartStore((state) => state.addItem);

  if (!item) return null;

  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const itemTotal = (item.price + extrasTotal) * quantity;

  const toggleExtra = (extra: MenuItemExtra) => {
    setSelectedExtras((prev) =>
      prev.find((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const handleAddToCart = () => {
    addItem({
      menuItem: item,
      quantity,
      selectedExtras,
      notes: notes.trim() || undefined,
    }, restaurantSlug);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button - positioned at top right of modal */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image */}
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-48 object-cover rounded-t-3xl sm:rounded-t-2xl"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-t-3xl sm:rounded-t-2xl">
              <span className="text-6xl">🍽️</span>
            </div>
          )}

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-heading text-xl font-bold text-gray-900">
                  {item.name}
                </h2>
                {/* Badges */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {item.isVegan && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      <Leaf className="w-3 h-3" /> Vegano
                    </span>
                  )}
                  {item.isVegetarian && !item.isVegan && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      <Leaf className="w-3 h-3" /> Vegetariano
                    </span>
                  )}
                  {item.isGlutenFree && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                      <WheatOff className="w-3 h-3" /> Sem Glúten
                    </span>
                  )}
                  {item.isSpicy && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                      <Flame className="w-3 h-3" /> Picante
                    </span>
                  )}
                  {item.prepTime && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      <Clock className="w-3 h-3" /> {item.prepTime} min
                    </span>
                  )}
                </div>
              </div>
              <span className="font-bold text-lg text-primary-600 flex-shrink-0">
                {formatCurrency(item.price)}
              </span>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-gray-600 mb-6">{item.description}</p>
            )}

            {/* Extras */}
            {item.extras.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Adicionais
                </h3>
                <div className="space-y-2">
                  {item.extras.map((extra) => {
                    const isSelected = selectedExtras.find((e) => e.id === extra.id);
                    return (
                      <button
                        key={extra.id}
                        onClick={() => toggleExtra(extra)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-gray-900">{extra.name}</span>
                        <span className="text-gray-600">
                          + {formatCurrency(extra.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Sem cebola, bem passado..."
                className="input resize-none"
                rows={2}
              />
            </div>

            {/* Quantity and Add button */}
            <div className="flex items-center gap-4">
              {/* Quantity */}
              <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                className="btn-primary flex-1 py-3"
              >
                Adicionar • {formatCurrency(itemTotal)}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

