const ExcelJS = require('exceljs');
const { pool } = require('../config/database');

/**
 * Servicio de Exportación Excel
 * Genera reportes detallados con tablas dinámicas y gráficos nativos
 */

class ExcelExportService {
  /**
   * Generar reporte completo de cambios con filtros
   */
  static async generateChangesReport(filters = {}) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HelpDesk IBM i';
    workbook.created = new Date();

    // ============================================
    // HOJA 1: Datos completos de cambios
    // ============================================
    const changesSheet = workbook.addWorksheet('Control de Cambios', {
      properties: { tabColor: { argb: '2563EB' } },
    });

    // Definir columnas
    const columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Título', key: 'titulo', width: 35 },
      { header: 'Tipo', key: 'tipo', width: 18 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Solicitante', key: 'solicitante', width: 20 },
      { header: 'Ambiente', key: 'ambiente', width: 12 },
      { header: 'SAVF Principal', key: 'savf_name', width: 20 },
      { header: 'Implementador', key: 'implementador', width: 20 },
      { header: 'Fecha Implementación', key: 'fecha_implementacion', width: 18 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Efectivo', key: 'efectivo', width: 10 },
      { header: 'Novedades', key: 'novedades', width: 30 },
      { header: 'Creado', key: 'created_at', width: 18 },
      { header: 'SAVs Asociadas', key: 'savfs', width: 30 },
    ];

    changesSheet.columns = columns;

    // Estilo de header
    changesSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Obtener datos con filtros
    const { data: changes } = await this.getChangesData(filters);

    // Agregar datos
    for (const change of changes) {
      const row = {
        ...change,
        fecha_implementacion: change.fecha_implementacion 
          ? new Date(change.fecha_implementacion) 
          : '',
        created_at: change.created_at 
          ? new Date(change.created_at) 
          : '',
        efectivo: change.efectivo ? 'Sí' : 'No',
        savfs: change.savfs || '',
      };
      const rowData = changesSheet.addRow(row);

      // Color por ambiente
      const ambienteColors = {
        DEV: 'E5E7EB',
        QA: 'DBEAFE',
        STG: 'F3E8FF',
        PRD: 'FEE2E2',
      };
      
      const cellColor = ambienteColors[change.ambiente] || 'FFFFFF';
      rowData.getCell('ambiente').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: cellColor },
      };
    }

    // Agregar filtros de tabla
    changesSheet.autoFilter = {
      from: 'A1',
      to: `A${changes.length + 1}`,
    };

    // ============================================
    // HOJA 2: Resumen por Ambiente (Tabla Dinámica)
    // ============================================
    const summarySheet = workbook.addWorksheet('Resumen por Ambiente', {
      properties: { tabColor: { argb: '10B981' } },
    });

    summarySheet.columns = [
      { header: 'Ambiente', key: 'ambiente', width: 15 },
      { header: 'Total', key: 'total', width: 10 },
      { header: 'Pendientes', key: 'pendientes', width: 15 },
      { header: 'En Progreso', key: 'en_progreso', width: 15 },
      { header: 'Completados', key: 'completados', width: 15 },
      { header: 'Cancelados', key: 'cancelados', width: 15 },
      { header: 'Efectivos', key: 'efectivos', width: 12 },
    ];

    summarySheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '10B981' },
      };
    });

    // Calcular resumen
    const summary = this.calculateSummary(changes);
    summary.forEach(s => summarySheet.addRow(s));

    // ============================================
    // HOJA 3: Ranking de Implementadores
    // ============================================
    const rankingSheet = workbook.addWorksheet('Ranking Implementadores', {
      properties: { tabColor: { argb: 'F59E0B' } },
    });

    rankingSheet.columns = [
      { header: 'Rank', key: 'rank', width: 8 },
      { header: 'Implementador', key: 'implementador', width: 25 },
      { header: 'Total Cambios', key: 'total', width: 15 },
      { header: 'Completados', key: 'completados', width: 15 },
      { header: 'Efectivos %', key: 'efectivos_pct', width: 12 },
    ];

    rankingSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F59E0B' },
      };
    });

    // Calcular ranking
    const ranking = this.calculateRanking(changes);
    ranking.forEach(r => rankingSheet.addRow(r));

    // ============================================
    // HOJA 4: Mensual (Barras para gráfico)
    // ============================================
    const monthlySheet = workbook.addWorksheet('Mensual', {
      properties: { tabColor: { argb: '8B5CF6' } },
    });

    monthlySheet.columns = [
      { header: 'Mes', key: 'mes', width: 15 },
      { header: 'Cambios', key: 'total', width: 12 },
    ];

    monthlySheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '8B5CF6' },
      };
    });

    // Calcular datos mensuales
    const monthly = this.calculateMonthlyData(changes);
    monthly.forEach(m => monthlySheet.addRow(m));

    // ============================================
    // HOJA 5: SAVFs detalladas
    // ============================================
    const savfSheet = workbook.addWorksheet('SAVFs Detalladas', {
      properties: { tabColor: { argb: 'EF4444' } },
    });

    savfSheet.columns = [
      { header: 'Cambio', key: 'cambio', width: 30 },
      { header: 'SAVF', key: 'savf', width: 25 },
      { header: 'Biblioteca', key: 'library', width: 15 },
      { header: 'Ambiente', key: 'ambiente', width: 12 },
      { header: 'Implementador', key: 'implementador', width: 20 },
    ];

    savfSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'EF4444' },
      };
    });

    // Obtener SAVFs detalladas
    const savfs = await this.getSAVFsData(filters);
    savfs.forEach(s => savfSheet.addRow(s));

    // ============================================
    // Generar buffer
    // ============================================
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Obtener datos de cambios con filtros
   */
  static async getChangesData(filters = {}) {
    let query = `
      SELECT c.*, 
        (SELECT string_agg(s.savf_name, ', ') FROM savf_list s WHERE s.change_id = c.id) as savfs
      FROM changes c
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (filters.fecha_desde) {
      query += ` AND c.created_at >= $${idx}`;
      params.push(filters.fecha_desde);
      idx++;
    }
    if (filters.fecha_hasta) {
      query += ` AND c.created_at <= $${idx}`;
      params.push(filters.fecha_hasta);
      idx++;
    }
    if (filters.ambiente) {
      query += ` AND c.ambiente = $${idx}`;
      params.push(filters.ambiente);
      idx++;
    }
    if (filters.estado) {
      query += ` AND c.estado = $${idx}`;
      params.push(filters.estado);
      idx++;
    }
    if (filters.tipo) {
      query += ` AND c.tipo = $${idx}`;
      params.push(filters.tipo);
      idx++;
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    return { data: result.rows };
  }

  /**
   * Obtener SAVFs detalladas
   */
  static async getSAVFsData(filters = {}) {
    let query = `
      SELECT c.titulo as cambio, s.savf_name as savf, s.savf_library as library,
             c.ambiente, c.implementador
      FROM savf_list s
      JOIN changes c ON s.change_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (filters.fecha_desde) {
      query += ` AND c.created_at >= $${idx}`;
      params.push(filters.fecha_desde);
      idx++;
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Calcular resumen por ambiente
   */
  static calculateSummary(changes) {
    const ambientes = ['DEV', 'QA', 'STG', 'PRD'];
    
    return ambientes.map(amb => {
      const ambChanges = changes.filter(c => c.ambiente === amb);
      return {
        ambiente: amb,
        total: ambChanges.length,
        pendientes: ambChanges.filter(c => c.estado === 'pendiente').length,
        en_progreso: ambChanges.filter(c => c.estado === 'en_progreso').length,
        completados: ambChanges.filter(c => c.estado === 'completado').length,
        cancelados: ambChanges.filter(c => c.estado === 'cancelado').length,
        efectivos: ambChanges.filter(c => c.efectivo).length,
      };
    });
  }

  /**
   * Calcular ranking de implementadores
   */
  static calculateRanking(changes) {
    const implementadores = {};
    
    changes.forEach(c => {
      if (c.implementador) {
        if (!implementadores[c.implementador]) {
          implementadores[c.implementador] = {
            implementador: c.implementador,
            total: 0,
            completados: 0,
            efectivos: 0,
          };
        }
        implementadores[c.implementador].total++;
        if (c.estado === 'completado') implementadores[c.implementador].completados++;
        if (c.efectivo) implementadores[c.implementador].efectivos++;
      }
    });

    return Object.values(implementadores)
      .sort((a, b) => b.total - a.total)
      .map((r, i) => ({
        ...r,
        rank: i + 1,
        efectivos_pct: r.total > 0 ? `${Math.round((r.efectivos / r.total) * 100)}%` : '0%',
      }));
  }

  /**
   * Calcular datos mensuales
   */
  static calculateMonthlyData(changes) {
    const months = {};
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    changes.forEach(c => {
      if (c.created_at) {
        const date = new Date(c.created_at);
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (!months[key]) months[key] = 0;
        months[key]++;
      }
    });

    return Object.entries(months).map(([mes, total]) => ({ mes, total }));
  }
}

module.exports = ExcelExportService;
