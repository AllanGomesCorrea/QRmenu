import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  CheckCircle,
  ChefHat,
  Truck,
  AlertCircle,
  ShoppingBag,
  User,
  Users,
} from 'lucide-react';
import { useMyOrders, Order, OrderStatus } from '@/hooks/useOrders';
import { formatCurrency } from '@/utils/formatters';

interface OrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig: Record<OrderStatus, { icon: any; label: string; color: string; bgColor: string }> = {
  PENDING: { 
    icon: Clock, 
    label: 'Aguardando confirmação', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  CONFIRMED: { 
    icon: CheckCircle, 
    label: 'Confirmado', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  PREPARING: { 
    icon: ChefHat, 
    label: 'Em preparo', 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  READY: { 
    icon: Truck, 
    label: 'Pronto', 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  PAID: { 
    icon: CheckCircle, 
    label: 'Pago', 
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  CANCELLED: { 
    icon: AlertCircle, 
    label: 'Cancelado', 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

export default function OrdersDrawer({ isOpen, onClose }: OrdersDrawerProps) {
  const { data: orders = [], isLoading } = useMyOrders();

  // Separate my orders from others
  const myOrders = orders.filter((o) => o.isMyOrder !== false);
  const otherOrders = orders.filter((o) => o.isMyOrder === false);

  const myActiveOrders = myOrders.filter(
    (o) => o.status !== 'PAID' && o.status !== 'CANCELLED'
  );
  const myPastOrders = myOrders.filter(
    (o) => o.status === 'PAID' || o.status === 'CANCELLED'
  );
  
  const otherActiveOrders = otherOrders.filter(
    (o) => o.status !== 'PAID' && o.status !== 'CANCELLED'
  );

  // Calculate totals (convert to number in case it comes as string/Decimal)
  const myTotal = myOrders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const tableTotal = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-bold">Pedidos da Mesa</h2>
                {myActiveOrders.length > 0 && (
                  <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {myActiveOrders.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Totals Summary */}
            {orders.length > 0 && (
              <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Meu Total</p>
                    <p className="font-bold text-primary-600">{formatCurrency(myTotal)}</p>
                  </div>
                  {otherOrders.length > 0 && (
                    <>
                      <div className="w-px h-8 bg-gray-200" />
                      <div>
                        <p className="text-xs text-gray-500">Total da Mesa</p>
                        <p className="font-bold text-gray-900">{formatCurrency(tableTotal)}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
                  <p>Nenhum pedido ainda</p>
                </div>
              ) : (
                <div className="divide-y">
                  {/* My Active Orders */}
                  {myActiveOrders.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-primary-600 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        MEUS PEDIDOS EM ANDAMENTO
                      </h3>
                      <div className="space-y-4">
                        {myActiveOrders.map((order) => (
                          <OrderCard key={order.id} order={order} highlight />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Active Orders */}
                  {otherActiveOrders.length > 0 && (
                    <div className="p-4 bg-gray-50">
                      <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        OUTROS PEDIDOS DA MESA
                      </h3>
                      <div className="space-y-4">
                        {otherActiveOrders.map((order) => (
                          <OrderCard key={order.id} order={order} highlight={false} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* My Past Orders */}
                  {myPastOrders.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-500 mb-3">
                        MEUS PEDIDOS ANTERIORES
                      </h3>
                      <div className="space-y-4">
                        {myPastOrders.map((order) => (
                          <OrderCard key={order.id} order={order} highlight />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function OrderCard({ order, highlight = true }: { order: Order; highlight?: boolean }) {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  const formatTime = (date: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl overflow-hidden border-2 ${
        highlight 
          ? 'bg-white border-primary-200 shadow-sm' 
          : 'bg-white/80 border-gray-200 opacity-75'
      }`}
    >
      {/* Status Bar */}
      <div className={`px-4 py-2 ${status.bgColor} flex items-center justify-between`}>
        <div className={`flex items-center gap-2 ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{status.label}</span>
        </div>
        <span className="text-xs text-gray-500">
          {formatTime(order.createdAt)}
        </span>
      </div>

      {/* Order Details */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold">Pedido #{String(order.orderNumber).padStart(3, '0')}</span>
            {/* Show who ordered if not my order */}
            {!highlight && order.session?.customerName && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3" />
                {order.session.customerName}
              </p>
            )}
          </div>
          <span className={`font-semibold ${highlight ? 'text-primary-600' : 'text-gray-600'}`}>
            {formatCurrency(Number(order.total) || 0)}
          </span>
        </div>

        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span className={`font-medium ${highlight ? 'text-primary-600' : 'text-gray-500'}`}>
                {item.quantity}x
              </span>
              <div className="flex-1">
                <span>{item.name}</span>
                {item.extras.length > 0 && (
                  <p className="text-xs text-gray-500">
                    + {item.extras.map((e) => e.name).join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress indicator for active orders */}
        {highlight && order.status !== 'PAID' && order.status !== 'CANCELLED' && (
          <div className="mt-4 pt-4 border-t">
            <OrderProgress status={order.status} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function OrderProgress({ status }: { status: OrderStatus }) {
  const steps = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const stepConfig = statusConfig[step as OrderStatus];

        return (
          <div key={step} className="flex-1 flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted || isCurrent
                  ? stepConfig.bgColor
                  : 'bg-gray-100'
              }`}
            >
              <stepConfig.icon
                className={`w-4 h-4 ${
                  isCompleted || isCurrent ? stepConfig.color : 'text-gray-400'
                }`}
              />
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-1 ${
                  isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
