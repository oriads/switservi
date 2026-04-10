import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, Calendar, User, Monitor, FileText, CheckCircle, XCircle } from 'lucide-react';
import { changesService, evidenciasService } from '../services/api';
import { Badge, LoadingSpinner } from '../components/UI';
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

export default function ChangeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [change, setChange] = useState(null);
  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChangeDetail();
  }, [id]);

  const loadChangeDetail = async () => {
    try {
      setLoading(true);
      const [changeResponse, evidenciasResponse] = await Promise.all([
        changesService.getById(id),
        evidenciasService.getByChangeId(id).catch(() => ({ data: [] })),
      ]);

      setChange(changeResponse.data);
      setEvidencias(evidenciasResponse.data || []);
    } catch (error) {
      console.error('Error cargando detalle:', error);
      alert('Error al cargar el detalle del cambio');
      navigate('/changes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!change) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Cambio no encontrado</p>
        <button onClick={() => navigate('/changes')} className="btn btn-primary mt-4">
          Volver a la lista
        </button>
      </div>
    );
  }

  const estado = estadoConfig[change.estado] || estadoConfig.pendiente;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/changes')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900">{change.titulo}</h3>
              <Badge variant={estado.variant}>{estado.label}</Badge>
            </div>
            <p className="text-gray-600 mt-1">
              {change.tipo} • Creado el {format(new Date(change.created_at), 'dd MMMM yyyy', { locale: es })}
            </p>
          </div>
        </div>
        <Link to={`/changes/${id}/edit`} className="btn btn-primary">
          <Edit2 size={16} className="mr-2" />
          Editar
        </Link>
      </div>

      {/* Información Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descripción */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h4>
            <p className="text-gray-700 whitespace-pre-wrap">
              {change.descripcion || 'Sin descripción'}
            </p>
          </div>

          {/* Novedades */}
          {change.novedades && (
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Novedades</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{change.novedades}</p>
            </div>
          )}

          {/* Evidencias */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Evidencias</h4>
              <Link
                to={`/evidencias/${id}`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Gestionar →
              </Link>
            </div>
            {evidencias.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay evidencias adjuntas</p>
            ) : (
              <div className="space-y-2">
                {evidencias.map((evidencia) => (
                  <div
                    key={evidencia.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {evidencia.original_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(evidencia.file_size / 1024).toFixed(2)} KB • Subido el{' '}
                          {format(new Date(evidencia.created_at), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Información Técnica */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Información Técnica</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Monitor size={18} className="text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Ambiente</p>
                  <Badge className={ambienteConfig[change.ambiente] || 'bg-gray-100 text-gray-800'}>
                    {change.ambiente}
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText size={18} className="text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">SAVF</p>
                  <p className="text-sm font-medium text-gray-900">
                    {change.savf_name || 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Fecha de Implementación</p>
                  <p className="text-sm font-medium text-gray-900">
                    {change.fecha_implementacion
                      ? format(new Date(change.fecha_implementacion), 'dd MMMM yyyy', { locale: es })
                      : 'No especificada'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Solicitante</p>
                  <p className="text-sm font-medium text-gray-900">
                    {change.solicitante || 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User size={18} className="text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Implementador</p>
                  <p className="text-sm font-medium text-gray-900">
                    {change.implementador || 'No especificado'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Estado del Cambio</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Estado actual</span>
                <Badge variant={estado.variant}>{estado.label}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">¿Efectivo?</span>
                {change.efectivo ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <XCircle size={20} className="text-red-600" />
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          {change.metadata && (
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h4>
              <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-auto">
                {JSON.stringify(change.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
