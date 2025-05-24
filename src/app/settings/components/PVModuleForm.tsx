import { useState } from 'react';

interface PVModuleFormProps {
  pvModules: any[];
  projects: any[];
  stations: any[];
  inverters: any[];
  onSubmit: (data: any) => void;
  onUpdate: (data: any) => void;
  onDelete: (data: any) => void;
}

const PVModuleForm: React.FC<PVModuleFormProps> = ({ 
  pvModules, 
  projects, 
  stations, 
  inverters, 
  onSubmit, 
  onUpdate, 
  onDelete 
}) => {
  const [formData, setFormData] = useState({
    id: null as number | null,
    project_id: '',
    station_id: '',
    inverter_id: '',
    alpha: '',
    pv_module_name: '',
    pv_module_type: '',
    pv_module_capacity: '',
    pv_module_number: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  // Filter stations based on selected project
  const filteredStations = formData.project_id
    ? stations.filter(station => station.project_id === parseInt(formData.project_id))
    : [];

  // Filter inverters based on selected station
  const filteredInverters = formData.station_id
    ? inverters.filter(inverter => inverter.station_id === parseInt(formData.station_id))
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdate(formData);
    } else {
      onSubmit(formData);
    }
    resetForm();
  };

  const handleEdit = (pvModule: any) => {
    setFormData({
      id: pvModule.id,
      project_id: pvModule.project_id || '',
      station_id: pvModule.station_id || '',
      inverter_id: pvModule.inverter_id || '',
      alpha: pvModule.alpha || '',
      pv_module_name: pvModule.pv_module_name || '',
      pv_module_type: pvModule.pv_module_type || '',
      pv_module_capacity: pvModule.pv_module_capacity || '',
      pv_module_number: pvModule.pv_module_number || ''
    });
    setIsEditing(true);
  };

  const handleDelete = (pvModule: any) => {
    if (window.confirm(`Are you sure you want to delete PV module ${pvModule.pv_module_name}?`)) {
      onDelete(pvModule);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      project_id: '',
      station_id: '',
      inverter_id: '',
      alpha: '',
      pv_module_name: '',
      pv_module_type: '',
      pv_module_capacity: '',
      pv_module_number: ''
    });
    setIsEditing(false);
  };

  // Handle project change
  const handleProjectChange = (projectId: string) => {
    setFormData({
      ...formData,
      project_id: projectId,
      station_id: '', // Reset station when project changes
      inverter_id: '' // Reset inverter when project changes
    });
  };

  // Handle station change
  const handleStationChange = (stationId: string) => {
    setFormData({
      ...formData,
      station_id: stationId,
      inverter_id: '' // Reset inverter when station changes
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="needs-validation" noValidate>
        <div className="row g-3">
          {/* Project */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <select
                className="form-select"
                id="project_id"
                value={formData.project_id}
                onChange={e => handleProjectChange(e.target.value)}
                required
              >
                <option value="">Select project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <label htmlFor="project_id">Project</label>
              <div className="invalid-feedback">
                Please select a project.
              </div>
            </div>
          </div>

          {/* Station */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <select
                className="form-select"
                id="station_id"
                value={formData.station_id}
                onChange={e => handleStationChange(e.target.value)}
                required
                disabled={!formData.project_id}
              >
                <option value="">Select station</option>
                {filteredStations.map(station => (
                  <option key={station.id} value={station.id}>{station.name}</option>
                ))}
              </select>
              <label htmlFor="station_id">Station</label>
              <div className="invalid-feedback">
                Please select a station.
              </div>
            </div>
          </div>

          {/* Inverter */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <select
                className="form-select"
                id="inverter_id"
                value={formData.inverter_id}
                onChange={e => setFormData({...formData, inverter_id: e.target.value})}
                required
                disabled={!formData.station_id}
              >
                <option value="">Select inverter</option>
                {filteredInverters.map(inverter => (
                  <option key={inverter.id} value={inverter.id}>
                    {inverter.inverter_id_platform} - {inverter.model}
                  </option>
                ))}
              </select>
              <label htmlFor="inverter_id">Inverter</label>
              <div className="invalid-feedback">
                Please select an inverter.
              </div>
            </div>
          </div>

          {/* PV Module Name */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="pv_module_name"
                placeholder="Enter PV module name"
                value={formData.pv_module_name}
                onChange={e => setFormData({...formData, pv_module_name: e.target.value})}
                required
              />
              <label htmlFor="pv_module_name">PV Module Name</label>
              <div className="invalid-feedback">
                Please enter a PV module name.
              </div>
            </div>
          </div>

          {/* PV Module Type */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="pv_module_type"
                placeholder="Enter PV module type"
                value={formData.pv_module_type}
                onChange={e => setFormData({...formData, pv_module_type: e.target.value})}
                required
              />
              <label htmlFor="pv_module_type">PV Module Type</label>
              <div className="invalid-feedback">
                Please enter a PV module type.
              </div>
            </div>
          </div>

          {/* Alpha */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="number"
                step="0.001"
                className="form-control"
                id="alpha"
                placeholder="Enter alpha value"
                value={formData.alpha}
                onChange={e => setFormData({...formData, alpha: e.target.value})}
                required
              />
              <label htmlFor="alpha">Alpha</label>
              <div className="invalid-feedback">
                Please enter an alpha value.
              </div>
            </div>
          </div>

          {/* PV Module Capacity */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="number"
                step="0.01"
                className="form-control"
                id="pv_module_capacity"
                placeholder="Enter PV module capacity"
                value={formData.pv_module_capacity}
                onChange={e => setFormData({...formData, pv_module_capacity: e.target.value})}
                required
              />
              <label htmlFor="pv_module_capacity">PV Module Capacity (W)</label>
              <div className="invalid-feedback">
                Please enter a PV module capacity.
              </div>
            </div>
          </div>

          {/* PV Module Number */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="number"
                className="form-control"
                id="pv_module_number"
                placeholder="Enter number of PV modules"
                value={formData.pv_module_number}
                onChange={e => setFormData({...formData, pv_module_number: e.target.value})}
                required
              />
              <label htmlFor="pv_module_number">Number of PV Modules</label>
              <div className="invalid-feedback">
                Please enter the number of PV modules.
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
            {isEditing ? 'Update PV Module' : 'Add PV Module'}
          </button>
        </div>
      </form>

      {/* PV Modules Table */}
      <div className="mt-4">
        <h3>PV Modules List</h3>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Project</th>
                <th>Station</th>
                <th>Inverter</th>
                <th>Capacity</th>
                <th>Number</th>
                <th>Alpha</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pvModules.map(pvModule => (
                <tr key={pvModule.id}>
                  <td>{pvModule.pv_module_name}</td>
                  <td>{pvModule.pv_module_type}</td>
                  <td>{projects.find(p => p.id === pvModule.project_id)?.name}</td>
                  <td>{stations.find(s => s.id === pvModule.station_id)?.name}</td>
                  <td>
                    {inverters.find(i => i.id === pvModule.inverter_id)?.inverter_id_platform}
                  </td>
                  <td>{pvModule.pv_module_capacity} W</td>
                  <td>{pvModule.pv_module_number}</td>
                  <td>{pvModule.alpha}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => handleEdit(pvModule)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(pvModule)}
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

export default PVModuleForm; 