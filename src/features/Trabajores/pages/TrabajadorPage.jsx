import React, { useState, useEffect } from 'react';
import { trabajadorService } from '../../mantenimiento/services/trabajadoresService';
import TrabajadorModal from '../components/TrabajadorModal';
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
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'

  // Cargar trabajadores al montar el componente
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

  const handleModalSave = async (trabajadorData) => {
    try {
      if (modalMode === 'create') {
        await trabajadorService.createTrabajador(trabajadorData);
      } else {
        await trabajadorService.updateTrabajador(selectedTrabajador.id, trabajadorData);
      }
      loadTrabajadores();
      handleModalClose();
    } catch (err) {
      throw err; // El modal manejará el error
    }
  };

  // Filtrado de trabajadores
  const filteredTrabajadores = trabajadores.filter(trabajador => {
    const matchesSearch = 
      trabajador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trabajador.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trabajador.dni.includes(searchTerm);
    
    const matchesRol = filterRol === 'all' || trabajador.rol === filterRol;
    const matchesEmpresa = filterEmpresa === 'all' || trabajador.empresa === filterEmpresa;

    return matchesSearch && matchesRol && matchesEmpresa;
  });

  // Obtener roles únicos
  const roles = [...new Set(trabajadores.map(t => t.rol))];
  const empresas = [...new Set(trabajadores.map(t => t.empresa))];

  const getRolLabel = (rol) => {
    const labels = {
      'tecnico_electrico': 'Técnico Eléctrico',
      'tecnico_mecanico': 'Técnico Mecánico',
      'operario_de_mantenimiento': 'Operario de Mantenimiento',
      'supervisor': 'Supervisor'
    };
    return labels[rol] || rol;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando trabajadores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={loadTrabajadores} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="trabajadores-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Gestión de Trabajadores</h1>
          <p className="page-subtitle">
            {trabajadores.length} trabajadores registrados
          </p>
        </div>
        <button onClick={handleCreate} className="btn-create">
          <span className="btn-icon">+</span>
          Nuevo Trabajador
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los roles</option>
            {roles.map(rol => (
              <option key={rol} value={rol}>{getRolLabel(rol)}</option>
            ))}
          </select>

          <select
            value={filterEmpresa}
            onChange={(e) => setFilterEmpresa(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todas las empresas</option>
            {empresas.map(empresa => (
              <option key={empresa} value={empresa}>{empresa}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="trabajadores-table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>DNI</th>
              <th>Puesto de Trabajo</th>
              <th>Empresa</th>
              <th>Estado</th>
              <th>Acciones</th>
           
            </tr>
          </thead>
          <tbody>
            {filteredTrabajadores.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No se encontraron trabajadores
                </td>
              </tr>
            ) : (
              filteredTrabajadores.map((trabajador) => (
                <tr key={trabajador.id} className="table-row">
                  <td className="worker-name">
                    <div className="avatar">
                      {trabajador.nombre.charAt(0)}{trabajador.apellido.charAt(0)}
                    </div>
                    <span>{trabajador.nombre} {trabajador.apellido}</span>
                  </td>
                  <td className="dni-cell">{trabajador.dni}</td>
                  <td>
                    <span className={`rol-badge rol-${trabajador.rol}`}>
                      {getRolLabel(trabajador.rol)}
                    </span>
                  </td>
                  <td className="empresa-cell">{trabajador.empresa}</td>
                  <td>
                    <span className={`status-badge ${trabajador.activo ? 'status-active' : 'status-inactive'}`}>
                      {trabajador.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleEdit(trabajador)}
                      className="btn-action btn-edit"
                      title="Editar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(trabajador.id)}
                      className="btn-action btn-delete"
                      title="Desactivar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
    </div>
  );
};

export default TrabajadoresPage;