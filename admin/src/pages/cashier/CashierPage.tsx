import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, 
  DollarSign, 
  Clock,
  CheckCircle,
  Search,
  ChevronDown,
  Package,
  User,
  Phone,
  Loader2,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useOrders, Order } from '@/hooks/useOrders';
import { useTables } from '@/hooks/useTables';
import api from '@/services/api';

const orderStatusColors: Record<string, string> = {
  'PENDING': 'bg-blue-100 text-blue-700',
  'CONFIRMED': 'bg-indigo-100 text-indigo-700',
  'PREPARING': 'bg-amber-100 text-amber-700',
  'READY': 'bg-emerald-100 text-emerald-700',
  'DELIVERED': 'bg-gray-100 text-gray-700',
  'CANCELLED': 'bg-red-100 text-red-700',
};

const orderStatusLabels: Record<string, string> = {
  'PENDING': 'Pendente',
  'CONFIRMED': 'Confirmado',
  'PREPARING': 'Preparando',
  'READY': 'Pronto',
  'DELIVERED': 'Entregue',
  'CANCELLED': 'Cancelado',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Group orders by table
interface TableBill {
  tableId: string;
  tableNumber: number;
  tableName?: string;
  orders: Order[];
  totalAmount: number;
  itemCount: number;
  status: 'open' | 'ready' | 'paid';
  firstOrderTime: string;
}

interface ExpandableBillRowProps {
  bill: TableBill;
  isExpanded: boolean;
  onToggle: () => void;
  canManage: boolean;
  onPayment: (tableId: string) => void;
  isProcessing: boolean;
}

function ExpandableBillRow({ bill, isExpanded, onToggle, canManage, onPayment, isProcessing }: ExpandableBillRowProps) {
  const statusColors = {
    open: 'bg-amber-100 text-amber-700 border-amber-200',
    ready: 'bg-green-100 text-green-700 border-green-200',
    paid: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const statusLabels = {
    open: 'Em aberto',
    ready: 'Pronta para pagar',
    paid: 'Paga',
  };

  return (
    <>
      <motion.tr
        onClick={onToggle}
        className={`border-b border-gray-50 cursor-pointer transition-all ${
          isExpanded ? 'bg-gradient-to-r from-primary-50 to-white' : 'hover:bg-gray-50'
        }`}
        whileHover={{ scale: isExpanded ? 1 : 1.002 }}
      >
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              bill.status === 'open' ? 'bg-amber-100 text-amber-700' :
              bill.status === 'ready' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-500'
            }`}>
              {bill.tableNumber}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Mesa {bill.tableNumber}</p>
              {bill.tableName && (
                <p className="text-sm text-gray-500">{bill.tableName}</p>
              )}
            </div>
          </div>
        </td>
        <td className="py-4 px-4">
          <button 
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors group"
          >
            <span className="font-medium">{bill.orders.length}</span>
            <span className="text-gray-400">pedido(s)</span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
            </motion.div>
          </button>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="w-4 h-4" />
            <span>{bill.itemCount} itens</span>
          </div>
        </td>
        <td className="py-4 px-4">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(bill.totalAmount)}
          </span>
        </td>
        <td className="py-4 px-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${statusColors[bill.status]}`}>
            {bill.status === 'open' && <Clock className="w-3 h-3" />}
            {bill.status === 'ready' && <CheckCircle className="w-3 h-3" />}
            {statusLabels[bill.status]}
          </span>
        </td>
        <td className="py-4 px-4 text-gray-500 text-sm">
          {formatTime(bill.firstOrderTime)}
        </td>
      </motion.tr>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <td colSpan={6} className="bg-gradient-to-b from-primary-50 via-white to-white border-b-2 border-primary-100">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6"
              >
                {/* Customer Info */}
                {bill.orders[0]?.session?.customerName && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{bill.orders[0].session.customerName}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {bill.orders[0].session.customerPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders List */}
                <div className="space-y-4">
                  {bill.orders.map((order, orderIndex) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: orderIndex * 0.1 }}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900">
                            Pedido #{String(order.orderNumber).padStart(4, '0')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${orderStatusColors[order.status]}`}>
                            {orderStatusLabels[order.status]}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatTime(order.createdAt)}
                        </span>
                      </div>

                      {/* Order Items */}
                      <div className="p-4">
                        <div className="space-y-2">
                          {order.items?.map((item, itemIndex) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: orderIndex * 0.1 + itemIndex * 0.05 }}
                              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-sm font-bold">
                                  {item.quantity}x
                                </span>
                                <div>
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  {item.extras && item.extras.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.extras.map((extra, i) => (
                                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                          + {extra.name} ({formatCurrency(extra.price)})
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {item.notes && (
                                    <p className="text-xs text-gray-500 italic mt-1">"{item.notes}"</p>
                                  )}
                                </div>
                              </div>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(item.price)}
                              </span>
                            </motion.div>
                          ))}
                        </div>

                        {/* Order Total */}
                        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-gray-600">Subtotal do pedido</span>
                          <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Bill Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 pt-4 border-t-2 border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">Total da Mesa {bill.tableNumber}</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(bill.totalAmount)}</span>
                  </div>

                  {canManage && bill.status !== 'paid' && (
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPayment(bill.tableId);
                        }}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Confirmar Pagamento
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {bill.status === 'paid' && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-2 text-green-600 bg-green-50 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium text-sm">Conta Paga - Mesa Liberada</span>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default function CashierPage() {
  const { canManage } = usePermissions();
  const [filter, setFilter] = useState<'all' | 'open' | 'ready' | 'paid'>('open');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [processingTableId, setProcessingTableId] = useState<string | null>(null);
  const [paidTables, setPaidTables] = useState<Set<string>>(new Set());

  const { data: ordersData, isLoading: loadingOrders, refetch: refetchOrders } = useOrders({ limit: 100 });
  const { data: tables, refetch: refetchTables } = useTables();

  // Group orders by table to create bills
  const tableBills = useMemo<TableBill[]>(() => {
    if (!ordersData?.orders || !tables) return [];

    const billsMap = new Map<string, TableBill>();

    ordersData.orders.forEach((order) => {
      if (!order.table?.id) return;
      
      const tableId = order.table.id;
      const existing = billsMap.get(tableId);

      const orderTotal = typeof order.total === 'number' ? order.total : (parseFloat(String(order.total)) || 0);
      
      if (existing) {
        existing.orders.push(order);
        existing.totalAmount += orderTotal;
        existing.itemCount += order.items?.length || 0;
        if (new Date(order.createdAt) < new Date(existing.firstOrderTime)) {
          existing.firstOrderTime = order.createdAt;
        }
        // Update status based on orders (unless already marked as paid)
        if (paidTables.has(tableId)) {
          existing.status = 'paid';
        } else if (order.status === 'DELIVERED') {
          existing.status = 'ready';
        }
      } else {
        billsMap.set(tableId, {
          tableId,
          tableNumber: order.table.number,
          tableName: order.table.name,
          orders: [order],
          totalAmount: orderTotal,
          itemCount: order.items?.length || 0,
          status: paidTables.has(tableId) ? 'paid' : (order.status === 'DELIVERED' ? 'ready' : 'open'),
          firstOrderTime: order.createdAt,
        });
      }
    });

    return Array.from(billsMap.values()).sort((a, b) => 
      new Date(b.firstOrderTime).getTime() - new Date(a.firstOrderTime).getTime()
    );
  }, [ordersData, tables, paidTables]);

  const filteredBills = useMemo(() => {
    return tableBills.filter(bill => {
      const matchesFilter = filter === 'all' || bill.status === filter;
      const matchesSearch = searchTerm === '' || 
        bill.tableNumber.toString().includes(searchTerm) ||
        bill.tableName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [tableBills, filter, searchTerm]);

  const stats = useMemo(() => ({
    pending: tableBills.filter(b => b.status === 'open').length,
    totalPending: tableBills.filter(b => b.status === 'open').reduce((acc, b) => acc + b.totalAmount, 0),
    paidToday: tableBills.filter(b => b.status === 'paid').reduce((acc, b) => acc + b.totalAmount, 0),
  }), [tableBills]);

  const handlePayment = async (tableId: string) => {
    setProcessingTableId(tableId);
    try {
      // Call API to release table (ends session and sets status to ACTIVE)
      await api.post(`/tables/${tableId}/release`);
      
      // Mark table as paid locally
      setPaidTables(prev => new Set(prev).add(tableId));
      
      // Close expanded view
      setExpandedBill(null);
      
      // Refetch data
      await Promise.all([refetchOrders(), refetchTables()]);
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      alert(error.response?.data?.message || 'Erro ao processar pagamento');
    } finally {
      setProcessingTableId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Caixa
          </h1>
          <p className="text-gray-600">Gerenciamento de contas e pagamentos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contas Abertas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor em Aberto</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalPending)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Recebido Hoje</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.paidToday)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número da mesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'Todas', color: 'gray-900' },
            { id: 'open', label: 'Abertas', color: 'amber-500' },
            { id: 'ready', label: 'Prontas', color: 'green-500' },
            { id: 'paid', label: 'Pagas', color: 'gray-500' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f.id 
                  ? `bg-${f.color} text-white` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={filter === f.id ? {
                backgroundColor: f.id === 'all' ? '#111827' : 
                  f.id === 'open' ? '#f59e0b' : 
                  f.id === 'ready' ? '#22c55e' : '#6b7280'
              } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Bills List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Clique em uma conta para ver os detalhes e processar pagamento
          </p>
        </div>

        {loadingOrders ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filteredBills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Mesa</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Pedidos</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Itens</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Abertura</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <ExpandableBillRow
                    key={bill.tableId}
                    bill={bill}
                    isExpanded={expandedBill === bill.tableId}
                    onToggle={() => setExpandedBill(expandedBill === bill.tableId ? null : bill.tableId)}
                    canManage={canManage('cashier')}
                    onPayment={handlePayment}
                    isProcessing={processingTableId === bill.tableId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm ? 'Nenhuma conta encontrada' : 'Nenhuma conta em aberto'}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
