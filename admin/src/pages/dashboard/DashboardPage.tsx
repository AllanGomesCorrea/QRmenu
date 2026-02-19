import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  DollarSign, 
  Users, 
  ChefHat,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useOrders, useTodayStats, Order } from '@/hooks/useOrders';
import { useTableStats } from '@/hooks/useTables';

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

const statusColors: Record<string, string> = {
  'PENDING': 'bg-blue-100 text-blue-800',
  'CONFIRMED': 'bg-indigo-100 text-indigo-800',
  'PREPARING': 'bg-amber-100 text-amber-800',
  'READY': 'bg-green-100 text-green-800',
  'PAID': 'bg-emerald-100 text-emerald-800',
  'CANCELLED': 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  'PENDING': 'Pendente',
  'CONFIRMED': 'Confirmado',
  'PREPARING': 'Preparando',
  'READY': 'Pronto',
  'PAID': 'Pago',
  'CANCELLED': 'Cancelado',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getTimeAgo(date: string): string {
  const now = new Date();
  const created = new Date(date);
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  
  return `${Math.floor(diffHours / 24)}d`;
}

interface ExpandableOrderRowProps {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExpandableOrderRow({ order, isExpanded, onToggle }: ExpandableOrderRowProps) {
  return (
    <>
      <motion.tr
        onClick={onToggle}
        className={`border-b border-gray-50 cursor-pointer transition-colors ${
          isExpanded ? 'bg-primary-50' : 'hover:bg-gray-50'
        }`}
        whileHover={{ backgroundColor: isExpanded ? undefined : 'rgba(0,0,0,0.02)' }}
      >
        <td className="py-4 px-4 font-medium text-gray-900">
          #{String(order.orderNumber).padStart(4, '0')}
        </td>
        <td className="py-4 px-4 text-gray-600">
          Mesa {order.table?.number}
          {order.table?.name && <span className="text-gray-400 ml-1">({order.table.name})</span>}
        </td>
        <td className="py-4 px-4">
          <button 
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors group"
          >
            <span className="font-medium">{order.items?.length || 0}</span>
            <Package className="w-4 h-4" />
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
            </motion.div>
          </button>
        </td>
        <td className="py-4 px-4">
          <span
            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
              statusColors[order.status]
            }`}
          >
            {statusLabels[order.status]}
          </span>
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <Clock className="w-4 h-4" />
            {getTimeAgo(order.createdAt)}
          </div>
        </td>
        <td className="py-4 px-4 font-bold text-gray-900">
          {formatCurrency(order.total)}
        </td>
      </motion.tr>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <td colSpan={6} className="bg-gradient-to-b from-primary-50 to-white border-b border-primary-100">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-primary-500" />
                  <span className="font-semibold text-gray-700">Itens do Pedido</span>
                  {order.session?.customerName && (
                    <span className="text-gray-400 text-sm ml-auto">
                      Cliente: {order.session.customerName}
                    </span>
                  )}
                </div>
                
                <div className="grid gap-2">
                  {order.items?.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-bold text-sm">
                          {item.quantity}x
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.notes && (
                            <p className="text-sm text-gray-500 italic">"{item.notes}"</p>
                          )}
                          {item.extras && item.extras.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {item.extras.map((extra, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  + {extra.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.price)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
                          {statusLabels[item.status]}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {order.notes && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Observação:</span>
                    </div>
                    <p className="text-sm text-amber-600 mt-1">{order.notes}</p>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Subtotal: {formatCurrency(order.subtotal)}
                    {order.discount > 0 && (
                      <span className="text-green-600 ml-2">
                        - {formatCurrency(order.discount)} desconto
                      </span>
                    )}
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    Total: {formatCurrency(order.total)}
                  </span>
                </div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

const PAGE_SIZE_OPTIONS = [10, 50, 100];

export default function DashboardPage() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: ordersData, isLoading: loadingOrders, refetch: refetchOrders } = useOrders({
    limit: pageSize,
    offset: currentPage * pageSize,
  });
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useTodayStats();
  const { data: tableStats, refetch: refetchTables } = useTableStats();

  const totalOrders = ordersData?.total || 0;
  const totalPages = Math.ceil(totalOrders / pageSize);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchOrders(), refetchStats(), refetchTables()]);
    setIsRefreshing(false);
  }, [refetchOrders, refetchStats, refetchTables]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const statCards = [
    {
      title: 'Pedidos Hoje',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: 'Receita do Dia',
      value: formatCurrency(stats?.revenue || 0),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Mesas Ocupadas',
      value: `${tableStats?.occupied || 0}/${tableStats?.total || 0}`,
      icon: Users,
      color: 'bg-primary-500',
    },
    {
      title: 'Em Preparo',
      value: stats?.preparingOrders || 0,
      icon: ChefHat,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600">Visão geral do seu restaurante</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Atualizar dados"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Atualizar</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loadingStats ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-heading font-semibold text-gray-900">
              Pedidos Recentes
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Clique em um pedido para ver os itens
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Exibir:</span>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => handlePageSizeChange(size)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  pageSize === size
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {loadingOrders ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : ordersData?.orders && ordersData.orders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Pedido
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Mesa
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Itens
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Tempo
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ordersData.orders.map((order) => (
                    <ExpandableOrderRow
                      key={order.id}
                      order={order}
                      isExpanded={expandedOrder === order.id}
                      onToggle={() => toggleOrder(order.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Mostrando {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, totalOrders)} de {totalOrders} pedidos
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 px-2">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum pedido recente</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
