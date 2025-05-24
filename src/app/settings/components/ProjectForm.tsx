import { useState } from 'react';

interface ProjectFormProps {
  projects: any[];
  users: any[];
  onSubmit: (data: any) => void;
  onUpdate: (data: any) => void;
  onDelete: (data: any) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projects, users, onSubmit, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    id: null as number | null,
    name: '',
    id_project_platform: '',
    platform_type: '',
    acc_platform: '',
    pass_platform: '',
    location: '',
    description: '',
    project_owner_id: '',
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

  const handleEdit = (project: any) => {
    setFormData({
      id: project.id,
      name: project.name,
      id_project_platform: project.id_project_platform,
      platform_type: project.platform_type || '',
      acc_platform: project.acc_platform || '',
      pass_platform: project.pass_platform || '',
      location: project.location || '',
      description: project.description || '',
      project_owner_id: project.project_owner_id || '',
      max_ac_capacity: project.max_ac_capacity || '',
      max_dc_capacity: project.max_dc_capacity || ''
    });
    setIsEditing(true);
  };

  const handleDelete = (project: any) => {
    if (window.confirm(`Are you sure you want to delete project ${project.name}?`)) {
      onDelete(project);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      id_project_platform: '',
      platform_type: '',
      acc_platform: '',
      pass_platform: '',
      location: '',
      description: '',
      project_owner_id: '',
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
                placeholder="Enter project name"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
              <label htmlFor="name">Project Name</label>
              <div className="invalid-feedback">
                Please enter a project name.
              </div>
            </div>
          </div>

          {/* Project Platform ID */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="id_project_platform"
                placeholder="Enter platform ID"
                value={formData.id_project_platform}
                onChange={e => setFormData({...formData, id_project_platform: e.target.value})}
                required
              />
              <label htmlFor="id_project_platform">Platform ID</label>
              <div className="invalid-feedback">
                Please enter a platform ID.
              </div>
            </div>
          </div>

          {/* Platform Type */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="platform_type"
                placeholder="Enter platform type"
                value={formData.platform_type}
                onChange={e => setFormData({...formData, platform_type: e.target.value})}
              />
              <label htmlFor="platform_type">Platform Type</label>
            </div>
          </div>

          {/* Platform Account */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="acc_platform"
                placeholder="Enter platform account"
                value={formData.acc_platform}
                onChange={e => setFormData({...formData, acc_platform: e.target.value})}
              />
              <label htmlFor="acc_platform">Platform Account</label>
            </div>
          </div>

          {/* Platform Password */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                id="pass_platform"
                placeholder="Enter platform password"
                value={formData.pass_platform}
                onChange={e => setFormData({...formData, pass_platform: e.target.value})}
              />
              <label htmlFor="pass_platform">Platform Password</label>
            </div>
          </div>

          {/* Location */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="location"
                placeholder="Enter location"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
              <label htmlFor="location">Location</label>
            </div>
          </div>

          {/* Project Owner */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <select
                className="form-select"
                id="project_owner_id"
                value={formData.project_owner_id}
                onChange={e => setFormData({...formData, project_owner_id: e.target.value})}
                required
              >
                <option value="">Select project owner</option>
                {users.filter(user => user.role === 'project_owner').map(user => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
              <label htmlFor="project_owner_id">Project Owner</label>
              <div className="invalid-feedback">
                Please select a project owner.
              </div>
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
            {isEditing ? 'Update Project' : 'Add Project'}
          </button>
        </div>
      </form>

      {/* Projects Table */}
      <div className="mt-4">
        <h3>Projects List</h3>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Platform ID</th>
                <th>Location</th>
                <th>Owner</th>
                <th>AC Capacity</th>
                <th>DC Capacity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>{project.id_project_platform}</td>
                  <td>{project.location}</td>
                  <td>{users.find(u => u.id === project.project_owner_id)?.username}</td>
                  <td>{project.max_ac_capacity} kW</td>
                  <td>{project.max_dc_capacity} kW</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => handleEdit(project)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(project)}
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

export default ProjectForm; 