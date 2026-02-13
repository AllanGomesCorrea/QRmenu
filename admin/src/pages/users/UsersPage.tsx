import { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search,
  Edit2,
  Trash2,
  Shield,
  Mail,
  Phone,
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_LABELS, UserRole } from '../../config/permissions';

// Mock data
const mockUsers = [
  { id: '1', name: 'João Silva', email: 'joao@casadosabor.com', phone: '11988887777', role: 'ADMIN' as UserRole, isActive: true },
  { id: '2', name: 'Ana Santos', email: 'ana@casadosabor.com', phone: '11977776666', role: 'MANAGER' as UserRole, isActive: true },
  { id: '3', name: 'Carlos Oliveira', email: 'carlos@casadosabor.com', phone: null, role: 'KITCHEN' as UserRole, isActive: true },
  { id: '4', name: 'Pedro Costa', email: 'pedro@casadosabor.com', phone: null, role: 'WAITER' as UserRole, isActive: true },
  { id: '5', name: 'Lucia Ferreira', email: 'lucia@casadosabor.com', phone: null, role: 'CASHIER' as UserRole, isActive: false },
];

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-green-100 text-green-700',
  KITCHEN: 'bg-amber-100 text-amber-700',
  WAITER: 'bg-cyan-100 text-cyan-700',
  CASHIER: 'bg-pink-100 text-pink-700',
};

export default function UsersPage() {
  const { canManage } = usePermissions();
  const [search, setSearch] = useState('');

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            Usuários
          </h1>
          <p className="text-gray-600">Gerencie a equipe do restaurante</p>
        </div>
        {canManage('users') && (
          <button className="btn-primary">
            <Plus className="w-5 h-5" />
            Novo Usuário
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{mockUsers.length}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">
            {mockUsers.filter(u => u.isActive).length}
          </p>
          <p className="text-sm text-gray-500">Ativos</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-600">
            {mockUsers.filter(u => u.role === 'KITCHEN').length}
          </p>
          <p className="text-sm text-gray-500">Cozinha</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-cyan-600">
            {mockUsers.filter(u => u.role === 'WAITER').length}
          </p>
          <p className="text-sm text-gray-500">Garçons</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar usuários..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10 w-full"
        />
      </div>

      {/* Users Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className={`card ${!user.isActive ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-600">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </div>
              {!user.isActive && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                  Inativo
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            {canManage('users') && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <button className="flex-1 btn-outline py-2 text-sm">
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

