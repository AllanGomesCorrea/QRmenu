import { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Loader2,
  Flame,
  Leaf,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';
import { 
  useCategories, 
  useMenuItems, 
  useDeleteCategory,
  useDeleteMenuItem,
  useToggleItemAvailability,
} from '@/hooks/useMenu';
import { usePermissions } from '@/hooks/usePermissions';
import type { MenuCategory, MenuItem } from '@/types';
import CategoryModal from './CategoryModal';
import MenuItemModal from './MenuItemModal';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function MenuPage() {
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: items, isLoading: loadingItems } = useMenuItems();
  
  const deleteCategory = useDeleteCategory();
  const deleteItem = useDeleteMenuItem();
  const toggleAvailability = useToggleItemAvailability();
  
  const { canManage } = usePermissions();
  const canManageMenu = canManage('menu');

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    category?: MenuCategory;
  }>({ isOpen: false });
  const [itemModal, setItemModal] = useState<{
    isOpen: boolean;
    item?: MenuItem;
    categoryId?: string;
  }>({ isOpen: false });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteCategory.mutateAsync(id);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Erro ao excluir categoria');
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await deleteItem.mutateAsync(id);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Erro ao excluir item');
      }
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      await toggleAvailability.mutateAsync(id);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao alterar disponibilidade');
    }
  };

  const getItemsByCategory = (categoryId: string) => {
    return items?.filter((item) => item.categoryId === categoryId) || [];
  };

  if (loadingCategories || loadingItems) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Cardápio
          </h1>
          <p className="text-gray-600">
            {canManageMenu ? 'Gerencie categorias e itens do cardápio' : 'Visualize o cardápio'}
          </p>
        </div>
        {canManageMenu && (
          <button
            onClick={() => setCategoryModal({ isOpen: true })}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Categoria
          </button>
        )}
      </div>

      {/* Categories list */}
      <div className="space-y-4">
        {categories?.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">Nenhuma categoria cadastrada</p>
            {canManageMenu && (
              <button
                onClick={() => setCategoryModal({ isOpen: true })}
                className="btn-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeira Categoria
              </button>
            )}
          </div>
        ) : (
          categories?.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            const categoryItems = getItemsByCategory(category.id);

            return (
              <div key={category.id} className="card p-0 overflow-hidden">
                {/* Category header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {categoryItems.length} itens
                      </p>
                    </div>
                  </div>

                  {canManageMenu && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setItemModal({ isOpen: true, categoryId: category.id })}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                        title="Adicionar item"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCategoryModal({ isOpen: true, category })}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Editar categoria"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg"
                        title="Excluir categoria"
                        disabled={categoryItems.length > 0}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Category items */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {categoryItems.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <p className="mb-2">Nenhum item nesta categoria</p>
                        {canManageMenu && (
                          <button
                            onClick={() => setItemModal({ isOpen: true, categoryId: category.id })}
                            className="text-primary-600 hover:underline text-sm"
                          >
                            + Adicionar primeiro item
                          </button>
                        )}
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                              Item
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                              Preço
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                              Tags
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                              Status
                            </th>
                            {canManageMenu && (
                              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                                Ações
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {categoryItems.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-gray-50 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-10 h-10 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                      <span>🍽️</span>
                                    </div>
                                  )}
                                  <span className="font-medium text-gray-900">
                                    {item.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {formatCurrency(item.price)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1">
                                  {item.isFeatured && (
                                    <Star className="w-4 h-4 text-primary-500" />
                                  )}
                                  {item.isVegan && (
                                    <Leaf className="w-4 h-4 text-green-500" />
                                  )}
                                  {item.isSpicy && (
                                    <Flame className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {canManageMenu ? (
                                  <button
                                    onClick={() => handleToggleAvailability(item.id)}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                      item.isAvailable
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {item.isAvailable ? (
                                      <>
                                        <Eye className="w-3 h-3" /> Disponível
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="w-3 h-3" /> Indisponível
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    item.isAvailable
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {item.isAvailable ? (
                                      <>
                                        <Eye className="w-3 h-3" /> Disponível
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="w-3 h-3" /> Indisponível
                                      </>
                                    )}
                                  </span>
                                )}
                              </td>
                              {canManageMenu && (
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => setItemModal({ isOpen: true, item })}
                                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {categoryModal.isOpen && (
        <CategoryModal
          category={categoryModal.category}
          onClose={() => setCategoryModal({ isOpen: false })}
        />
      )}

      {itemModal.isOpen && (
        <MenuItemModal
          item={itemModal.item}
          categoryId={itemModal.categoryId}
          categories={categories || []}
          onClose={() => setItemModal({ isOpen: false })}
        />
      )}
    </div>
  );
}

