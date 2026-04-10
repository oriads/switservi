import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Wifi, WifiOff, Server, Shield, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner, Badge } from '../components/UI';

const API_URL = 'http://localhost:2050/api/admin';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

const AMBIENTES = [
  { value: 'DEV', label: 'Desarrollo', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  { value: 'QA', label: 'Quality Assurance', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'STG', label: 'Staging', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'PRD', label: 'Producción', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
];

export default function IBMiConnections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConn, setEditingConn] = useState(null);
  const [formData, setFormData] = useState({
    connection_name: '',
    environment: 'DEV',
    host: '',
    port: 446,
    ibmi_user: '',
    ibmi_password: '',
    library: 'QGPL',
    description: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [search, setSearch] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });

  useEffect(() => {
    loadConnections();
  }, [currentPage]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/admin/ibmi-connections?page=${currentPage}&limit=20&filtro=${search}`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json();
      if (data.success) {
        setConnections(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadConnections();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingConn
        ? `${API_URL}/admin/ibmi-connections/${editingConn.id}`
        : `${API_URL}/admin/ibmi-connections`;
      const method = editingConn ? 'PUT' : 'POST';
      
      // No enviar password si está vacío en edición
      const body = { ...formData };
      if (editingConn && !body.ibmi_password) {
        delete body.ibmi_password;
      }

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setShowForm(false);
        setEditingConn(null);
        resetForm();
        loadConnections();
      } else {
        alert(data.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar');
    }
  };

  const resetForm = () => {
    setFormData({
      connection_name: '',
      environment: 'DEV',
      host: '',
      port: 446,
      ibmi_user: '',
      ibmi_password: '',
      library: 'QGPL',
      description: '',
    });
    setShowPassword(false);
  };

  const handleEdit = (conn) => {
    setEditingConn(conn);
    setFormData({
      connection_name: conn.connection_name,
      environment: conn.environment,
      host: conn.host,
      port: conn.port || 446,
      ibmi_user: conn.ibmi_user || '',
      ibmi_password: '',
      library: conn.library || 'QGPL',
      description: conn.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta conexión permanentemente?')) return;
    try {
      const response = await fetch(`${API_URL}/admin/ibmi-connections/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) loadConnections();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleTestConnection = async (host, port = 446) => {
    setTestResult(null);
    setTesting(true);
    try {
      const response = await fetch(`${API_URL}/admin/ibmi-connections/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ host, port }),
      });
      const data = await response.json();
      setTestResult(data.data);
    } catch (error) {
      setTestResult({ success: false, message: 'Error de red', details: error.message });
    } finally {
      setTesting(false);
    }
  };

  const handleTestCurrent = async (conn) => {
    setTestResult(null);
    setTesting(true);
    try {
      const response = await fetch(`${API_URL}/admin/ibmi-connections/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ host: conn.host, port: conn.port || 446 }),
      });
      const data = await response.json();
      setTestResult({ ...data.data, connectionName: conn.connection_name });
    } catch (error) {
      setTestResult({ success: false, message: 'Error de red', details: error.message });
    } finally {
      setTesting(false);
    }
  };

  const getAmbienteBadge = (env) => {
    const amb = AMBIENTES.find(a => a.value === env);
    return amb ? amb : AMBIENTES[0];
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Conexiones IBM i</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administración de credenciales y ambientes AS/400
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingConn(null); resetForm(); }}
          className="btn btn-primary"
        >
          <Plus size={18} className="mr-2" />
          Nueva Conexión
        </button>
      </div>

      {/* Bóveda de Credenciales - Info */}
      <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <Shield size={24} className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-green-900 dark:text-green-200">Bóveda de Credenciales Cifradas</h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Las contraseñas del IBM i se almacenan cifradas con <strong>AES-256-GCM</strong>. 
              Solo el administrador puede gestionarlas. Los usuarios pueden probar conexión 
              sin ver las credenciales almacenadas.
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingConn ? 'Editar Conexión' : 'Nueva Conexión IBM i'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre de Conexión *</label>
                <input
                  type="text"
                  value={formData.connection_name}
                  onChange={(e) => setFormData({ ...formData, connection_name: e.target.value })}
                  className="input"
                  placeholder="Ej: Sistema ERP Principal"
                  required
                />
              </div>
              <div>
                <label className="label">Ambiente *</label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="input"
                >
                  {AMBIENTES.map(a => (
                    <option key={a.value} value={a.value}>{a.label} ({a.value})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">IP del Servidor *</label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  className="input"
                  placeholder="192.168.1.100"
                  required
                />
              </div>
              <div>
                <label className="label">Puerto</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 446 })}
                  className="input"
                  placeholder="446"
                />
              </div>
              <div>
                <label className="label">Usuario IBM i</label>
                <input
                  type="text"
                  value={formData.ibmi_user}
                  onChange={(e) => setFormData({ ...formData, ibmi_user: e.target.value })}
                  className="input"
                  placeholder="QSECOFR"
                />
              </div>
              <div>
                <label className="label">Contraseña IBM i</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.ibmi_password}
                    onChange={(e) => setFormData({ ...formData, ibmi_password: e.target.value })}
                    className="input pr-10"
                    placeholder={editingConn ? '(Dejar vacío para no cambiar)' : 'Contraseña del IBM i'}
                    required={!editingConn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Biblioteca por Defecto</label>
                <input
                  type="text"
                  value={formData.library}
                  onChange={(e) => setFormData({ ...formData, library: e.target.value })}
                  className="input"
                  placeholder="QGPL"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Descripción del ambiente o sistema..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editingConn ? 'Actualizar' : 'Crear Conexión'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resultado de prueba de conexión */}
      {testResult && (
        <div className={`card ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
          <div className="flex items-start gap-3">
            {testResult.success ? <Wifi size={24} className="text-green-600" /> : <WifiOff size={24} className="text-red-600" />}
            <div className="flex-1">
              <h4 className={`font-semibold ${testResult.success ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'}`}>
                {testResult.success ? '✅ Conexión Exitosa' : '❌ Error de Conexión'}
              </h4>
              {testResult.connectionName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Conexión: <strong>{testResult.connectionName}</strong>
                </p>
              )}
              <p className={`text-sm mt-1 ${testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {testResult.message}
              </p>
              {testResult.responseTime && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tiempo de respuesta: {testResult.responseTime}ms
                </p>
              )}
              {testResult.details && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {testResult.details}
                </p>
              )}
            </div>
            <button onClick={() => setTestResult(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
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
              placeholder="Buscar por nombre, IP o descripción..."
              className="input pl-10"
            />
          </div>
          <button onClick={handleSearch} className="btn btn-primary">Buscar</button>
        </div>
      </div>

      {/* Grid de conexiones */}
      {connections.length === 0 ? (
        <div className="card text-center py-12">
          <Server size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay conexiones registradas</p>
          <button
            onClick={() => { setShowForm(true); resetForm(); }}
            className="btn btn-primary mt-4"
          >
            <Plus size={16} className="mr-2" />
            Crear Primera Conexión
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {connections.map((conn) => (
            <div key={conn.id} className="card hover:shadow-lg transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <Server size={20} className="text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{conn.connection_name}</h4>
                    <Badge variant={getAmbienteBadge(conn.environment).color.replace('bg-', '').includes('red') ? 'danger' : getAmbienteBadge(conn.environment).color.replace('bg-', '').includes('blue') ? 'info' : getAmbienteBadge(conn.environment).color.replace('bg-', '').includes('purple') ? 'primary' : 'default'}>
                      {getAmbienteBadge(conn.environment).label}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTestCurrent(conn)}
                    disabled={testing}
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                    title="Probar conexión"
                  >
                    <Wifi size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(conn)}
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(conn.id)}
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Detalles */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">IP / Host</span>
                  <span className="font-mono text-gray-900 dark:text-white font-medium">{conn.host}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Puerto</span>
                  <span className="text-gray-900 dark:text-white">{conn.port || 446}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Usuario IBM i</span>
                  <span className="text-gray-900 dark:text-white">{conn.ibmi_user || '-'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Biblioteca</span>
                  <span className="text-gray-900 dark:text-white">{conn.library || 'QGPL'}</span>
                </div>
                {conn.description && (
                  <div className="py-2">
                    <span className="text-gray-600 dark:text-gray-400">Descripción</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1 text-xs">{conn.description}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Creado por: {conn.created_by_name || 'Admin'}
                </span>
                <button
                  onClick={() => handleTestCurrent(conn)}
                  disabled={testing}
                  className="btn btn-secondary text-xs py-1 px-3"
                >
                  {testing ? 'Probando...' : '🔌 Probar Conexión'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
