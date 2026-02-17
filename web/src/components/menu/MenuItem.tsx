import { motion } from 'framer-motion';
import { Flame, Leaf, WheatOff, Clock, Star } from 'lucide-react';
import { MenuItem as MenuItemType } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface Props {
  item: MenuItemType;
  onClick: () => void;
}

export default function MenuItem({ item, onClick }: Props) {
  return (
    <motion.button
      onClick={onClick}
      className="card flex gap-4 text-left hover:shadow-md transition-shadow w-full"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Image */}
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">🍽️</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">
                {item.name}
              </h3>
              {item.isFeatured && (
                <Star className="w-4 h-4 text-primary-500 fill-primary-500 flex-shrink-0" />
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {item.isVegan && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                  <Leaf className="w-3 h-3" />
                  Vegano
                </span>
              )}
              {item.isVegetarian && !item.isVegan && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                  <Leaf className="w-3 h-3" />
                  Vegetariano
                </span>
              )}
              {item.isGlutenFree && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                  <WheatOff className="w-3 h-3" />
                  Sem Glúten
                </span>
              )}
              {item.isSpicy && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                  <Flame className="w-3 h-3" />
                  Picante
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <span className="font-bold text-primary-600 flex-shrink-0">
            {formatCurrency(item.price)}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Prep time */}
        {item.prepTime && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{item.prepTime} min</span>
          </div>
        )}

        {/* Extras indicator */}
        {item.extras.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            + {item.extras.length} opcionais disponíveis
          </p>
        )}
      </div>
    </motion.button>
  );
}

