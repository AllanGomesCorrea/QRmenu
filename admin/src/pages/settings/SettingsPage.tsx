import { useState, useEffect } from 'react';
import { 
  Store, 
  Clock, 
  Bell,
  Save,
  Upload,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useMyRestaurant, useUpdateRestaurant } from '../../hooks/useRestaurant';

const tabs = [
  { id: 'general', label: 'Geral', icon: Store },
  { id: 'hours', label: 'Horários', icon: Clock },
  { id: 'notifications', label: 'Notificações', icon: Bell },
];

export default function SettingsPage() {
  const { canManage } = usePermissions();
  const { data: restaurant, isLoading, isError, refetch } = useMyRestaurant();
  const updateRestaurant = useUpdateRestaurant();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Pre-fill form when restaurant data loads
  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name || '');
      setDescription(restaurant.description || '');
      setPhone(restaurant.phone || '');
      setWhatsapp(restaurant.whatsapp || '');
      setAddress(restaurant.address || '');
      setCity(restaurant.city || '');
      setState(restaurant.state || '');
      setZipCode(restaurant.zipCode || '');
    }
  }, [restaurant]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateRestaurant.mutateAsync({
        name: name || undefined,
        description: description || undefined,
        phone: phone || undefined,
        whatsapp: whatsapp || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // error handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <p className="text-gray-600">Erro ao carregar configurações</p>
        <button onClick={() => refetch()} className="btn-primary">
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

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
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-sm text-green-600 font-medium">✓ Salvo com sucesso</span>
          )}
          {canManage('settings') && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          )}
        </div>
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
                  <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                    {restaurant?.logoUrl ? (
                      <img src={restaurant.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-gray-400" />
                    )}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canManage('settings')}
                />
              </div>

              {/* Slug (read only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  className="input bg-gray-50"
                  value={restaurant?.slug || ''}
                  disabled
                />
                <p className="text-xs text-gray-400 mt-1">O slug não pode ser alterado</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Descreva seu restaurante..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
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
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
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
                    value={state}
                    onChange={(e) => setState(e.target.value)}
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
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
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

        </div>
      </div>
    </div>
  );
}
