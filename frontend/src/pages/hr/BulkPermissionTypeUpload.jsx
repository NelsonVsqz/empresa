import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';

const BulkPermissionTypeUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Por favor selecciona un archivo para subir' });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadStatus({ type: 'info', message: 'Subiendo archivo...' });
      setUploadProgress(30); // Simular progreso

      const response = await apiClient.post('/permission-types/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadProgress(100);
      setUploadStatus({ 
        type: 'success', 
        message: `Carga exitosa: ${response.data.totalProcessed} tipos de permiso procesados, ${response.data.successCount} creados, ${response.data.errorCount} con errores` 
      });
    } catch (error) {
      setUploadProgress(0);
      setUploadStatus({ 
        type: 'error', 
        message: `Error en la carga: ${error.response?.data?.error || error.message}` 
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Carga Masiva de Tipos de Permiso</h2>

        {/* Formulario de carga */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Subir archivo de tipos de permiso</h3>
          
          <form onSubmit={handleUpload}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instrucciones
              </label>
              <p className="text-sm text-gray-600 mb-4">
                El archivo debe ser un Excel con las columnas: name, description
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar archivo
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Sube tu archivo</span>
                      <input 
                        id="file" 
                        name="file" 
                        type="file" 
                        className="sr-only" 
                        accept=".xlsx, .xls" 
                        onChange={handleFileChange} 
                      />
                    </label>
                    <p className="pl-1">o arrástralo aquí</p>
                  </div>
                  <p className="text-xs text-gray-500">Excel hasta 10MB</p>
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Archivo seleccionado: <span className="font-medium">{selectedFile.name}</span>
                </p>
              </div>
            )}

            <div className="mb-6">
              <button
                type="submit"
                disabled={!selectedFile}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  selectedFile 
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Subir Archivo
              </button>
            </div>
          </form>
        </div>

        {/* Barra de progreso */}
        {uploadProgress > 0 && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Mensaje de estado */}
        {uploadStatus && (
          <div className={`p-4 rounded-md ${
            uploadStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : uploadStatus.type === 'error' 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {uploadStatus.type === 'success' && (
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {uploadStatus.type === 'error' && (
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {uploadStatus.type === 'info' && (
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  uploadStatus.type === 'success' 
                    ? 'text-green-800' 
                    : uploadStatus.type === 'error' 
                      ? 'text-red-800' 
                      : 'text-blue-800'
                }`}>
                  {uploadStatus.message}
                </h3>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default BulkPermissionTypeUpload;