import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  CheckCircle,
  ChefHat,
  Truck,
  AlertCircle,
  ShoppingBag,
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

  const activeOrders = orders.filter(
    (o) => o.status !== 'PAID' && o.status !== 'CANCELLED'
  );
  const pastOrders = orders.filter(
    (o) => o.status === 'PAID' || o.status === 'CANCELLED'
  );

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
                <h2 className="text-lg font-bold">Meus Pedidos</h2>
                {activeOrders.length > 0 && (
                  <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeOrders.length}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
                  <p>Você ainda não fez pedidos</p>
                </div>
              ) : (
                <div className="divide-y">
                  {/* Active Orders */}
                  {activeOrders.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-500 mb-3">
                        PEDIDOS EM ANDAMENTO
                      </h3>
                      <div className="space-y-4">
                        {activeOrders.map((order) => (
                          <OrderCard key={order.id} order={order} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past Orders */}
                  {pastOrders.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-500 mb-3">
                        PEDIDOS ANTERIORES
                      </h3>
                      <div className="space-y-4">
                        {pastOrders.map((order) => (
                          <OrderCard key={order.id} order={order} />
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

function OrderCard({ order }: { order: Order }) {
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
      className="bg-white border border-gray-200 rounded-xl overflow-hidden"
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
          <span className="text-lg font-bold">Pedido #{order.orderNumber}</span>
          <span className="font-semibold text-primary-600">
            {formatCurrency(order.total)}
          </span>
        </div>

        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span className="font-medium text-primary-600">{item.quantity}x</span>
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
        {order.status !== 'PAID' && order.status !== 'CANCELLED' && (
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

