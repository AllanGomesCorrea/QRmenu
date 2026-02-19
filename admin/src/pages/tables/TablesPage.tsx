import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Grid3X3,
  Users,
  QrCode,
  Power,
  PowerOff,
  Trash2,
  Edit,
  Download,
  MoreVertical,
  RefreshCw,
  Receipt,
  AlertTriangle,
  Unlock,
} from 'lucide-react';
import {
  useTables,
  useTableStats,
  useCreateTable,
  useCreateBulkTables,
  useDeleteTable,
  useActivateTable,
  useCloseTable,
  useForceReleaseTable,
  useReleaseTable,
  useGetQRCode,
  Table,
} from '@/hooks/useTables';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/stores/authStore';
import TableModal from './TableModal';
import QRCodeModal from './QRCodeModal';

const statusColors = {
  INACTIVE: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  OCCUPIED: 'bg-amber-100 text-amber-700',
  BILL_REQUESTED: 'bg-purple-100 text-purple-700',
  CLOSED: 'bg-red-100 text-red-700',
};

const statusLabels = {
  INACTIVE: 'Inativa',
  ACTIVE: 'Disponível',
  OCCUPIED: 'Ocupada',
  BILL_REQUESTED: 'Pedindo conta',
  CLOSED: 'Fechada',
};

export default function TablesPage() {
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<{ table: Table; qrImage: string } | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data: tables = [], isLoading } = useTables();
  const { data: stats } = useTableStats();
  const { canManage } = usePermissions();
  
  const canManageTables = canManage('tables');
  
  const userRole = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = useAuthStore((s) => s.user?.isSuperAdmin);
  const isAdminRole = userRole === 'ADMIN' || isSuperAdmin;

  const createTable = useCreateTable();
  const createBulk = useCreateBulkTables();
  const deleteTable = useDeleteTable();
  const activateTable = useActivateTable();
  const closeTable = useCloseTable();
  const releaseTable = useReleaseTable();
  const forceReleaseTable = useForceReleaseTable();
  const getQRCode = useGetQRCode();

  // Group tables by section
  const tablesBySection = tables.reduce((acc, table) => {
    const section = table.section || 'Sem seção';
    if (!acc[section]) acc[section] = [];
    acc[section].push(table);
    return acc;
  }, {} as Record<string, Table[]>);

  const handleCreateTable = async (data: any) => {
    await createTable.mutateAsync(data);
    setShowModal(false);
    setEditingTable(null);
  };

  const handleCreateBulk = async (count: number, section?: string) => {
    await createBulk.mutateAsync({ count, section });
    setShowBulkModal(false);
  };

  const handleShowQR = async (table: Table) => {
    const result = await getQRCode.mutateAsync({ id: table.id, format: 'dataurl' });
    setShowQRModal({ table, qrImage: result.dataUrl });
    setMenuOpen(null);
  };

  const handleActivate = async (table: Table) => {
    await activateTable.mutateAsync(table.id);
    setMenuOpen(null);
  };

  const handleClose = async (table: Table) => {
    await closeTable.mutateAsync(table.id);
    setMenuOpen(null);
  };

  const handleRelease = async (table: Table) => {
    try {
      await releaseTable.mutateAsync(table.id);
    } catch {
      // error handled by mutation
    }
    setMenuOpen(null);
  };

  const handleForceRelease = async (table: Table) => {
    if (confirm(`⚠️ Forçar liberação da Mesa ${table.number}?\n\nIsso irá:\n• Cancelar TODOS os pedidos pendentes\n• Encerrar todas as sessões\n• Liberar a mesa\n\nEssa ação não pode ser desfeita.`)) {
      try {
        await forceReleaseTable.mutateAsync(table.id);
      } catch {
        // error handled by mutation
      }
    }
    setMenuOpen(null);
  };

  const handleDelete = async (table: Table) => {
    if (confirm(`Deseja excluir a mesa ${table.number}?`)) {
      await deleteTable.mutateAsync(table.id);
    }
    setMenuOpen(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
          <p className="text-gray-500 mt-1">Gerencie as mesas do seu estabelecimento</p>
        </div>
        {canManageTables && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="btn-outline text-sm"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              Criar múltiplas
            </button>
            <button
              onClick={() => {
                setEditingTable(null);
                setShowModal(true);
              }}
              className="btn-primary text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova mesa
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="text-3xl font-bold text-emerald-700">{stats.active}</div>
            <div className="text-sm text-emerald-600">Disponíveis</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="text-3xl font-bold text-amber-700">{stats.occupied}</div>
            <div className="text-sm text-amber-600">Ocupadas</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="text-3xl font-bold text-purple-700">{stats.billRequested}</div>
            <div className="text-sm text-purple-600">Pedindo conta</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="text-3xl font-bold text-gray-700">{stats.inactive}</div>
            <div className="text-sm text-gray-500">Inativas</div>
          </div>
        </div>
      )}

      {/* Tables Grid by Section */}
      {Object.keys(tablesBySection).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Grid3X3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma mesa cadastrada
          </h3>
          <p className="text-gray-500 mb-4">
            Comece criando mesas para seu estabelecimento
          </p>
          {canManageTables && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira mesa
            </button>
          )}
        </div>
      ) : (
        Object.entries(tablesBySection).map(([section, sectionTables]) => (
          <div key={section} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{section}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {sectionTables.map((table) => (
                <motion.div
                  key={table.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Table Header */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          #{table.number}
                        </div>
                        {table.name && (
                          <div className="text-sm text-gray-500">{table.name}</div>
                        )}
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === table.id ? null : table.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        
                        <AnimatePresence>
                          {menuOpen === table.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20 min-w-[160px]"
                            >
                              <button
                                onClick={() => handleShowQR(table)}
                                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                              >
                                <QrCode className="w-4 h-4" />
                                Ver QR Code
                              </button>
                              {(table.status === 'INACTIVE' || table.status === 'CLOSED') && (
                                <button
                                  onClick={() => handleActivate(table)}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-emerald-600"
                                >
                                  <Power className="w-4 h-4" />
                                  Ativar
                                </button>
                              )}
                              {table.status === 'ACTIVE' && (
                                <button
                                  onClick={() => handleClose(table)}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-amber-600"
                                >
                                  <PowerOff className="w-4 h-4" />
                                  Fechar mesa
                                </button>
                              )}
                              {canManageTables && (table.status === 'ACTIVE' || table.status === 'INACTIVE') && (
                                <button
                                  onClick={() => {
                                    setEditingTable(table);
                                    setShowModal(true);
                                    setMenuOpen(null);
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  Editar
                                </button>
                              )}
                              {(table.status === 'OCCUPIED' || table.status === 'BILL_REQUESTED') && (
                                <button
                                  onClick={() => handleRelease(table)}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                                >
                                  <Unlock className="w-4 h-4" />
                                  Liberar mesa
                                </button>
                              )}
                              {isAdminRole && (table.status === 'OCCUPIED' || table.status === 'BILL_REQUESTED') && (
                                <button
                                  onClick={() => handleForceRelease(table)}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                  Forçar liberação
                                </button>
                              )}
                              {canManageTables && table.status !== 'OCCUPIED' && table.status !== 'BILL_REQUESTED' && (
                                <button
                                  onClick={() => handleDelete(table)}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Excluir
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[table.status]}`}>
                      {table.status === 'BILL_REQUESTED' && (
                        <Receipt className="w-3 h-3 mr-1" />
                      )}
                      {statusLabels[table.status]}
                    </div>

                    {/* Sessions count - altura fixa para manter alinhamento */}
                    <div className="h-6 mt-2">
                      {table._count && table._count.sessions > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users className="w-4 h-4" />
                          {table._count.sessions} pessoa(s)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table Footer */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => handleShowQR(table)}
                      className="w-full flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create/Edit Table Modal */}
      <TableModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTable(null);
        }}
        onSubmit={handleCreateTable}
        table={editingTable}
        isLoading={createTable.isPending}
      />

      {/* Bulk Create Modal */}
      <BulkCreateModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSubmit={handleCreateBulk}
        isLoading={createBulk.isPending}
      />

      {/* QR Code Modal */}
      {showQRModal && (
        <QRCodeModal
          isOpen={!!showQRModal}
          onClose={() => setShowQRModal(null)}
          table={showQRModal.table}
          qrImage={showQRModal.qrImage}
        />
      )}
    </div>
  );
}

// Bulk Create Modal Component
function BulkCreateModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (count: number, section?: string) => void;
  isLoading: boolean;
}) {
  const [count, setCount] = useState(5);
  const [section, setSection] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Criar múltiplas mesas
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantidade de mesas
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seção (opcional)
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="input"
              placeholder="Ex: Salão Principal, Varanda"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-outline">
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(count, section || undefined)}
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Criando...' : `Criar ${count} mesas`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

