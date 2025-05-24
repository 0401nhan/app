import { useState } from 'react';

interface StationFormProps {
  stations: any[];
  projects: any[];
  users: any[];
  onSubmit: (data: any) => void;
  onUpdate: (data: any) => void;
  onDelete: (data: any) => void;
}

const StationForm: React.FC<StationFormProps> = ({ stations, projects, users, onSubmit, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    id: null as number | null,
    name: '',
    id_station_platform: '',
    id_station_platform1: '',
    location_longitude: '',
    location_latitude: '',
    description: '',
    project_id: '',
    station_owner_id: '',
    max_ac_capacity: '',
    max_dc_capacity: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdate(formData);
    } else {
      onSubmit(formData);
    }
    resetForm();
  };

  const handleEdit = (station: any) => {
    setFormData({
      id: station.id,
      name: station.name,
      id_station_platform: station.id_station_platform,
      id_station_platform1: station.id_station_platform1 || '',
      location_longitude: station.location_longitude || '',
      location_latitude: station.location_latitude || '',
      description: station.description || '',
      project_id: station.project_id || '',
      station_owner_id: station.station_owner_id || '',
      max_ac_capacity: station.max_ac_capacity || '',
      max_dc_capacity: station.max_dc_capacity || ''
    });
    setIsEditing(true);
  };

  const handleDelete = (station: any) => {
    if (window.confirm(`Are you sure you want to delete station ${station.name}?`)) {
      onDelete(station);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      id_station_platform: '',
      id_station_platform1: '',
      location_longitude: '',
      location_latitude: '',
      description: '',
      project_id: '',
      station_owner_id: '',
      max_ac_capacity: '',
      max_dc_capacity: ''
    });
    setIsEditing(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="needs-validation" noValidate>
        <div className="row g-3">
          {/* Name */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="name"
                placeholder="Enter station name"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
              <label htmlFor="name">Station Name</label>
              <div className="invalid-feedback">
                Please enter a station name.
              </div>
            </div>
          </div>

          {/* Station Platform ID */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="id_station_platform"
                placeholder="Enter platform ID"
                value={formData.id_station_platform}
                onChange={e => setFormData({...formData, id_station_platform: e.target.value})}
                required
              />
              <label htmlFor="id_station_platform">Platform ID</label>
              <div className="invalid-feedback">
                Please enter a platform ID.
              </div>
            </div>
          </div>

          {/* Alternative Platform ID */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="id_station_platform1"
                placeholder="Enter alternative platform ID"
                value={formData.id_station_platform1}
                onChange={e => setFormData({...formData, id_station_platform1: e.target.value})}
              />
              <label htmlFor="id_station_platform1">Alternative Platform ID</label>
            </div>
          </div>

          {/* Project */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <select
                className="form-select"
                id="project_id"
                value={formData.project_id}
                onChange={e => setFormData({...formData, project_id: e.target.value})}
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

          {/* Station Owner */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <select
                className="form-select"
                id="station_owner_id"
                value={formData.station_owner_id}
                onChange={e => setFormData({...formData, station_owner_id: e.target.value})}
                required
              >
                <option value="">Select station owner</option>
                {users.filter(user => user.role === 'station_owner').map(user => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
              <label htmlFor="station_owner_id">Station Owner</label>
              <div className="invalid-feedback">
                Please select a station owner.
              </div>
            </div>
          </div>

          {/* Location Longitude */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="number"
                step="0.000001"
                className="form-control"
                id="location_longitude"
                placeholder="Enter longitude"
                value={formData.location_longitude}
                onChange={e => setFormData({...formData, location_longitude: e.target.value})}
              />
              <label htmlFor="location_longitude">Longitude</label>
            </div>
          </div>

          {/* Location Latitude */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="number"
                step="0.000001"
                className="form-control"
                id="location_latitude"
                placeholder="Enter latitude"
                value={formData.location_latitude}
                onChange={e => setFormData({...formData, location_latitude: e.target.value})}
              />
              <label htmlFor="location_latitude">Latitude</label>
            </div>
          </div>

          {/* Max AC Capacity */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="number"
                step="0.01"
                className="form-control"
                id="max_ac_capacity"
                placeholder="Enter max AC capacity"
                value={formData.max_ac_capacity}
                onChange={e => setFormData({...formData, max_ac_capacity: e.target.value})}
              />
              <label htmlFor="max_ac_capacity">Max AC Capacity (kW)</label>
            </div>
          </div>

          {/* Max DC Capacity */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="number"
                step="0.01"
                className="form-control"
                id="max_dc_capacity"
                placeholder="Enter max DC capacity"
                value={formData.max_dc_capacity}
                onChange={e => setFormData({...formData, max_dc_capacity: e.target.value})}
              />
              <label htmlFor="max_dc_capacity">Max DC Capacity (kW)</label>
            </div>
          </div>

          {/* Description */}
          <div className="col-12">
            <div className="form-floating mb-3">
              <textarea
                className="form-control"
                id="description"
                placeholder="Enter description"
                style={{ height: '100px' }}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <label htmlFor="description">Description</label>
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
            {isEditing ? 'Update Station' : 'Add Station'}
          </button>
        </div>
      </form>

      {/* Stations Table */}
      <div className="mt-4">
        <h3>Stations List</h3>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Platform ID</th>
                <th>Project</th>
                <th>Owner</th>
                <th>Location</th>
                <th>AC Capacity</th>
                <th>DC Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stations.map(station => (
                <tr key={station.id}>
                  <td>{station.name}</td>
                  <td>{station.id_station_platform}</td>
                  <td>{projects.find(p => p.id === station.project_id)?.name}</td>
                  <td>{users.find(u => u.id === station.station_owner_id)?.username}</td>
                  <td>
                    {station.location_latitude && station.location_longitude
                      ? `${station.location_latitude}, ${station.location_longitude}`
                      : '-'}
                  </td>
                  <td>{station.max_ac_capacity} kW</td>
                  <td>{station.max_dc_capacity} kW</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => handleEdit(station)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(station)}
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

export default StationForm; 