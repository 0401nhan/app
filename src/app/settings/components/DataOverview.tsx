import React, { useState } from 'react';
import DataTree from './DataTree';

interface DataOverviewProps {
  data: {
    projects: any[];
    stations: any[];
    inverters: any[];
    pvModules: any[];
  };
}

const DataOverview: React.FC<DataOverviewProps> = ({ data }) => {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
  };

  const renderDetails = () => {
    if (!selectedNode) return null;

    const renderValue = (value: any) => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      return value;
    };

    const excludeFields = ['id', 'children', 'type'];
    const details = Object.entries(selectedNode.data || selectedNode)
      .filter(([key]) => !excludeFields.includes(key))
      .map(([key, value]) => ({
        key: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: renderValue(value)
      }));

    return (
      <div className="border rounded p-3 bg-white">
        <h5 className="mb-3">
          {selectedNode.name} Details
        </h5>
        <div className="table-responsive">
          <table className="table table-sm">
            <tbody>
              {details.map(({ key, value }) => (
                <tr key={key}>
                  <th style={{ width: '40%' }}>{key}</th>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-7">
          <DataTree data={data} onNodeClick={handleNodeClick} />
        </div>
        <div className="col-md-5">
          {renderDetails()}
        </div>
      </div>
    </div>
  );
};

export default DataOverview; 