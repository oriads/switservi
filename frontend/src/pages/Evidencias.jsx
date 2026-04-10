import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Upload, FileText, Trash2, Download, ArrowLeft, Image, File } from 'lucide-react';
import { evidenciasService, changesService } from '../services/api';
import { LoadingSpinner, EmptyState } from '../components/UI';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ALLOWED_TYPES = [
  '.xlsx', '.docx', '.txt', '.pdf', '.png', '.jpg', '.jpeg'
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function EvidenciasPage() {
  const { changeId } = useParams();
  const fileInputRef = useRef(null);
  const [evidencias, setEvidencias] = useState([]);
  const [change, setChange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useState(() => {
    if (changeId) {
      loadEvidencias();
    }
  }, [changeId]);

  const loadEvidencias = async () => {
    try {
      setLoading(true);
      const [evidenciasResponse, changeResponse] = await Promise.all([
        evidenciasService.getByChangeId(changeId).catch(() => ({ data: [] })),
        changesService.getById(changeId).catch(() => ({ data: null })),
      ]);

      setEvidencias(evidenciasResponse.data || []);
      setChange(changeResponse.data);
    } catch (error) {
      console.error('Error cargando evidencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar archivos
    const validFiles = files.filter((file) => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_TYPES.includes(ext)) {
        alert(`El archivo "${file.name}" no tiene un tipo permitido`);
        return false;
      }
      if (file.size > MAX_SIZE) {
        alert(`El archivo "${file.name}" excede el tamaño máximo de 10MB`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      await evidenciasService.upload(changeId, selectedFiles, 'usuario');
      setSelectedFiles([]);
      loadEvidencias();
      alert('Evidencias subidas correctamente');
    } catch (error) {
      console.error('Error subiendo evidencias:', error);
      alert('Error al subir las evidencias');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (evidenciaId) => {
    if (!confirm('¿Estás seguro de eliminar esta evidencia?')) return;

    try {
      // Nota: El backend necesita un endpoint DELETE para evidencias
      // Por ahora solo removemos del estado local
      setEvidencias((prev) => prev.filter((e) => e.id !== evidenciaId));
    } catch (error) {
      console.error('Error eliminando evidencia:', error);
      alert('Error al eliminar la evidencia');
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg'].includes(ext)) {
      return <Image size={20} className="text-purple-600" />;
    }
    if (ext === 'pdf') {
      return <FileText size={20} className="text-red-600" />;
    }
    return <File size={20} className="text-blue-600" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/changes" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Gestión de Evidencias</h3>
          {change && (
            <p className="text-gray-600 mt-1">
              Cambio: {change.titulo}
            </p>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Subir Evidencias</h4>
        
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
        >
          <Upload size={40} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-700 font-medium mb-2">
            Haz clic para seleccionar archivos
          </p>
          <p className="text-sm text-gray-500">
            Tipos permitidos: {ALLOWED_TYPES.join(', ')}
          </p>
          <p className="text-sm text-gray-500">
            Tamaño máximo: 10MB por archivo
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".xlsx,.docx,.txt,.pdf,.png,.jpg,.jpeg"
        />

        {/* Archivos seleccionados */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <h5 className="text-sm font-medium text-gray-700">
              Archivos seleccionados ({selectedFiles.length})
            </h5>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn btn-primary w-full mt-4"
            >
              <Upload size={16} className="mr-2" />
              {uploading ? 'Subiendo...' : 'Subir Archivos'}
            </button>
          </div>
        )}
      </div>

      {/* Evidencias Existentes */}
      <div className="card">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Evidencias Adjuntas ({evidencias.length})
        </h4>

        {evidencias.length === 0 ? (
          <EmptyState message="No hay evidencias adjuntas para este cambio" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidencias.map((evidencia) => (
              <div
                key={evidencia.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getFileIcon(evidencia.original_name)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {evidencia.original_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(evidencia.file_size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(evidencia.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-gray-600">
                  <p>
                    <span className="font-medium">Tipo:</span> {evidencia.mime_type}
                  </p>
                  <p>
                    <span className="font-medium">Subido por:</span> {evidencia.uploaded_by}
                  </p>
                  <p>
                    <span className="font-medium">Fecha:</span>{' '}
                    {format(new Date(evidencia.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </div>

                <button className="btn btn-secondary w-full mt-4 text-sm">
                  <Download size={14} className="mr-2" />
                  Descargar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
