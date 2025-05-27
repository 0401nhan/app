'use client';

import { useState, useEffect } from 'react';
import { Form, Button, Table } from 'react-bootstrap';
import { ChangeEvent } from 'react';

interface MPPTFormProps {
  stations: any[];
  inverters: any[];
  mppts: any[];
  onSubmit: (data: any) => void;
  onUpdate: (data: any) => void;
  onDelete: (data: any) => void;
}

const MPPTForm = ({ stations, inverters, mppts, onSubmit, onUpdate, onDelete }: MPPTFormProps) => {
  const [formData, setFormData] = useState({
    id: '',
    station_id: '',
    inverter_id: '',
    mppt_platform_id: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [filteredInverters, setFilteredInverters] = useState<any[]>([]);

  // Lọc inverter theo station được chọn
  useEffect(() => {
    if (formData.station_id) {
      const stationInverters = inverters.filter(inv => inv.station_id === Number(formData.station_id));
      setFilteredInverters(stationInverters);
      // Reset inverter selection when station changes
      setFormData(prev => ({
        ...prev,
        inverter_id: ''
      }));
    } else {
      setFilteredInverters([]);
    }
  }, [formData.station_id, inverters]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdate(formData);
    } else {
      onSubmit(formData);
    }
   
  };

  const handleEdit = (mppt: any) => {
    const inverter = inverters.find(inv => inv.id === mppt.inverter_id);
    setFormData({
      id: mppt.id,
      station_id: inverter?.station_id.toString() || '',
      inverter_id: mppt.inverter_id,
      mppt_platform_id: mppt.mppt_platform_id,
    });
    setIsEditing(true);
  };

  const handleDelete = (mppt: any) => {
    onDelete(mppt);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      station_id: '',
      inverter_id: '',
      mppt_platform_id: '',
    });
    setIsEditing(false);
  };

  return (
    <div>
      <Form onSubmit={handleSubmit} className="mb-4">
        <Form.Group className="mb-3">
          <Form.Label>Station</Form.Label>
          <Form.Select
            name="station_id"
            value={formData.station_id}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Station</option>
            {stations.map(station => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Inverter</Form.Label>
          <Form.Select
            name="inverter_id"
            value={formData.inverter_id}
            onChange={handleInputChange}
            required
            disabled={!formData.station_id}
          >
            <option value="">Select Inverter</option>
            {filteredInverters.map(inverter => (
              <option key={inverter.id} value={inverter.id}>
                {inverter.inverter_id_platform}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>MPPT Platform ID</Form.Label>
          <Form.Control
            type="text"
            name="mppt_platform_id"
            value={formData.mppt_platform_id}
            onChange={handleInputChange}
            required
            placeholder="Enter MPPT Platform ID"
          />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit" variant="primary">
            {isEditing ? 'Update' : 'Submit'}
          </Button>
          {isEditing && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </Form>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Station</th>
            <th>Inverter</th>
            <th>MPPT Platform ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {mppts.map(mppt => {
            const inverter = inverters.find(inv => inv.id === mppt.inverter_id);
            const station = stations.find(st => st.id === inverter?.station_id);
            return (
              <tr key={mppt.id}>
                <td>{mppt.id}</td>
                <td>{station?.name}</td>
                <td>{inverter?.inverter_id_platform}</td>
                <td>{mppt.mppt_platform_id}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button variant="warning" size="sm" onClick={() => handleEdit(mppt)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(mppt)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default MPPTForm; 