import { useState } from 'react';
import { 
  Settings, 
  Store, 
  Clock, 
  Bell,
  Palette,
  Globe,
  Shield,
  Save,
  Upload,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';

const tabs = [
  { id: 'general', label: 'Geral', icon: Store },
  { id: 'hours', label: 'Horários', icon: Clock },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'appearance', label: 'Aparência', icon: Palette },
];

export default function SettingsPage() {
  const restaurant = useAuthStore((state) => state.restaurant);
  const { canManage } = usePermissions();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Configurações
          </h1>
          <p className="text-gray-600">Personalize seu restaurante</p>
        </div>
        {canManage('settings') && (
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="card space-y-6">
              <h2 className="font-heading text-lg font-semibold text-gray-900">
                Informações do Restaurante
              </h2>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Store className="w-8 h-8 text-gray-400" />
                  </div>
                  {canManage('settings') && (
                    <button className="btn-outline">
                      <Upload className="w-5 h-5" />
                      Enviar Logo
                    </button>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Restaurante
                </label>
                <input
                  type="text"
                  className="input"
                  defaultValue={restaurant?.name || ''}
                  disabled={!canManage('settings')}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Descreva seu restaurante..."
                  disabled={!canManage('settings')}
                />
              </div>

              {/* Contact */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="(11) 3333-4444"
                    disabled={!canManage('settings')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="(11) 99999-8888"
                    disabled={!canManage('settings')}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Rua, número, bairro"
                  disabled={!canManage('settings')}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="São Paulo"
                    disabled={!canManage('settings')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="SP"
                    disabled={!canManage('settings')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="01310-100"
                    disabled={!canManage('settings')}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hours' && (
            <div className="card">
              <h2 className="font-heading text-lg font-semibold text-gray-900 mb-6">
                Horário de Funcionamento
              </h2>
              <div className="space-y-4">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-24 font-medium text-gray-700">{day}</span>
                    <input
                      type="time"
                      className="input w-32"
                      defaultValue="11:00"
                      disabled={!canManage('settings')}
                    />
                    <span className="text-gray-400">até</span>
                    <input
                      type="time"
                      className="input w-32"
                      defaultValue="23:00"
                      disabled={!canManage('settings')}
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="checkbox" className="rounded" defaultChecked disabled={!canManage('settings')} />
                      Aberto
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="font-heading text-lg font-semibold text-gray-900 mb-6">
                Preferências de Notificação
              </h2>
              <div className="space-y-4">
                {[
                  { label: 'Novo pedido recebido', desc: 'Notificar quando um cliente fizer um pedido' },
                  { label: 'Pedido pronto', desc: 'Notificar quando a cozinha marcar um pedido como pronto' },
                  { label: 'Chamado de garçom', desc: 'Notificar quando um cliente chamar o garçom' },
                  { label: 'Solicitação de conta', desc: 'Notificar quando um cliente solicitar a conta' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        defaultChecked 
                        disabled={!canManage('settings')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <h2 className="font-heading text-lg font-semibold text-gray-900 mb-6">
                Aparência do Cardápio
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Principal
                  </label>
                  <div className="flex gap-3">
                    {['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-gray-300 transition-colors"
                        style={{ backgroundColor: color }}
                        disabled={!canManage('settings')}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner do Cardápio
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Arraste uma imagem ou clique para enviar
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Recomendado: 1200x400px
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

