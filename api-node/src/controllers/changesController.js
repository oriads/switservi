const Change = require('../models/Change');
const ExcelExportService = require('../services/excelExport');

// Crear cambio
exports.createChange = async (req, res) => {
  try {
    const change = await Change.create(req.body);

    res.status(201).json({
      success: true,
      data: change,
    });
  } catch (error) {
    console.error('Error creando cambio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// Obtener todos los cambios
exports.getChanges = async (req, res) => {
  try {
    const { page, limit, filtro } = req.query;
    const result = await Change.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      filtro: filtro || '',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error obteniendo cambios:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// Obtener cambio por ID
exports.getChangeById = async (req, res) => {
  try {
    const { id } = req.params;
    const change = await Change.findById(id);

    if (!change) {
      return res.status(404).json({
        success: false,
        error: 'Cambio no encontrado',
      });
    }

    res.json({
      success: true,
      data: change,
    });
  } catch (error) {
    console.error('Error obteniendo cambio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// Actualizar cambio
exports.updateChange = async (req, res) => {
  try {
    const { id } = req.params;
    const change = await Change.update(id, req.body);

    if (!change) {
      return res.status(404).json({
        success: false,
        error: 'Cambio no encontrado',
      });
    }

    res.json({
      success: true,
      data: change,
    });
  } catch (error) {
    console.error('Error actualizando cambio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// Eliminar cambio
exports.deleteChange = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Change.delete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Cambio no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Cambio eliminado correctamente',
    });
  } catch (error) {
    console.error('Error eliminando cambio:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// Buscar por nombre de requerimiento
exports.searchByTitulo = async (req, res) => {
  try {
    const { titulo } = req.query;

    if (!titulo) {
      return res.status(400).json({
        success: false,
        error: "Parámetro 'titulo' requerido",
      });
    }

    const results = await Change.searchByTitulo(titulo);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error buscando por título:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// Buscar por SAVF
exports.searchBySAVF = async (req, res) => {
  try {
    const { savf } = req.query;

    if (!savf) {
      return res.status(400).json({
        success: false,
        error: "Parámetro 'savf' requerido",
      });
    }

    const results = await Change.searchBySAVF(savf);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error buscando por SAVF:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
};

// Exportar a Excel
exports.exportToExcel = async (req, res) => {
  try {
    const filters = req.query;
    const buffer = await ExcelExportService.generateChangesReport(filters);
    
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=HelpDesk_Reporte_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buffer);
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar el reporte',
    });
  }
};

// Dashboard Analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const { fecha_desde, fecha_hasta } = req.query;
    
    let where = [];
    let params = [];
    let idx = 1;
    
    if (fecha_desde) {
      where.push(`created_at >= $${idx}`);
      params.push(fecha_desde);
      idx++;
    }
    if (fecha_hasta) {
      where.push(`created_at <= $${idx}`);
      params.push(fecha_hasta);
      idx++;
    }
    
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Estadísticas generales
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'en_progreso') as en_progreso,
        COUNT(*) FILTER (WHERE estado = 'completado') as completados,
        COUNT(*) FILTER (WHERE estado = 'cancelado') as cancelados,
        COUNT(*) FILTER (WHERE efectivo = true) as efectivos
      FROM changes ${whereClause}
    `, params);

    // Por ambiente
    const ambienteResult = await pool.query(`
      SELECT ambiente, COUNT(*) as total
      FROM changes ${whereClause}
      GROUP BY ambiente ORDER BY total DESC
    `, params);

    // Por mes (últimos 12 meses)
    const monthlyResult = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        COUNT(*) as total
      FROM changes ${whereClause}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY mes DESC LIMIT 12
    `, params);

    // Ranking implementadores
    const rankingResult = await pool.query(`
      SELECT 
        implementador,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'completado') as completados,
        COUNT(*) FILTER (WHERE efectivo = true) as efectivos
      FROM changes 
      WHERE implementador IS NOT NULL AND implementador != ''
      ${whereClause ? `AND ${whereClause.replace(/\$([0-9]+)/g, (m, p1) => '$' + (parseInt(p1) + params.length))}` : ''}
      GROUP BY implementador
      ORDER BY total DESC
      LIMIT 10
    `, [...params]);

    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0],
        por_ambiente: ambienteResult.rows,
        mensual: monthlyResult.rows,
        ranking: rankingResult.rows,
      },
    });
  } catch (error) {
    console.error('Error en analytics:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
};
