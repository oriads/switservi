import { useState, useEffect } from 'react';
import { RefreshCw, Monitor, Calendar, Clock, User, Activity } from 'lucide-react';
import { ibmiService } from '../services/api';
import { Badge, LoadingSpinner, EmptyState } from '../components/UI';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const statusConfig = {
  active: { label: 'Activo', variant: 'success' },
  waiting: { label: 'Esperando', variant: 'warning' },
  completed: { label: 'Completado', variant: 'info' },
  error: { label: 'Error', variant: 'danger' },
  held: { label: 'En Espera', variant: 'default' },
};

export default function IBMiJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    loadJobs();
    checkHealth();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await ibmiService.getJobs();
      setJobs(response.data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error cargando trabajos:', error);
      // Datos de ejemplo para desarrollo
      setJobs([
        {
          id: '1',
          job_name: 'BACKUP_DIARIO',
          submitter: 'QSECOFR',
          job_type: 'Batch',
          schedule_date: new Date().toISOString(),
          schedule_time: '02:00:00',
          status: 'waiting',
          job_queue: 'QBATCH',
          job_library: 'QGPL',
          description: 'Backup diario del sistema',
        },
        {
          id: '2',
          job_name: 'ACTUALIZACION_STOCK',
          submitter: 'ADMIN',
          job_type: 'Batch',
          schedule_date: new Date().toISOString(),
          schedule_time: '03:00:00',
          status: 'active',
          job_queue: 'QBATCH',
          job_library: 'QGPL',
          description: 'Actualización automática de stock',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const response = await ibmiService.getHealth();
      setHealth(response.data);
    } catch (error) {
      setHealth({ status: 'error', message: 'No se puede conectar con Backend Go' });
    }
  };

  const handleRefresh = () => {
    loadJobs();
    checkHealth();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Trabajos IBM i</h3>
          <p className="text-gray-600 mt-1">
            Monitoreo de trabajos planificados en AS/400
          </p>
        </div>
        <button onClick={handleRefresh} className="btn btn-primary">
          <RefreshCw size={16} className="mr-2" />
          Actualizar
        </button>
      </div>

      {/* Health Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor size={20} className="text-primary-600" />
            <div>
              <h4 className="font-semibold text-gray-900">Estado de Conexión IBM i</h4>
              <p className="text-sm text-gray-600">
                {health?.status === 'ok' ? 'Conexión activa' : 'Error de conexión'}
              </p>
            </div>
          </div>
          <Badge variant={health?.status === 'ok' ? 'success' : 'danger'}>
            {health?.status === 'ok' ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
        {lastRefresh && (
          <p className="text-xs text-gray-500 mt-2">
            Última actualización: {format(lastRefresh, 'dd/MM/yyyy HH:mm:ss', { locale: es })}
          </p>
        )}
      </div>

      {/* Lista de Trabajos */}
      {jobs.length === 0 ? (
        <EmptyState
          message="No hay trabajos programados"
          action={{ label: 'Actualizar', onClick: handleRefresh }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const status = statusConfig[job.status] || statusConfig.waiting;
            return (
              <div key={job.id} className="card hover:shadow-md transition-shadow">
                {/* Header del Job */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary-100">
                      <Activity size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">{job.job_name}</h5>
                      <p className="text-sm text-gray-600">{job.job_type}</p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                {/* Descripción */}
                {job.description && (
                  <p className="text-sm text-gray-700 mb-4 pb-4 border-b border-gray-200">
                    {job.description}
                  </p>
                )}

                {/* Detalles */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Enviado por</p>
                      <p className="text-sm font-medium text-gray-900">{job.submitter}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Fecha programada</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(job.schedule_date), 'dd MMMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Hora programada</p>
                      <p className="text-sm font-medium text-gray-900">
                        {job.schedule_time?.substring(0, 5)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600">Cola de trabajos</p>
                      <p className="text-sm font-medium text-gray-900">{job.job_queue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Biblioteca</p>
                      <p className="text-sm font-medium text-gray-900">{job.job_library}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Información */}
      <div className="card bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Información</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Los trabajos se sincronizan automáticamente con IBM i</li>
          <li>• La conexión ODBC se configura en el Backend Go</li>
          <li>• Para ejecutar comandos CL, contacte al administrador del sistema</li>
          <li>• Los estados se actualizan en tiempo real desde el AS/400</li>
        </ul>
      </div>
    </div>
  );
}
