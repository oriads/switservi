import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, Shield, User } from 'lucide-react';
import { LoadingSpinner, Badge } from '../components/UI';

const API_URL = 'http://localhost:2050/api/admin';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'user',
  });
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/users?page=${currentPage}&limit=20&filtro=${search}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingUser
        ? `${API_URL}/users/${editingUser.id}`
        : `${API_URL}/users`;
      
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser
        ? { full_name: formData.full_name, role: formData.role }
        : formData;

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setShowForm(false);
        setEditingUser(null);
        setFormData({ username: '', email: '', password: '', full_name: '', role: 'user' });
        loadUsers();
      } else {
        alert(data.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error guardando usuario:', error);
      alert('Error al guardar');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      role: user.role,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario permanentemente?')) return;

    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (data.success) {
        loadUsers();
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        const response = await fetch(`${API_URL}/users/${user.id}/deactivate`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        const data = await response.json();
        if (data.success) loadUsers();
      } else {
        const response = await fetch(`${API_URL}/users/${user.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ is_active: true }),
        });
        const data = await response.json();
        if (data.success) loadUsers();
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {pagination.total} usuario{pagination.total !== 1 ? 's' : ''} registrado{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingUser(null);
            setFormData({ username: '', email: '', password: '', full_name: '', role: 'user' });
          }}
          className="btn btn-primary"
        >
          <Plus size={18} className="mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editingUser && (
                <>
                  <div>
                    <label className="label">Username *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Contraseña *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="input"
                      required={!editingUser}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="label">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editingUser ? 'Actualizar' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Búsqueda */}
      <div className="card">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email o username..."
              className="input pl-10"
            />
          </div>
          <button onClick={handleSearch} className="btn btn-primary">
            Buscar
          </button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Usuario</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Rol</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Estado</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <User size={16} className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.full_name}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                <td className="py-3 px-4">
                  <Badge variant={user.role === 'admin' ? 'danger' : 'info'}>
                    <Shield size={12} className="mr-1" />
                    {user.role === 'admin' ? 'Admin' : 'Usuario'}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <Badge variant={user.is_active ? 'success' : 'default'}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`p-1.5 rounded ${
                        user.is_active
                          ? 'text-gray-600 dark:text-gray-300 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                          : 'text-gray-600 dark:text-gray-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                      }`}
                      title={user.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Página {pagination.page} de {pagination.pages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
              disabled={currentPage === pagination.pages}
              className="btn btn-secondary disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
