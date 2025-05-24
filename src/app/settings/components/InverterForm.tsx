import { useState } from 'react';

interface InverterFormProps {
  inverters: any[];
  stations: any[];
  onSubmit: (data: any) => void;
  onUpdate: (data: any) => void;
  onDelete: (data: any) => void;
}

const InverterForm: React.FC<InverterFormProps> = ({ inverters, stations, onSubmit, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    id: null as number | null,
    inverter_id_platform: '',
    model: '',
    station_id: '',
    max_ac_capacity: '',
    max_dc_capacity: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Required fields
    if (!formData.inverter_id_platform.trim()) {
      newErrors.inverter_id_platform = 'Inverter Platform ID is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }

    if (!formData.station_id) {
      newErrors.station_id = 'Station is required';
    }

    // Validate numeric fields
    if (formData.max_ac_capacity && isNaN(Number(formData.max_ac_capacity))) {
      newErrors.max_ac_capacity = 'Max AC Capacity must be a number';
    }

    if (formData.max_dc_capacity && isNaN(Number(formData.max_dc_capacity))) {
      newErrors.max_dc_capacity = 'Max DC Capacity must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Convert form data to match database types
    const submitData = {
      ...formData,
      station_id: formData.station_id ? parseInt(formData.station_id) : null,
      max_ac_capacity: formData.max_ac_capacity ? parseFloat(formData.max_ac_capacity) : null,
      max_dc_capacity: formData.max_dc_capacity ? parseFloat(formData.max_dc_capacity) : null
    };

    if (isEditing) {
      onUpdate(submitData);
    } else {
      onSubmit(submitData);
    }
  };

  const handleEdit = (inverter: any) => {
    setFormData({
      id: inverter.id,
      inverter_id_platform: inverter.inverter_id_platform || '',
      model: inverter.model || '',
      station_id: inverter.station_id?.toString() || '',
      max_ac_capacity: inverter.max_ac_capacity?.toString() || '',
      max_dc_capacity: inverter.max_dc_capacity?.toString() || ''
    });
    setIsEditing(true);
    setErrors({});
  };

  const handleDelete = (inverter: any) => {
    // Check if inverter has PV modules
    const hasPVModules = false; // This should be checked from props or API
    if (hasPVModules) {
      alert('Cannot delete inverter that has PV modules attached');
      return;
    }

    if (window.confirm(`Are you sure you want to delete inverter ${inverter.inverter_id_platform}?`)) {
      onDelete(inverter);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      inverter_id_platform: '',
      model: '',
      station_id: '',
      max_ac_capacity: '',
      max_dc_capacity: ''
    });
    setIsEditing(false);
    setErrors({});
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="needs-validation" noValidate>
        <div className="row g-3">
          {/* Inverter Platform ID */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className={`form-control ${errors.inverter_id_platform ? 'is-invalid' : ''}`}
                id="inverter_id_platform"
                placeholder="Enter inverter platform ID"
                value={formData.inverter_id_platform}
                onChange={e => {
                  setFormData({...formData, inverter_id_platform: e.target.value});
                  if (errors.inverter_id_platform) {
                    setErrors({...errors, inverter_id_platform: ''});
                  }
                }}
                required
              />
              <label htmlFor="inverter_id_platform">Inverter Platform ID</label>
              <div className="invalid-feedback">
                {errors.inverter_id_platform}
              </div>
            </div>
          </div>

          {/* Model */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className={`form-control ${errors.model ? 'is-invalid' : ''}`}
                id="model"
                placeholder="Enter model"
                value={formData.model}
                onChange={e => {
                  setFormData({...formData, model: e.target.value});
                  if (errors.model) {
                    setErrors({...errors, model: ''});
                  }
                }}
                required
              />
              <label htmlFor="model">Model</label>
              <div className="invalid-feedback">
                {errors.model}
              </div>
            </div>
          </div>

          {/* Station */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <select
                className={`form-select ${errors.station_id ? 'is-invalid' : ''}`}
                id="station_id"
                value={formData.station_id}
                onChange={e => {
                  setFormData({...formData, station_id: e.target.value});
                  if (errors.station_id) {
                    setErrors({...errors, station_id: ''});
                  }
                }}
                required
              >
                <option value="">Select station</option>
                {stations.map(station => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
              <label htmlFor="station_id">Station</label>
              <div className="invalid-feedback">
                {errors.station_id}
              </div>
            </div>
          </div>

          {/* Max AC Capacity */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="number"
                step="0.01"
                className={`form-control ${errors.max_ac_capacity ? 'is-invalid' : ''}`}
                id="max_ac_capacity"
                placeholder="Enter max AC capacity"
                value={formData.max_ac_capacity}
                onChange={e => {
                  setFormData({...formData, max_ac_capacity: e.target.value});
                  if (errors.max_ac_capacity) {
                    setErrors({...errors, max_ac_capacity: ''});
                  }
                }}
              />
              <label htmlFor="max_ac_capacity">Max AC Capacity (kW)</label>
              <div className="invalid-feedback">
                {errors.max_ac_capacity}
              </div>
            </div>
          </div>

          {/* Max DC Capacity */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="number"
                step="0.01"
                className={`form-control ${errors.max_dc_capacity ? 'is-invalid' : ''}`}
                id="max_dc_capacity"
                placeholder="Enter max DC capacity"
                value={formData.max_dc_capacity}
                onChange={e => {
                  setFormData({...formData, max_dc_capacity: e.target.value});
                  if (errors.max_dc_capacity) {
                    setErrors({...errors, max_dc_capacity: ''});
                  }
                }}
              />
              <label htmlFor="max_dc_capacity">Max DC Capacity (kW)</label>
              <div className="invalid-feedback">
                {errors.max_dc_capacity}
              </div>
            </div>
          </div>
        </div>

        <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
          <button 
            type="button" 
            className="btn btn-outline-secondary me-2"
            onClick={resetForm}
          >
            <i className="bi bi-x-circle me-2"></i>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <i className={`bi ${isEditing ? 'bi-save' : 'bi-plus-circle'} me-2`}></i>
            {isEditing ? 'Update Inverter' : 'Add Inverter'}
          </button>
        </div>
      </form>

      {/* Inverters Table */}
      <div className="mt-4">
        <h3>Inverters List</h3>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Platform ID</th>
                <th>Model</th>
                <th>Station</th>
                <th>AC Capacity</th>
                <th>DC Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inverters.map(inverter => (
                <tr key={inverter.id}>
                  <td>{inverter.inverter_id_platform}</td>
                  <td>{inverter.model}</td>
                  <td>{stations.find(s => s.id === inverter.station_id)?.name}</td>
                  <td>{inverter.max_ac_capacity} kW</td>
                  <td>{inverter.max_dc_capacity} kW</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => handleEdit(inverter)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(inverter)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InverterForm; 