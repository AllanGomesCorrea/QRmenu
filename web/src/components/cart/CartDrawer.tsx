import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useCreateOrder } from '@/hooks/useOrders';
import { formatCurrency } from '@/utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  restaurantSlug: string;
}

export default function CartDrawer({ isOpen, onClose, restaurantSlug }: Props) {
  const navigate = useNavigate();
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  const items = useCartStore((state) => state.items);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.getSubtotal());
  
  const session = useSessionStore((state) => state.session);
  const isSessionValid = useSessionStore((state) => state.isSessionValid());
  
  const createOrder = useCreateOrder();

  const handleCheckout = async () => {
    // If no valid session, redirect to table page
    if (!isSessionValid || !session) {
      alert('Para fazer um pedido, você precisa escanear o QR code da mesa primeiro.');
      return;
    }

    try {
      // Prepare order items
      const orderItems = items.map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        notes: item.notes,
        extras: item.selectedExtras.map((e) => ({ extraId: e.id })),
      }));

      // Create order
      await createOrder.mutateAsync({
        items: orderItems,
        notes: orderNotes || undefined,
      });

      // Show success and clear cart
      setOrderSuccess(true);
      clearCart();
      setOrderNotes('');

      // Auto close after 3 seconds
      setTimeout(() => {
        setOrderSuccess(false);
        onClose();
      }, 3000);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao criar pedido');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Success State */}
            {orderSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  <CheckCircle className="w-24 h-24 text-success-500 mb-6" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Pedido Enviado!
                </h2>
                <p className="text-gray-600 text-center">
                  Seu pedido foi enviado para a cozinha. Você pode acompanhar o status em "Meus Pedidos".
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary-500" />
                    <h2 className="font-heading text-lg font-bold">Seu Pedido</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto p-4">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Carrinho vazio</p>
                      <p className="text-sm">Adicione itens do cardápio</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-50 rounded-xl p-4"
                        >
                          <div className="flex gap-3">
                            {/* Image */}
                            {item.menuItem.imageUrl ? (
                              <img
                                src={item.menuItem.imageUrl}
                                alt={item.menuItem.name}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">🍽️</span>
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">
                                {item.menuItem.name}
                              </h3>

                              {/* Extras */}
                              {item.selectedExtras.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  + {item.selectedExtras.map((e) => e.name).join(', ')}
                                </p>
                              )}

                              {/* Notes */}
                              {item.notes && (
                                <p className="text-xs text-gray-500 italic mt-1">
                                  "{item.notes}"
                                </p>
                              )}

                              {/* Price */}
                              <p className="font-bold text-primary-600 mt-2">
                                {formatCurrency(item.totalPrice)}
                              </p>
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-gray-400 hover:text-error-500 hover:bg-error-50 rounded-lg self-start"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center justify-end gap-3 mt-3">
                            <button
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity - 1)
                              }
                              className="p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity + 1)
                              }
                              className="p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Order notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Observações do pedido
                        </label>
                        <textarea
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          className="input h-20 resize-none"
                          placeholder="Ex: Sem cebola, bem passado..."
                        />
                      </div>

                      {/* Clear cart */}
                      <button
                        onClick={clearCart}
                        className="text-sm text-error-500 hover:underline"
                      >
                        Limpar carrinho
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer with totals */}
                {items.length > 0 && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {/* Subtotal */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-bold text-lg">{formatCurrency(subtotal)}</span>
                    </div>

                    {/* Session info */}
                    {isSessionValid && session ? (
                      <div className="bg-primary-50 rounded-lg p-3 text-sm">
                        <p className="text-primary-700">
                          <span className="font-medium">{session.customerName}</span>
                          {' • '}Mesa {session.tableNumber}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-700">
                        Escaneie o QR code da mesa para fazer pedidos
                      </div>
                    )}

                    {/* Checkout button */}
                    <button
                      onClick={handleCheckout}
                      disabled={createOrder.isPending || !isSessionValid}
                      className="btn-primary w-full py-4 text-lg disabled:opacity-50"
                    >
                      {createOrder.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Fazer Pedido'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
