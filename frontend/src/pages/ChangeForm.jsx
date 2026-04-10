import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { changesService } from '../services/api';
import { LoadingSpinner } from '../components/UI';

const TIPOS_CAMBIO = ['Proyecto', 'Requerimiento', 'Incidencia'];
const AMBIENTES = ['DEV', 'QA', 'STG', 'PRD'];
const ESTADOS = ['pendiente', 'en_progreso', 'completado', 'cancelado'];

export default function ChangeForm({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Requerimiento',
    descripcion: '',
    solicitante: '',
    ambiente: 'QA',
    savf_name: '',
    implementador: '',
    fecha_implementacion: '',
    estado: 'pendiente',
    efectivo: false,
    novedades: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchChange();
    }
  }, [id]);

  const fetchChange = async () => {
    try {
      setFetching(true);
      const response = await changesService.getById(id);
      const data = response.data;
      
      // Formatear fecha para input date
      if (data.fecha_implementacion) {
        data.fecha_implementacion = new Date(data.fecha_implementacion)
          .toISOString()
          .split('T')[0];
      }
      
      setFormData(data);
    } catch (error) {
      console.error('Error cargando cambio:', error);
      alert('Error al cargar el cambio');
      navigate('/changes');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.titulo) {
      alert('El título es obligatorio');
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit) {
        await changesService.update(id, formData);
        alert('Cambio actualizado correctamente');
      } else {
        await changesService.create(formData);
        alert('Cambio creado correctamente');
      }
      
      navigate('/changes');
    } catch (error) {
      console.error('Error guardando cambio:', error);
      alert('Error al guardar el cambio');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/changes')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Cambio' : 'Nuevo Cambio'}
          </h3>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Actualiza la información del cambio' : 'Completa el formulario para crear un nuevo cambio'}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Información Básica */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Título *</label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="input"
                placeholder="Nombre del cambio"
                required
              />
            </div>

            <div>
              <label className="label">Tipo *</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="input"
              >
                {TIPOS_CAMBIO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Solicitante</label>
              <input
                type="text"
                name="solicitante"
                value={formData.solicitante}
                onChange={handleChange}
                className="input"
                placeholder="Quién solicita el cambio"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="input"
                rows={4}
                placeholder="Descripción detallada del cambio"
              />
            </div>
          </div>
        </div>

        {/* Información Técnica */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Información Técnica</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Ambiente *</label>
              <select
                name="ambiente"
                value={formData.ambiente}
                onChange={handleChange}
                className="input"
              >
                {AMBIENTES.map((amb) => (
                  <option key={amb} value={amb}>
                    {amb}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Nombre SAVF</label>
              <input
                type="text"
                name="savf_name"
                value={formData.savf_name}
                onChange={handleChange}
                className="input"
                placeholder="Nombre del archivo SAVF"
              />
            </div>

            <div>
              <label className="label">Implementador</label>
              <input
                type="text"
                name="implementador"
                value={formData.implementador}
                onChange={handleChange}
                className="input"
                placeholder="Quién implementa el cambio"
              />
            </div>

            <div>
              <label className="label">Fecha de Implementación</label>
              <input
                type="date"
                name="fecha_implementacion"
                value={formData.fecha_implementacion}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Estado y Seguimiento (solo en edición) */}
        {isEdit && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Estado y Seguimiento</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="input"
                >
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado === 'pendiente' && 'Pendiente'}
                      {estado === 'en_progreso' && 'En Progreso'}
                      {estado === 'completado' && 'Completado'}
                      {estado === 'cancelado' && 'Cancelado'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="efectivo"
                    checked={formData.efectivo}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    ¿El cambio fue efectivo?
                  </span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="label">Novedades</label>
                <textarea
                  name="novedades"
                  value={formData.novedades}
                  onChange={handleChange}
                  className="input"
                  rows={3}
                  placeholder="Observaciones post-implementación"
                />
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/changes')}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={16} className="mr-2" />
            {loading ? 'Guardando...' : isEdit ? 'Actualizar Cambio' : 'Crear Cambio'}
          </button>
        </div>
      </form>
    </div>
  );
}
