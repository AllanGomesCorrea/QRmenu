import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Table } from '@/hooks/useTables';

const tableSchema = z.object({
  number: z.number().min(1, 'Número da mesa é obrigatório'),
  name: z.string().optional(),
  capacity: z.number().min(1).optional(),
  section: z.string().optional(),
});

type TableForm = z.infer<typeof tableSchema>;

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TableForm) => void;
  table: Table | null;
  isLoading: boolean;
}

export default function TableModal({
  isOpen,
  onClose,
  onSubmit,
  table,
  isLoading,
}: TableModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TableForm>({
    resolver: zodResolver(tableSchema),
  });

  useEffect(() => {
    if (table) {
      reset({
        number: table.number,
        name: table.name || '',
        capacity: table.capacity || 4,
        section: table.section || '',
      });
    } else {
      reset({
        number: undefined,
        name: '',
        capacity: 4,
        section: '',
      });
    }
  }, [table, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {table ? 'Editar mesa' : 'Nova mesa'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número da mesa *
            </label>
            <input
              type="number"
              {...register('number', { valueAsNumber: true })}
              className="input"
              disabled={!!table}
              placeholder="1"
            />
            {errors.number && (
              <p className="mt-1 text-sm text-red-500">{errors.number.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome/Identificação
            </label>
            <input
              type="text"
              {...register('name')}
              className="input"
              placeholder="Ex: Varanda 1, Mesa VIP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidade (pessoas)
            </label>
            <input
              type="number"
              {...register('capacity', { valueAsNumber: true })}
              className="input"
              placeholder="4"
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seção
            </label>
            <input
              type="text"
              {...register('section')}
              className="input"
              placeholder="Ex: Salão Principal, Área Externa"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Salvando...' : table ? 'Salvar' : 'Criar mesa'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

