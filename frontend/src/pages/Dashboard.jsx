import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Monitor,
} from 'lucide-react';
import { changesService } from '../services/api';
import { StatCard, Badge, LoadingSpinner } from '../components/UI';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const estadoConfig = {
  pendiente: { label: 'Pendiente', variant: 'warning', icon: Clock },
  en_progreso: { label: 'En Progreso', variant: 'info', icon: ArrowUpRight },
  completado: { label: 'Completado', variant: 'success', icon: CheckCircle },
  cancelado: { label: 'Cancelado', variant: 'danger', icon: XCircle },
};

const tipoConfig = {
  Proyecto: { color: 'text-blue-600', bg: 'bg-blue-50' },
  Requerimiento: { color: 'text-green-600', bg: 'bg-green-50' },
  Incidencia: { color: 'text-red-600', bg: 'bg-red-50' },
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    enProgreso: 0,
    completados: 0,
    cancelados: 0,
    recientes: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await changesService.getAll(1, 100);
      const changes = response.data;

      const stats = {
        total: changes.length,
        pendientes: changes.filter((c) => c.estado === 'pendiente').length,
        enProgreso: changes.filter((c) => c.estado === 'en_progreso').length,
        completados: changes.filter((c) => c.estado === 'completado').length,
        cancelados: changes.filter((c) => c.estado === 'cancelado').length,
        recientes: changes.slice(0, 5),
      };

      setStats(stats);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FileText}
          label="Total de Cambios"
          value={stats.total}
          color="primary"
        />
        <StatCard
          icon={Clock}
          label="Pendientes"
          value={stats.pendientes}
          color="yellow"
        />
        <StatCard
          icon={ArrowUpRight}
          label="En Progreso"
          value={stats.enProgreso}
          color="primary"
        />
        <StatCard
          icon={CheckCircle}
          label="Completados"
          value={stats.completados}
          color="green"
        />
      </div>

      {/* Distribución por tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Estado
          </h3>
          <div className="space-y-3">
            {Object.entries(estadoConfig).map(([key, config]) => {
              const count = stats[key.replace('en_progreso', 'enProgreso').replace('cancelados', 'cancelados')];
              const percentage = stats.total > 0 ? ((count || 0) / stats.total) * 100 : 0;
              const Icon = config.icon;
              
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Icon size={16} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {config.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {count || 0} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          config.variant === 'success'
                            ? 'bg-green-500'
                            : config.variant === 'warning'
                            ? 'bg-yellow-500'
                            : config.variant === 'danger'
                            ? 'bg-red-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cambios Recientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Cambios Recientes
            </h3>
            <Link
              to="/changes"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recientes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay cambios registrados
              </p>
            ) : (
              stats.recientes.map((change) => {
                const estado = estadoConfig[change.estado] || estadoConfig.pendiente;
                const tipo = tipoConfig[change.tipo] || tipoConfig.Requerimiento;
                const EstadoIcon = estado.icon;

                return (
                  <Link
                    key={change.id}
                    to={`/changes/${change.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {change.titulo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${tipo.bg} ${tipo.color}`}>
                            {change.tipo}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(change.created_at), 'dd MMM', { locale: es })}
                          </span>
                        </div>
                      </div>
                      <Badge variant={estado.variant}>
                        <EstadoIcon size={12} className="mr-1" />
                        {estado.label}
                      </Badge>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/changes/new"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="p-2 rounded-lg bg-primary-100 group-hover:bg-primary-200">
              <FileText size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Nuevo Cambio</p>
              <p className="text-sm text-gray-500">Crear registro de cambio</p>
            </div>
          </Link>

          <Link
            to="/evidencias"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200">
              <ArrowUpRight size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Subir Evidencia</p>
              <p className="text-sm text-gray-500">Adjuntar documentos</p>
            </div>
          </Link>

          <Link
            to="/ibmi-jobs"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200">
              <Monitor size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Ver Trabajos IBM i</p>
              <p className="text-sm text-gray-500">Consultar trabajos</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
