import React, { useState, useEffect } from 'react';
import './TrabajadorModal.css';

const TrabajadorModal = ({ isOpen, mode, trabajador, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    zona: '',
    direccion: '',
    rol: 'tecnico_electrico',
    empresa: 'Interno',
    activo: true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && trabajador) {
      setFormData({
        nombre: trabajador.nombre || '',
        apellido: trabajador.apellido || '',
        dni: trabajador.dni || '',
        // Formatear la fecha por si viene con horas del backend (ej. 2023-10-25T00:00:00.000Z)
        fechaNacimiento: trabajador.fechaNacimiento ? trabajador.fechaNacimiento.split('T')[0] : '',
        zona: trabajador.zona || '',
        direccion: trabajador.direccion || '',
        rol: trabajador.rol || 'tecnico_electrico',
        empresa: trabajador.empresa || 'Interno',
        activo: trabajador.activo !== undefined ? trabajador.activo : true
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        dni: '',
        fechaNacimiento: '',
        zona: '',
        direccion: '',
        rol: 'tecnico_electrico',
        empresa: 'Interno',
        activo: true
      });
    }
    setErrors({});
  }, [mode, trabajador]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
    } else if (!/^\d{8}$/.test(formData.dni)) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      // EXTRACCIÓN LIMPIA: Solo enviamos los campos que la base de datos permite editar
      const payload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        rol: formData.rol,
        empresa: formData.empresa,
        activo: formData.activo,
        fechaNacimiento: formData.fechaNacimiento || null,
        zona: formData.zona || null,
        direccion: formData.direccion || null
      };

      await onSave(payload);
      
    } catch (err) {
      // MANEJO DE ERRORES MEJORADO: Capturamos el 400 Bad Request
      let errorMessage = 'Error al guardar el trabajador.';
      
      if (err.response && err.response.data) {
        console.error("Detalle del rechazo del backend (400):", err.response.data);
        // Intentamos extraer el mensaje de error que manda tu backend
        errorMessage = err.response.data.message || err.response.data.error || JSON.stringify(err.response.data);
      } else {
        console.error("Error general:", err);
      }
      
      setErrors({ submit: `Error: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'create' ? 'Nuevo Trabajador' : 'Editar Trabajador'}
          </h2>
          <button onClick={onClose} className="btn-close" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nombre" className="form-label">Nombre <span className="required">*</span></label>
              <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} className={`form-input ${errors.nombre ? 'input-error' : ''}`} placeholder="Ingrese el nombre" />
              {errors.nombre && <span className="error-message">{errors.nombre}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="apellido" className="form-label">Apellido <span className="required">*</span></label>
              <input type="text" id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} className={`form-input ${errors.apellido ? 'input-error' : ''}`} placeholder="Ingrese el apellido" />
              {errors.apellido && <span className="error-message">{errors.apellido}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dni" className="form-label">DNI <span className="required">*</span></label>
              <input type="text" id="dni" name="dni" value={formData.dni} onChange={handleChange} className={`form-input ${errors.dni ? 'input-error' : ''}`} placeholder="12345678" maxLength="8" />
              {errors.dni && <span className="error-message">{errors.dni}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="fechaNacimiento" className="form-label">Fecha de Nacimiento</label>
              <input type="date" id="fechaNacimiento" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="form-input" />
            </div>

            <div className="form-group">
              <label htmlFor="rol" className="form-label">Rol <span className="required">*</span></label>
              <select id="rol" name="rol" value={formData.rol} onChange={handleChange} className="form-input">
                <option value="tecnico_electrico">Técnico Eléctrico</option>
                <option value="tecnico_mecanico">Técnico Mecánico</option>
                <option value="operario_de_mantenimiento">Operario de Mantenimiento</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="empresa" className="form-label">Empresa <span className="required">*</span></label>
              <input type="text" id="empresa" name="empresa" value={formData.empresa} onChange={handleChange} className="form-input" placeholder="Nombre de la empresa" />
            </div>

            <div className="form-group">
              <label htmlFor="zona" className="form-label">Zona</label>
              <input type="text" id="zona" name="zona" value={formData.zona} onChange={handleChange} className="form-input" placeholder="Zona de trabajo" />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="direccion" className="form-label">Dirección</label>
              <input type="text" id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} className="form-input" placeholder="Dirección completa" />
            </div>

            <div className="form-group form-group-full">
              <label className="checkbox-label">
                <input type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} className="form-checkbox" />
                <span>Trabajador activo</span>
              </label>
            </div>
          </div>

          {errors.submit && (
            <div className="error-banner" style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '10px', borderRadius: '6px', marginTop: '15px', border: '1px solid #fecaca' }}>
              {errors.submit}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : (mode === 'create' ? 'Crear Trabajador' : 'Guardar Cambios')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrabajadorModal;