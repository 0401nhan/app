'use client';

import { useState, useEffect } from 'react';
import { Tab, Tabs } from 'react-bootstrap';
import UserForm from './components/UserForm';
import ProjectForm from './components/ProjectForm';
import StationForm from './components/StationForm';
import InverterForm from './components/InverterForm';
import PVModuleForm from './components/PVModuleForm';
import MPPTForm from './components/MPPTForm';
import DataTree from './components/DataTree';
import DataOverview from './components/DataOverview';

const SettingsPage = () => {
  // --- States lưu dữ liệu
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [inverters, setInverters] = useState<any[]>([]);
  const [pvModules, setPvModules] = useState<any[]>([]);
  const [mppts, setMppts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Thêm state cho phân trang
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // --- Lấy data ban đầu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Lấy tất cả dữ liệu cần thiết
        const [usersRes, projectsRes, stationsRes, invertersRes, pvModulesRes, mpptsRes] = await Promise.all([
          fetch(`/api/users?page=${pagination.page}&limit=${pagination.limit}`),
          fetch('/api/projects'),
          fetch('/api/stations'),
          fetch('/api/inverters'),
          fetch('/api/pv-module'),
          fetch('/api/mppt'),
        ]);

        if (!usersRes.ok || !projectsRes.ok || !stationsRes.ok || !invertersRes.ok || !pvModulesRes.ok || !mpptsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [usersData, projectsData, stationsData, invertersData, pvModulesData, mpptsData] = await Promise.all([
          usersRes.json(),
          projectsRes.json(),
          stationsRes.json(),
          invertersRes.json(),
          pvModulesRes.json(),
          mpptsRes.json(),
        ]);

        if (usersData.data) {
          setUsers(usersData.data);
          setPagination(prev => ({
            ...prev,
            total: usersData.pagination.total,
            totalPages: usersData.pagination.totalPages
          }));
        }
        if (projectsData.data) setProjects(projectsData.data);
        if (stationsData.data) setStations(stationsData.data);
        setInverters(invertersData); // Inverters API trả về trực tiếp mảng
        if (pvModulesData.data) setPvModules(pvModulesData.data);
        if (mpptsData.data) setMppts(mpptsData.data);

      } catch (error) {
        console.error('Fetch error:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pagination.page, pagination.limit]); // Thêm dependencies

  // --- Hàm submit chung
  const handleSubmit = async (formType: string, data: any) => {
    try {
      let endpoint = '';
      switch (formType) {
        case 'users':
          endpoint = '/api/users';
          break;
        case 'projects':
          endpoint = '/api/projects';
          break;
        case 'stations':
          endpoint = '/api/stations';
          break;
        case 'inverters':
          endpoint = '/api/inverters';
          break;
        case 'pv-modules':
          endpoint = '/api/pv-module';
          break;
        case 'mppts':
          endpoint = '/api/mppt';
          break;
        default:
          throw new Error('Invalid form type');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Submit failed');
      }
      
      // Refresh data after successful submit
      const result = await response.json();
      if (result.id) {
        const newData = { ...data, id: result.id };
        switch (formType) {
          case 'users':
            setUsers(prev => [...prev, newData]);
            break;
          case 'projects':
            setProjects(prev => [...prev, newData]);
            break;
          case 'stations':
            setStations(prev => [...prev, newData]);
            break;
          case 'inverters':
            setInverters(prev => [...prev, newData]);
            break;
          case 'pv-modules':
            setPvModules(prev => [...prev, newData]);
            break;
          case 'mppts':
            setMppts(prev => [...prev, newData]);
            break;
        }
      }
      
      alert('Submit successful');
    } catch (error: any) {
      alert(error.message || 'Submit failed');
      console.error(error);
    }
  };

  // --- Hàm update chung
  const handleUpdate = async (formType: string, data: any) => {
    try {
      let endpoint = '';
      switch (formType) {
        case 'users':
          endpoint = `/api/users/${data.id}`;
          break;
        case 'projects':
          endpoint = `/api/projects/${data.id}`;
          break;
        case 'stations':
          endpoint = `/api/stations/${data.id}`;
          break;
        case 'inverters':
          endpoint = `/api/inverters/${data.id}`;
          break;
        case 'pv-modules':
          endpoint = `/api/pv-module/${data.id}`;
          break;
        case 'mppts':
          endpoint = `/api/mppt/${data.id}`;
          break;
        default:
          throw new Error('Invalid form type');
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      // Update local state
      switch (formType) {
        case 'users':
          setUsers(prev => prev.map(item => item.id === data.id ? data : item));
          break;
        case 'projects':
          setProjects(prev => prev.map(item => item.id === data.id ? data : item));
          break;
        case 'stations':
          setStations(prev => prev.map(item => item.id === data.id ? data : item));
          break;
        case 'inverters':
          setInverters(prev => prev.map(item => item.id === data.id ? data : item));
          break;
        case 'pv-modules':
          setPvModules(prev => prev.map(item => item.id === data.id ? data : item));
          break;
        case 'mppts':
          setMppts(prev => prev.map(item => item.id === data.id ? data : item));
          break;
      }

      alert('Update successful');
    } catch (error: any) {
      alert(error.message || 'Update failed');
      console.error(error);
    }
  };

  // --- Hàm delete chung
  const handleDelete = async (formType: string, data: any) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      let endpoint = '';
      switch (formType) {
        case 'users':
          endpoint = `/api/users/${data.id}`;
          break;
        case 'projects':
          endpoint = `/api/projects/${data.id}`;
          break;
        case 'stations':
          endpoint = `/api/stations/${data.id}`;
          break;
        case 'inverters':
          endpoint = `/api/inverters/${data.id}`;
          break;
        case 'pv-modules':
          endpoint = `/api/pv-module/${data.id}`;
          break;
        case 'mppts':
          endpoint = `/api/mppt/${data.id}`;
          break;
        default:
          throw new Error('Invalid form type');
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      // Update local state
      switch (formType) {
        case 'users':
          setUsers(prev => prev.filter(item => item.id !== data.id));
          break;
        case 'projects':
          setProjects(prev => prev.filter(item => item.id !== data.id));
          break;
        case 'stations':
          setStations(prev => prev.filter(item => item.id !== data.id));
          break;
        case 'inverters':
          setInverters(prev => prev.filter(item => item.id !== data.id));
          break;
        case 'pv-modules':
          setPvModules(prev => prev.filter(item => item.id !== data.id));
          break;
        case 'mppts':
          setMppts(prev => prev.filter(item => item.id !== data.id));
          break;
      }

      alert('Delete successful');
    } catch (error: any) {
      alert(error.message || 'Delete failed');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Settings</h1>

          {/* Forms Section */}
          <div>
            <h2 className="mb-3">Data Management</h2>
            <Tabs defaultActiveKey="users" className="mb-4">
              <Tab eventKey="users" title="Users">
                <div className="p-3">
                  <UserForm 
                    users={users}
                    onSubmit={(data) => handleSubmit('users', data)}
                    onUpdate={(data) => handleUpdate('users', data)}
                    onDelete={(data) => handleDelete('users', data)}
                  />
                </div>
              </Tab>

              <Tab eventKey="projects" title="Projects">
                <div className="p-3">
                  <ProjectForm 
                    users={users}
                    projects={projects}
                    onSubmit={(data) => handleSubmit('projects', data)}
                    onUpdate={(data) => handleUpdate('projects', data)}
                    onDelete={(data) => handleDelete('projects', data)}
                  />
                </div>
              </Tab>

              <Tab eventKey="stations" title="Stations">
                <div className="p-3">
                  <StationForm 
                    projects={projects}
                    users={users}
                    stations={stations}
                    onSubmit={(data) => handleSubmit('stations', data)}
                    onUpdate={(data) => handleUpdate('stations', data)}
                    onDelete={(data) => handleDelete('stations', data)}
                  />
                </div>
              </Tab>

              <Tab eventKey="inverters" title="Inverters">
                <div className="p-3">
                  <InverterForm 
                    stations={stations}
                    inverters={inverters}
                    onSubmit={(data) => handleSubmit('inverters', data)}
                    onUpdate={(data) => handleUpdate('inverters', data)}
                    onDelete={(data) => handleDelete('inverters', data)}
                  />
                </div>
              </Tab>

              <Tab eventKey="pvmodules" title="PV Modules">
                <div className="p-3">
                  <PVModuleForm 
                    projects={projects}
                    stations={stations}
                    inverters={inverters}
                    pvModules={pvModules}
                    onSubmit={(data) => handleSubmit('pv-modules', data)}
                    onUpdate={(data) => handleUpdate('pv-modules', data)}
                    onDelete={(data) => handleDelete('pv-modules', data)}
                  />
                </div>
              </Tab>

              <Tab eventKey="mppts" title="MPPTs">
                <div className="p-3">
                  <MPPTForm 
                    stations={stations}
                    inverters={inverters}
                    mppts={mppts}
                    onSubmit={(data) => handleSubmit('mppts', data)}
                    onUpdate={(data) => handleUpdate('mppts', data)}
                    onDelete={(data) => handleDelete('mppts', data)}
                  />
                </div>
              </Tab>
            </Tabs>
          </div>

          {/* Data Overview Section */}
          <div className="mb-5">
            <h2 className="mb-3">Data Overview</h2>
            <DataOverview 
              data={{
                projects,
                stations,
                inverters,
                pvModules
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 