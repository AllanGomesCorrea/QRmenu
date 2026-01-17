import { MenuCategory as MenuCategoryType } from '@/types';
import MenuItem from './MenuItem';

interface Props {
  category: MenuCategoryType;
  onItemClick: (itemId: string) => void;
}

export default function MenuCategory({ category, onItemClick }: Props) {
  if (category.items.length === 0) return null;

  return (
    <section id={`category-${category.id}`} className="mb-8">
      <div className="sticky top-0 bg-gray-50 py-4 z-10">
        <h2 className="font-heading text-xl font-bold text-gray-900">
          {category.name}
        </h2>
        {category.description && (
          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
        )}
      </div>

      <div className="grid gap-4">
        {category.items.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            onClick={() => onItemClick(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

