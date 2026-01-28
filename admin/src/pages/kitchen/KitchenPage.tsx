import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChefHat,
  CheckCircle,
  Bell,
  RefreshCw,
  Volume2,
  VolumeX,
  Play,
  Truck,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react';
import {
  useKitchenOrders,
  useUpdateOrderStatus,
  useCancelOrder,
  Order,
} from '@/hooks/useOrders';
import { useSocket } from '@/hooks/useSocket';
import { usePermissions } from '@/hooks/usePermissions';

export default function KitchenPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const { data: orders = [], isLoading, refetch } = useKitchenOrders();
  const updateOrderStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();
  const { joinKitchen, leaveKitchen } = useSocket();
  const { role } = usePermissions();
  
  // Only ADMIN and MANAGER can cancel orders
  const canCancelOrders = role === 'ADMIN' || role === 'MANAGER' || role === 'SUPER_ADMIN';

  // Join kitchen room on mount
  useEffect(() => {
    joinKitchen();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      leaveKitchen();
    };
  }, [joinKitchen, leaveKitchen]);

  // Group orders by status
  const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  // Aceitar pedido - vai DIRETO para PREPARING
  const handleAcceptOrder = async (order: Order) => {
    await updateOrderStatus.mutateAsync({ orderId: order.id, status: 'PREPARING' });
  };

  // Marcar como Pronto (vai para READY)
  const handleMarkReady = async (order: Order) => {
    await updateOrderStatus.mutateAsync({ orderId: order.id, status: 'READY' });
  };

  // Cancelar pedido (só ADMIN/MANAGER)
  const handleCancelOrder = async (order: Order) => {
    if (!canCancelOrders) return;
    
    const reason = window.prompt('Motivo do cancelamento:');
    if (!reason) return;
    
    setCancelingOrderId(order.id);
    try {
      await cancelOrder.mutateAsync({ orderId: order.id, reason });
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
    } finally {
      setCancelingOrderId(null);
    }
  };

  const getTimeSinceOrder = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h${minutes % 60}m`;
  };

  // Calculate stats
  const totalPending = pendingOrders.length;
  const totalPreparing = preparingOrders.length;
  const totalReady = readyOrders.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ChefHat className="w-7 h-7 text-primary-500" />
          <h1 className="text-xl font-bold text-gray-900">Cozinha</h1>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              {totalPending} novos
            </span>
            <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              {totalPreparing} preparando
            </span>
            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {totalReady} prontos
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg ${soundEnabled ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={() => refetch()}
            className="btn-outline text-sm py-1.5 px-3"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
        {/* Novos Pedidos */}
        <div className="flex flex-col bg-amber-50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-amber-100 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-amber-800">Novos Pedidos</h2>
            </div>
            {totalPending > 0 && (
              <motion.span 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold"
              >
                {totalPending}
              </motion.span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-amber-400 p-4">
                <Bell className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm text-center">Aguardando pedidos...</p>
              </div>
            ) : (
              <div className="divide-y divide-amber-100">
                {pendingOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    type="pending"
                    onAction={() => handleAcceptOrder(order)}
                    actionLabel="Aceitar"
                    actionIcon={<Play className="w-3.5 h-3.5" />}
                    isLoading={updateOrderStatus.isPending}
                    getTimeSinceOrder={getTimeSinceOrder}
                    canCancel={canCancelOrders}
                    onCancel={() => handleCancelOrder(order)}
                    isCanceling={cancelingOrderId === order.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Em Preparo */}
        <div className="flex flex-col bg-purple-50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-purple-100 border-b border-purple-200">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-purple-800">Em Preparo</h2>
            </div>
            {totalPreparing > 0 && (
              <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {totalPreparing}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {preparingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-purple-400 p-4">
                <ChefHat className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm text-center">Nenhum pedido em preparo</p>
              </div>
            ) : (
              <div className="divide-y divide-purple-100">
                {preparingOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    type="preparing"
                    onAction={() => handleMarkReady(order)}
                    actionLabel="Pronto!"
                    actionIcon={<CheckCircle className="w-3.5 h-3.5" />}
                    isLoading={updateOrderStatus.isPending}
                    getTimeSinceOrder={getTimeSinceOrder}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Prontos para Entrega */}
        <div className="flex flex-col bg-green-50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-green-100 border-b border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-green-800">Prontos</h2>
            </div>
            {totalReady > 0 && (
              <motion.span 
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold"
              >
                {totalReady}
              </motion.span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {readyOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-green-400 p-4">
                <Truck className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm text-center">Nenhum pedido pronto</p>
              </div>
            ) : (
              <div className="divide-y divide-green-100">
                {readyOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    type="ready"
                    showAction={false}
                    getTimeSinceOrder={getTimeSinceOrder}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Row Component - Format tabular
function OrderRow({
  order,
  type,
  onAction,
  actionLabel,
  actionIcon,
  isLoading,
  getTimeSinceOrder,
  showAction = true,
  canCancel = false,
  onCancel,
  isCanceling = false,
}: {
  order: Order;
  type: 'pending' | 'preparing' | 'ready';
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  isLoading?: boolean;
  getTimeSinceOrder: (date: string) => string;
  showAction?: boolean;
  canCancel?: boolean;
  onCancel?: () => void;
  isCanceling?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  
  const colors = {
    pending: {
      bg: 'bg-amber-500',
      hoverBg: 'hover:bg-amber-600',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    preparing: {
      bg: 'bg-purple-500',
      hoverBg: 'hover:bg-purple-600',
      text: 'text-purple-700',
      border: 'border-purple-200',
    },
    ready: {
      bg: 'bg-green-500',
      hoverBg: 'hover:bg-green-600',
      text: 'text-green-700',
      border: 'border-green-200',
    },
  };

  const c = colors[type];
  const itemCount = order.items?.length || 0;

  return (
    <div className="bg-white">
      {/* Main Row */}
      <div className="flex items-center gap-2 p-2 hover:bg-gray-50">
        {/* Order Number & Table */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-gray-900">
              #{String(order.orderNumber).padStart(3, '0')}
            </span>
            <span className={`px-1.5 py-0.5 ${c.bg} text-white rounded text-xs font-bold`}>
              M{order.table?.number}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {getTimeSinceOrder(order.createdAt)}
            </span>
            <span>•</span>
            <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
          </div>
          {/* Customer name */}
          {order.session?.customerName && (
            <div className="text-xs text-primary-600 font-medium mt-0.5 truncate">
              👤 {order.session.customerName}
            </div>
          )}
        </div>

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Cancel Button (only for ADMIN/MANAGER on pending orders) */}
        {canCancel && onCancel && type === 'pending' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            disabled={isCanceling}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50 transition-colors"
            title="Cancelar pedido"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Action Button */}
        {showAction && onAction && (
          <button
            onClick={onAction}
            disabled={isLoading}
            className={`${c.bg} ${c.hoverBg} text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50 transition-colors`}
          >
            {actionIcon}
            {actionLabel}
          </button>
        )}
      </div>

      {/* Expanded Items */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`px-3 pb-2 pt-1 bg-gray-50 border-t ${c.border}`}>
              <table className="w-full text-xs">
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-1 pr-2 font-medium text-gray-900 w-8">
                        {item.quantity}x
                      </td>
                      <td className="py-1">
                        <div className="text-gray-800">{item.name}</div>
                        {item.notes && (
                          <div className={`${c.text} text-[10px]`}>📝 {item.notes}</div>
                        )}
                        {item.extras && item.extras.length > 0 && (
                          <div className="text-gray-500 text-[10px]">
                            + {item.extras.map(e => e.name).join(', ')}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {order.notes && (
                <div className={`mt-2 p-1.5 rounded ${c.border} border bg-white text-[11px] ${c.text}`}>
                  <strong>Obs:</strong> {order.notes}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
