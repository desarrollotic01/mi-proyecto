import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { trabajadorService } from '../../mantenimiento/services/trabajadoresService';
import TrabajadorModal from '../components/TrabajadorModal';
import ModalImportMasivo from '../../../components/inputs/ModalImportMasivo';
import { usePagination } from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';
import './TrabajadorPage.css';

const TrabajadoresPage = () => {
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('all');
  const [filterEmpresa, setFilterEmpresa] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrabajador, setSelectedTrabajador] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    loadTrabajadores();
  }, []);

  const loadTrabajadores = async () => {
    try {
      setLoading(true);
      const data = await trabajadorService.getTrabajadores();
      setTrabajadores(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los trabajadores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTrabajador(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEdit = (trabajador) => {
    setSelectedTrabajador(trabajador);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de desactivar este trabajador?')) {
      try {
        await trabajadorService.deleteTrabajador(id);
        loadTrabajadores();
      } catch (err) {
        alert('Error al desactivar el trabajador');
        console.error(err);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTrabajador(null);
  };

  const handleModalSave = async (payloadLimpio) => {
    try {
      if (modalMode === 'create') {
        await trabajadorService.createTrabajador(payloadLimpio);
      } else {
        await trabajadorService.updateTrabajador(selectedTrabajador.id, payloadLimpio);
      }
      loadTrabajadores();
      handleModalClose();
    } catch (err) {
      throw err; 
    }
  };

  const filteredTrabajadores = trabajadores.filter(trabajador => {
    const matchesSearch = 
      trabajador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trabajador.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trabajador.dni.includes(searchTerm);
    
    const matchesRol = filterRol === 'all' || trabajador.rol === filterRol;
    const matchesEmpresa = filterEmpresa === 'all' || trabajador.empresa === filterEmpresa;

    return matchesSearch && matchesRol && matchesEmpresa;
  });

  const roles = [...new Set(trabajadores.map(t => t.rol))];
  const empresas = [...new Set(trabajadores.map(t => t.empresa))];

  const { currentPage, setCurrentPage, totalPages, paginatedItems, totalItems, startIndex } =
    usePagination(filteredTrabajadores, 100);

  const exportarExcel = () => {
    const data = filteredTrabajadores.map((t, i) => ({
      "#": i + 1,
      Nombre: t.nombre || "",
      Apellido: t.apellido || "",
      DNI: t.dni || "",
      Empresa: t.empresa || "",
      Rol: getRolLabel(t.rol) || "",
      Zona: t.zona || "",
      Dirección: t.direccion || "",
      "Fecha Nacimiento": t.fechaNacimiento || "",
      Estado: t.activo ? "Activo" : "Inactivo",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trabajadores");
    XLSX.writeFile(wb, `Trabajadores_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const getRolLabel = (rol) => {
    const labels = {
      'tecnico_electrico': 'Técnico Eléctrico',
      'tecnico_mecanico': 'Técnico Mecánico',
      'operario_de_mantenimiento': 'Operario de Mantenimiento',
      'supervisor': 'Supervisor',
      'analista_de_mantenimiento': 'Analista de Mantenimiento',
      'programador_de_mantenimiento': 'Programador de Mantenimiento',
      'coordinador_de_mantenimiento': 'Coordinador de Mantenimiento',
    };
    return labels[rol] || rol;
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (error) return <div className="error-container"><p>{error}</p><button onClick={loadTrabajadores}>Reintentar</button></div>;

  return (
    <div className="layout-content">
      <div className="top-header">
        <div className="title-wrapper">
          <svg className="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <h1 className="main-title">Gestión de Trabajadores</h1>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadTrabajadores} title="Actualizar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
          </button>
          <button onClick={exportarExcel} className="btn-primary" style={{ background: '#0284c7' }}>
            ↓ EXPORTAR EXCEL
          </button>
          <button onClick={() => setImportOpen(true)} className="btn-primary" style={{ background: '#16a34a' }}>
            ↑ IMPORTAR EXCEL
          </button>
          <button onClick={handleCreate} className="btn-primary">
            + NUEVO REGISTRO
          </button>
        </div>
      </div>

      <div className="search-card">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar identificación, nombre, dni..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="inline-filters">
          <select value={filterRol} onChange={(e) => setFilterRol(e.target.value)}>
            <option value="all">Todos los roles</option>
            {roles.map(rol => <option key={rol} value={rol}>{getRolLabel(rol)}</option>)}
          </select>
          <select value={filterEmpresa} onChange={(e) => setFilterEmpresa(e.target.value)}>
            <option value="all">Todas las empresas</option>
            {empresas.map(empresa => <option key={empresa} value={empresa}>{empresa}</option>)}
          </select>
        </div>
      </div>

      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th width="5%">#</th>
              <th width="25%">DATOS PERSONALES</th>
              <th width="25%">DATOS LABORALES</th>
              <th width="25%">UBICACIÓN & FECHAS</th>
              <th width="10%">ESTADO</th>
              <th width="10%" className="text-right">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr><td colSpan="6" className="empty-state">No se encontraron registros</td></tr>
            ) : (
              paginatedItems.map((trabajador, index) => (
                <tr key={trabajador.id}>
                  <td className="row-number">{startIndex + index + 1}</td>
                  
                  {/* DATOS PERSONALES: Nombre, Apellido, DNI */}
                  <td>
                    <div className="cell-group">
                      <span className="data-title text-black">{trabajador.nombre.toUpperCase()}</span>
                      <span className="data-label">APELLIDO: <strong>{trabajador.apellido}</strong></span>
                      <span className="data-label">DNI: <strong className="text-blue">{trabajador.dni}</strong></span>
                    </div>
                  </td>
                  
                  {/* DATOS LABORALES: Empresa, Rol */}
                  <td>
                    <div className="cell-group">
                      <span className="data-title text-black">{trabajador.empresa ? trabajador.empresa.toUpperCase() : 'N/A'}</span>
                      <span className="data-label">ROL: <strong>{getRolLabel(trabajador.rol)}</strong></span>
                    </div>
                  </td>

                  {/* UBICACIÓN & FECHAS: Zona, Dirección, Fecha de Nacimiento */}
                  <td>
                    <div className="cell-group">
                      <span className="data-label">ZONA: <strong>{trabajador.zona || 'N/A'}</strong></span>
                      <span className="data-label">DIRECCIÓN: <strong>{trabajador.direccion || 'N/A'}</strong></span>
                      <span className="data-label">F. NACIMIENTO: <strong>{trabajador.fechaNacimiento || 'N/A'}</strong></span>
                    </div>
                  </td>

                  {/* ESTADO: Activo o Inactivo */}
                  <td>
                    <div className="cell-group">
                      <span className="data-label">
                        <strong className={trabajador.activo ? 'text-green' : 'text-red'}>
                           {trabajador.activo ? '● Activo' : '● Inactivo'}
                        </strong>
                      </span>
                    </div>
                  </td>
                  
                  {/* ACCIONES */}
                  <td>
                    <div className="actions-group">
                      <button className="btn-action view" title="Ver detalle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </button>
                      <button onClick={() => handleEdit(trabajador)} className="btn-action edit" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button onClick={() => handleDelete(trabajador.id)} className="btn-action delete" title="Desactivar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '0 0 16px 0' }}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={100}
          onPageChange={setCurrentPage}
        />
      </div>

      {isModalOpen && (
        <TrabajadorModal
          isOpen={isModalOpen}
          mode={modalMode}
          trabajador={selectedTrabajador}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
      <ModalImportMasivo
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        entidadInicial="trabajadores"
        onSuccess={loadTrabajadores}
      />
    </div>
  );
};

export default TrabajadoresPage;