import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, ChevronLeft, ChevronRight, Eye, Edit2, Trash2 } from 'lucide-react';
import { changesService } from '../services/api';
import { Badge, LoadingSpinner, EmptyState } from '../components/UI';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const estadoConfig = {
  pendiente: { label: 'Pendiente', variant: 'warning' },
  en_progreso: { label: 'En Progreso', variant: 'info' },
  completado: { label: 'Completado', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
};

const ambienteConfig = {
  DEV: 'bg-gray-100 text-gray-800',
  QA: 'bg-blue-100 text-blue-800',
  STG: 'bg-purple-100 text-purple-800',
  PRD: 'bg-red-100 text-red-800',
};

export default function ChangesList() {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filtro, setFiltro] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterAmbiente, setFilterAmbiente] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  useEffect(() => {
    loadChanges();
  }, [pagination.page, filterEstado, filterAmbiente, filterTipo]);

  const loadChanges = async () => {
    try {
      setLoading(true);
      const response = await changesService.getAll(
        pagination.page,
        pagination.limit,
        filtro
      );

      let filteredData = response.data;

      // Aplicar filtros
      if (filterEstado) {
        filteredData = filteredData.filter((c) => c.estado === filterEstado);
      }
      if (filterAmbiente) {
        filteredData = filteredData.filter((c) => c.ambiente === filterAmbiente);
      }
      if (filterTipo) {
        filteredData = filteredData.filter((c) => c.tipo === filterTipo);
      }

      setChanges(filteredData);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (error) {
      console.error('Error cargando cambios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadChanges();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cambio?')) return;

    try {
      await changesService.delete(id);
      loadChanges();
    } catch (error) {
      console.error('Error eliminando cambio:', error);
      alert('Error al eliminar el cambio');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilterEstado('');
    setFilterAmbiente('');
    setFilterTipo('');
    setFiltro('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filterEstado || filterAmbiente || filterTipo || filtro;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header y búsqueda */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Control de Cambios</h3>
          <p className="text-gray-600 mt-1">
            {pagination.total} registro{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/changes/new" className="btn btn-primary">
          <Plus size={18} className="mr-2" />
          Nuevo Cambio
        </Link>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-600" />
          <h4 className="font-medium text-gray-900">Filtros</h4>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-primary-600 hover:text-primary-700"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Buscar</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Título, SAVF, solicitante..."
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Estado</label>
              <select
                value={filterEstado}
                onChange={(e) => {
                  setFilterEstado(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="input"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="label">Ambiente</label>
              <select
                value={filterAmbiente}
                onChange={(e) => {
                  setFilterAmbiente(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="input"
              >
                <option value="">Todos</option>
                <option value="DEV">DEV</option>
                <option value="QA">QA</option>
                <option value="STG">STG</option>
                <option value="PRD">PRD</option>
              </select>
            </div>

            <div>
              <label className="label">Tipo</label>
              <select
                value={filterTipo}
                onChange={(e) => {
                  setFilterTipo(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="input"
              >
                <option value="">Todos</option>
                <option value="Proyecto">Proyecto</option>
                <option value="Requerimiento">Requerimiento</option>
                <option value="Incidencia">Incidencia</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary">
              <Search size={16} className="mr-2" />
              Buscar
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de cambios */}
      {changes.length === 0 ? (
        <EmptyState
          message="No se encontraron cambios con los filtros seleccionados"
          action={
            hasActiveFilters
              ? { label: 'Limpiar filtros', onClick: clearFilters }
              : { label: 'Crear primer cambio', onClick: () => {} }
          }
        />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Título</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ambiente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">SAVF</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Implementador</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change) => {
                  const estado = estadoConfig[change.estado] || estadoConfig.pendiente;
                  return (
                    <tr key={change.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link
                          to={`/changes/${change.id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          {change.titulo}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">{change.tipo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${ambienteConfig[change.ambiente] || 'bg-gray-100 text-gray-800'}`}>
                          {change.ambiente}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">{change.savf_name || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">{change.implementador || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {change.fecha_implementacion
                            ? format(new Date(change.fecha_implementacion), 'dd/MM/yyyy', { locale: es })
                            : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={estado.variant}>{estado.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/changes/${change.id}`}
                            className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded"
                            title="Ver detalle"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to={`/changes/${change.id}/edit`}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(change.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
