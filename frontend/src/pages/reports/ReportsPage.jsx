import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { requestService } from '../../services/requestService';
import { userService } from '../../services/userService';
import { apiClient } from '../../services/apiClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

const ReportsPage = () => {
  const [originalRequests, setOriginalRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [allSectors, setAllSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');

  // Cargar datos iniciales
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);

        // Cargar solicitudes
        const allRequestsData = await requestService.getAllPermissionRequests();
        setOriginalRequests(allRequestsData);

        // Cargar sectores
        const sectorsResponse = await apiClient.get('/sectors');
        const sectors = sectorsResponse.data.sectors || [];
        setAllSectors(sectors);

        setFilteredRequests(allRequestsData);
      } catch (error) {
        console.error('Error al cargar datos del reporte:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...originalRequests];

    // Filtrar por fecha - manejar correctamente las zonas horarias
    if (startDate) {
      // Convertir la fecha de inicio al inicio del día en UTC
      const [startYear, startMonth, startDay] = startDate.split('-');
      const startDateObj = new Date(Date.UTC(startYear, startMonth - 1, startDay));
      filtered = filtered.filter(req => {
        // Convertir la fecha del request a UTC para comparación
        const reqDate = new Date(req.createdAt);
        const reqUTC = new Date(Date.UTC(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate()));
        return reqUTC >= startDateObj;
      });
    }

    if (endDate) {
      // Convertir la fecha de fin al final del día en UTC
      const [endYear, endMonth, endDay] = endDate.split('-');
      const endDateObj = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999));
      filtered = filtered.filter(req => {
        // Convertir la fecha del request a UTC para comparación
        const reqDate = new Date(req.createdAt);
        const reqUTC = new Date(Date.UTC(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate(), 23, 59, 59, 999));
        return reqUTC <= endDateObj;
      });
    }

    // Filtrar por sector
    if (sectorFilter !== 'ALL') {
      filtered = filtered.filter(req => req.sectorId === sectorFilter);
    }

    setFilteredRequests(filtered);
  }, [startDate, endDate, sectorFilter, originalRequests]);

  // Preparar datos para gráficos
  const getRequestStatsByStatus = () => {
    if (!filteredRequests || filteredRequests.length === 0) return [];
    
    const statusCounts = filteredRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(statusCounts).map(status => ({
      name: status,
      count: statusCounts[status]
    }));
  };

  const getRequestStatsBySector = () => {
    if (!filteredRequests || filteredRequests.length === 0) return [];
    
    const sectorCounts = filteredRequests.reduce((acc, req) => {
      const sectorName = req.sector.name;
      acc[sectorName] = (acc[sectorName] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(sectorCounts).map(sector => ({
      name: sector,
      count: sectorCounts[sector]
    }));
  };

  const getRequestsByType = () => {
    if (!filteredRequests || filteredRequests.length === 0) return [];
    
    const typeCounts = filteredRequests.reduce((acc, req) => {
      const typeName = req.type.name;
      acc[typeName] = (acc[typeName] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(typeCounts).map(type => ({
      name: type,
      count: typeCounts[type]
    }));
  };

  const getStatusColors = (status) => {
    switch (status) {
      case 'APPROVED': return '#10B981'; // verde
      case 'PENDING': return '#F59E0B'; // amarillo
      case 'REJECTED': return '#EF4444'; // rojo
      default: return '#6B7280'; // gris
    }
  };

  const getSectorColors = (index) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    return colors[index % colors.length];
  };

  // Funciones para exportar
  const exportToPDF = async () => {
    const element = document.getElementById('reports-content');
    
    // Configurar html2canvas con opciones para mejorar la calidad del PDF
    const canvas = await html2canvas(element, {
      scale: 2, // Mayor resolución
      useCORS: true, // Permitir imágenes de otros dominios
      allowTaint: true, // Permitir que el canvas sea contaminado
      backgroundColor: '#ffffff', // Fondo blanco para evitar el gris
      scrollX: 0,
      scrollY: -window.scrollY
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Agregar título al PDF
    pdf.setFontSize(20);
    pdf.setTextColor(33, 33, 33); // Gris oscuro
    pdf.setFont(undefined, 'bold');
    pdf.text('Reporte Gerencial', 105, 15, { align: 'center' }); // Centrado horizontalmente
    
    // Agregar subtítulo con información de filtrado
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    let yPos = 25;
    
    if (startDate || endDate) {
      const dateRangeText = `Rango de fechas: ${startDate || 'Inicio'} a ${endDate || 'Actual'}`;
      pdf.text(dateRangeText, 105, yPos, { align: 'center' });
      yPos += 7;
    }
    
    if (sectorFilter !== 'ALL' && allSectors.length > 0) {
      const sectorName = allSectors.find(s => s.id === sectorFilter)?.name || 'N/A';
      const sectorText = `Sector: ${sectorName}`;
      pdf.text(sectorText, 105, yPos, { align: 'center' });
      yPos += 7;
    }
    
    yPos += 5; // Espacio adicional antes del contenido principal
    
    const imgWidth = 190; // Ancho reducido para dejar margen
    const pageHeight = 280; // Altura reducida para dejar margen
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth, imgHeight); // Dejar margen izquierdo y espacio para el título
    heightLeft -= (pageHeight - yPos);

    // Agregar más páginas si es necesario
    while (heightLeft > 0) {
      pdf.addPage();
      pdf.setFontSize(20);
      pdf.setTextColor(33, 33, 33);
      pdf.setFont(undefined, 'bold');
      pdf.text('Reporte Gerencial', 105, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      let newYPos = 25;
      
      if (startDate || endDate) {
        const dateRangeText = `Rango de fechas: ${startDate || 'Inicio'} a ${endDate || 'Actual'}`;
        pdf.text(dateRangeText, 105, newYPos, { align: 'center' });
        newYPos += 7;
      }
      
      if (sectorFilter !== 'ALL' && allSectors.length > 0) {
        const sectorName = allSectors.find(s => s.id === sectorFilter)?.name || 'N/A';
        const sectorText = `Sector: ${sectorName}`;
        pdf.text(sectorText, 105, newYPos, { align: 'center' });
        newYPos += 7;
      }
      
      newYPos += 5;
      pdf.addImage(imgData, 'PNG', 10, newYPos, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Agregar información de fecha de generación del reporte
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString('es-ES');
    pdf.text(`Reporte generado el: ${currentDate}`, 105, 287, { align: 'center' });

    pdf.save('reportes_permisos.pdf');
  };

  const exportToExcel = () => {
    // Preparar datos para Excel
    const excelData = filteredRequests.map(request => ({
      'Empleado': request.user.name,
      'Sector': request.sector.name,
      'Tipo de Permiso': request.type.name,
      'Fecha Desde': new Date(request.startDate).toLocaleDateString('es-ES'),
      'Fecha Hasta': new Date(request.endDate).toLocaleDateString('es-ES'),
      'Estado': request.status === 'APPROVED' ? 'Aprobado' :
                request.status === 'REJECTED' ? 'Rechazado' : 'Pendiente',
      'Fecha de Solicitud': new Date(request.createdAt).toLocaleDateString('es-ES')
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Permisos');
    
    // Guardar el archivo
    XLSX.writeFile(wb, 'reportes_permisos.xlsx');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  const statusData = getRequestStatsByStatus();
  const sectorData = getRequestStatsBySector();
  const typeData = getRequestsByType();
  
  // Datos para línea de tiempo
  const timelineData = filteredRequests
    .reduce((acc, req) => {
      const date = new Date(req.createdAt).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {})
  
  const timelineArray = Object.keys(timelineData).map(date => ({
    date: new Date(date).toLocaleDateString('es-ES'),
    count: timelineData[date]
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="lg:flex lg:items-center lg:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Reportes Gerenciales
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Información relevante para la toma de decisiones
            </p>
          </div>
        </div>

        {/* Controles de filtro */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="sectorFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Sector
              </label>
              <select
                id="sectorFilter"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Todos los sectores</option>
                {allSectors.map(sector => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={exportToPDF}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md mr-2"
              >
                Exportar PDF
              </button>
              <button
                onClick={exportToExcel}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
              >
                Exportar Excel
              </button>
            </div>
          </div>
        </div>

        {/* Contenido para exportar */}
        <div id="reports-content">
          {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de barras por estado */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Solicitudes por Estado</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Cantidad']}
                    labelFormatter={(name) => `Estado: ${name}`}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Cantidad de solicitudes">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColors(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de barras por sector */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Solicitudes por Sector</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Cantidad']}
                    labelFormatter={(name) => `Sector: ${name}`}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Cantidad de solicitudes">
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSectorColors(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de pastel por tipo de permiso */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Tipo de Permiso</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSectorColors(index)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'Cantidad']}
                    labelFormatter={(name) => `Tipo: ${name}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de línea por período */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Solicitudes por Fecha</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineArray}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Cantidad']}
                    labelFormatter={(date) => `Fecha: ${date}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Cantidad de solicitudes" 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        </div> {/* Fin del contenido para exportar - cierre del div id="reports-content" */}

        {/* Tabla de datos filtrados */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Registros Filtrados</h3>
            <div className="text-sm text-gray-500">
              {filteredRequests.length} registros encontrados
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Permiso
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Solicitud
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.sector.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.type.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.startDate).toLocaleDateString('es-ES')} - {new Date(request.endDate).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status === 'APPROVED' ? 'Aprobado' :
                           request.status === 'REJECTED' ? 'Rechazado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString('es-ES')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay datos para mostrar con los filtros actuales
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;