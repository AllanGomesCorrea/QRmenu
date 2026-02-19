import { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search,
  Edit2,
  Trash2,
  Shield,
  Mail,
  Phone,
  RefreshCw,
  Loader2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLE_LABELS, type UserRole } from '../../config/permissions';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, type CreateUserDto, type UpdateUserDto } from '../../hooks/useUsers';

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-green-100 text-green-700',
  KITCHEN: 'bg-amber-100 text-amber-700',
  WAITER: 'bg-cyan-100 text-cyan-700',
  CASHIER: 'bg-pink-100 text-pink-700',
};

const availableRoles: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'KITCHEN', label: 'Cozinha' },
  { value: 'WAITER', label: 'Garçom' },
  { value: 'CASHIER', label: 'Caixa' },
];

export default function UsersPage() {
  const { canManage } = usePermissions();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string; phone: string | null; role: UserRole; isActive: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useUsers(page, 50);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const users = data?.data || [];
  const meta = data?.meta;

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const lower = search.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(lower) ||
      user.email.toLowerCase().includes(lower)
    );
  }, [users, search]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.isActive).length,
    kitchen: users.filter(u => u.role === 'KITCHEN').length,
    waiters: users.filter(u => u.role === 'WAITER').length,
  }), [users]);

  const handleDelete = async (id: string) => {
    try {
      await deleteUser.mutateAsync(id);
      setConfirmDelete(null);
    } catch {
      // error handled by mutation
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
        <p className="text-gray-600">Erro ao carregar usuários</p>
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
            Usuários
          </h1>
          <p className="text-gray-600">Gerencie a equipe do restaurante</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            title="Atualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {canManage('users') && (
            <button
              className="btn-primary"
              onClick={() => { setEditingUser(null); setShowModal(true); }}
            >
              <Plus className="w-5 h-5" />
              Novo Usuário
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-gray-500">Ativos</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-600">{stats.kitchen}</p>
          <p className="text-sm text-gray-500">Cozinha</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-cyan-600">{stats.waiters}</p>
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
      {filteredUsers.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {search ? 'Nenhum usuário encontrado para essa busca' : 'Nenhum usuário cadastrado'}
          </p>
        </div>
      ) : (
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
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role as UserRole] || 'bg-gray-100 text-gray-700'}`}>
                      {ROLE_LABELS[user.role as UserRole] || user.role}
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
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              {canManage('users') && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    onClick={() => { setEditingUser(user); setShowModal(true); }}
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                    onClick={() => setConfirmDelete(user.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Desativar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {meta.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar desativação</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja desativar este usuário? Ele não poderá mais acessar o sistema.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteUser.isPending}
                className="px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 disabled:opacity-50"
              >
                {deleteUser.isPending ? 'Desativando...' : 'Desativar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <UserFormModal
          editingUser={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
          onSubmit={async (formData) => {
            if (editingUser) {
              await updateUser.mutateAsync({ id: editingUser.id, data: formData });
            } else {
              await createUser.mutateAsync(formData as CreateUserDto);
            }
            setShowModal(false);
            setEditingUser(null);
          }}
          isLoading={createUser.isPending || updateUser.isPending}
        />
      )}
    </div>
  );
}

function UserFormModal({
  editingUser,
  onClose,
  onSubmit,
  isLoading,
}: {
  editingUser: { id: string; name: string; email: string; phone: string | null; role: UserRole; isActive: boolean } | null;
  onClose: () => void;
  onSubmit: (data: CreateUserDto | UpdateUserDto) => Promise<void>;
  isLoading: boolean;
}) {
  const [name, setName] = useState(editingUser?.name || '');
  const [email, setEmail] = useState(editingUser?.email || '');
  const [phone, setPhone] = useState(editingUser?.phone || '');
  const [role, setRole] = useState<UserRole>(editingUser?.role || 'WAITER');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Nome e email são obrigatórios');
      return;
    }

    if (!editingUser && !password) {
      setError('Senha é obrigatória para novos usuários');
      return;
    }

    try {
      if (editingUser) {
        const data: UpdateUserDto = { name, email, role };
        if (phone) data.phone = phone;
        if (password) data.password = password;
        await onSubmit(data);
      } else {
        await onSubmit({ name, email, password, phone: phone || undefined, role });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar usuário');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="bg-error-50 text-error-600 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              className="input w-full"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="input w-full"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="tel"
              className="input w-full"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(11) 99999-8888"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <select
              className="input w-full"
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
            >
              {availableRoles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input w-full pr-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={editingUser ? '••••••' : 'Senha segura'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingUser ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
