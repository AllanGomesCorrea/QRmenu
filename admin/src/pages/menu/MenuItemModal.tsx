import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCreateMenuItem, useUpdateMenuItem } from '@/hooks/useMenu';
import type { MenuCategory, MenuItem } from '@/types';

const menuItemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  imageUrl: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isVegetarian: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  prepTime: z.number().optional(),
  extras: z.array(z.object({
    name: z.string().min(1, 'Nome do adicional é obrigatório'),
    price: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
    isRequired: z.boolean().default(false),
  })).optional(),
});

type MenuItemForm = z.infer<typeof menuItemSchema>;

interface Props {
  item?: MenuItem;
  categoryId?: string;
  categories: MenuCategory[];
  onClose: () => void;
}

export default function MenuItemModal({ item, categoryId, categories, onClose }: Props) {
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const isEditing = !!item;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MenuItemForm>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      price: item?.price || 0,
      imageUrl: item?.imageUrl || '',
      categoryId: item?.categoryId || categoryId || '',
      isAvailable: item?.isAvailable ?? true,
      isFeatured: item?.isFeatured ?? false,
      isVegan: item?.isVegan ?? false,
      isVegetarian: item?.isVegetarian ?? false,
      isGlutenFree: item?.isGlutenFree ?? false,
      isSpicy: item?.isSpicy ?? false,
      prepTime: item?.prepTime || undefined,
      extras: item?.extras || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'extras',
  });

  const onSubmit = async (data: MenuItemForm) => {
    try {
      if (isEditing) {
        await updateItem.mutateAsync({ id: item.id, data });
      } else {
        await createItem.mutateAsync(data);
      }
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao salvar item');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-100 z-10">
          <h2 className="font-heading text-lg font-bold">
            {isEditing ? 'Editar Item' : 'Novo Item'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                {...register('name')}
                className="input"
                placeholder="Ex: Filé Mignon ao Molho Madeira"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-error-500">{errors.name.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                {...register('description')}
                className="input resize-none"
                rows={2}
                placeholder="Descrição do item"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="input"
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-error-500">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select {...register('categoryId')} className="input">
                <option value="">Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-error-500">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo de Preparo (min)
              </label>
              <input
                type="number"
                {...register('prepTime', { valueAsNumber: true })}
                className="input"
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Imagem
              </label>
              <input
                type="url"
                {...register('imageUrl')}
                className="input"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Flags */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Características</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isAvailable')}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Disponível</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isFeatured')}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Destaque</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isVegan')}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Vegano</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isVegetarian')}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Vegetariano</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isGlutenFree')}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Sem Glúten</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isSpicy')}
                  className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Picante</span>
              </label>
            </div>
          </div>

          {/* Extras */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Adicionais</h3>
              <button
                type="button"
                onClick={() => append({ name: '', price: 0, isRequired: false })}
                className="text-sm text-primary-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>

            {fields.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                Nenhum adicional cadastrado
              </p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        {...register(`extras.${index}.name`)}
                        className="input"
                        placeholder="Nome do adicional"
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        {...register(`extras.${index}.price`, { valueAsNumber: true })}
                        className="input"
                        placeholder="Preço"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-error-500 hover:bg-error-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isEditing ? (
                'Salvar'
              ) : (
                'Criar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

