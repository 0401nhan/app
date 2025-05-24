import { useState } from 'react';

interface UserFormProps {
  users: any[];
  onSubmit: (data: any) => void;
  onUpdate: (data: any) => void;
  onDelete: (data: any) => void;
}

const UserForm: React.FC<UserFormProps> = ({ users, onSubmit, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState({
    id: null as number | null,
    username: '',
    email: '',
    password: '',
    role: '',
    is_active: true
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

  const handleEdit = (user: any) => {
    setFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      password: '', // Don't set password for security
      role: user.role,
      is_active: user.is_active
    });
    setIsEditing(true);
  };

  const handleDelete = (user: any) => {
    if (window.confirm(`Are you sure you want to delete user ${user.username}?`)) {
      onDelete(user);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      username: '',
      email: '',
      password: '',
      role: '',
      is_active: true
    });
    setIsEditing(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="needs-validation" noValidate>
        <div className="row g-3">
          {/* Username */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                required
              />
              <label htmlFor="username">Username</label>
              <div className="invalid-feedback">
                Please enter a username.
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
              <label htmlFor="email">Email</label>
              <div className="invalid-feedback">
                Please enter a valid email.
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required={!isEditing} // Password only required for new users
              />
              <label htmlFor="password">Password {isEditing && '(Leave blank to keep current)'}</label>
              <div className="invalid-feedback">
                Please enter a password.
              </div>
            </div>
          </div>

          {/* Role */}
          <div className="col-md-6">
            <div className="form-floating mb-3">
              <select
                className="form-select"
                id="role"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                required
              >
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="project_owner">Project Owner</option>
                <option value="station_owner">Station Owner</option>
                <option value="operator">Operator</option>
              </select>
              <label htmlFor="role">Role</label>
              <div className="invalid-feedback">
                Please select a role.
              </div>
            </div>
          </div>

          {/* Is Active */}
          <div className="col-12">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e => setFormData({...formData, is_active: e.target.checked})}
              />
              <label className="form-check-label" htmlFor="is_active">
                Active Account
              </label>
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
            {isEditing ? 'Update User' : 'Add User'}
          </button>
        </div>
      </form>

      {/* Users Table */}
      <div className="mt-4">
        <h3>Users List</h3>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() => handleEdit(user)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(user)}
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

export default UserForm; 