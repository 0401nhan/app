import React, { useState } from 'react';
import { FaChevronRight, FaChevronDown, FaSolarPanel, FaIndustry, FaServer, FaMicrochip } from 'react-icons/fa';

interface TreeNode {
  id: number;
  name: string;
  type: 'project' | 'station' | 'inverter' | 'pvmodule';
  children?: TreeNode[];
  data?: any;
}

interface DataTreeProps {
  data: {
    projects: any[];
    stations: any[];
    inverters: any[];
    pvModules: any[];
  };
  onNodeClick?: (node: TreeNode) => void;
}

const DataTree: React.FC<DataTreeProps> = ({ data, onNodeClick }) => {
  const [expandedNodes, setExpandedNodes] = useState<number[]>([]);

  const toggleNode = (nodeId: number) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Build tree structure from flat data
  const buildTree = (): TreeNode[] => {
    const tree: TreeNode[] = data.projects.map(project => ({
      id: project.id,
      name: project.name,
      type: 'project',
      data: project,
      children: []
    }));

    // Add stations to projects
    data.stations.forEach(station => {
      const projectNode = tree.find(p => p.id === station.project_id);
      if (projectNode) {
        if (!projectNode.children) projectNode.children = [];
        projectNode.children.push({
          id: station.id,
          name: station.name,
          type: 'station',
          data: station,
          children: []
        });
      }
    });

    // Add inverters to stations
    data.inverters.forEach(inverter => {
      tree.forEach(project => {
        if (project.children) {
          const stationNode = project.children.find(s => s.id === inverter.station_id);
          if (stationNode) {
            if (!stationNode.children) stationNode.children = [];
            stationNode.children.push({
              id: inverter.id,
              name: `${inverter.inverter_id_platform} - ${inverter.model}`,
              type: 'inverter',
              data: inverter,
              children: []
            });
          }
        }
      });
    });

    // Add PV modules to inverters
    data.pvModules.forEach(pvModule => {
      tree.forEach(project => {
        if (project.children) {
          project.children.forEach(station => {
            if (station.children) {
              const inverterNode = station.children.find(i => i.id === pvModule.inverter_id);
              if (inverterNode) {
                if (!inverterNode.children) inverterNode.children = [];
                inverterNode.children.push({
                  id: pvModule.id,
                  name: `${pvModule.pv_module_name} (${pvModule.pv_module_number} units)`,
                  type: 'pvmodule',
                  data: pvModule
                });
              }
            }
          });
        }
      });
    });

    return tree;
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FaIndustry className="text-primary" />;
      case 'station':
        return <FaSolarPanel className="text-success" />;
      case 'inverter':
        return <FaServer className="text-warning" />;
      case 'pvmodule':
        return <FaMicrochip className="text-info" />;
      default:
        return null;
    }
  };

  const getNodeDetails = (node: TreeNode) => {
    switch (node.type) {
      case 'project':
        return `(${node.data.max_ac_capacity} kW AC / ${node.data.max_dc_capacity} kW DC)`;
      case 'station':
        return `(${node.data.location_latitude}, ${node.data.location_longitude})`;
      case 'inverter':
        return `(${node.data.max_ac_capacity} kW AC)`;
      case 'pvmodule':
        return `(${node.data.pv_module_capacity} W)`;
      default:
        return '';
    }
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.includes(node.id);

    return (
      <div key={node.id} style={{ marginLeft: `${level * 20}px` }}>
        <div 
          className="d-flex align-items-center py-2 px-3 hover-bg-light cursor-pointer"
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
            if (onNodeClick) onNodeClick(node);
          }}
          style={{ cursor: 'pointer' }}
        >
          <span className="me-2">
            {hasChildren ? (
              isExpanded ? <FaChevronDown /> : <FaChevronRight />
            ) : (
              <span style={{ width: '16px', display: 'inline-block' }}></span>
            )}
          </span>
          <span className="me-2">{getNodeIcon(node.type)}</span>
          <span className="me-2">{node.name}</span>
          <small className="text-muted">{getNodeDetails(node)}</small>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree();

  return (
    <div className="border rounded p-3 bg-white">
      <div className="mb-3">
        <div className="d-flex align-items-center mb-2">
          <FaIndustry className="text-primary me-2" /> <span>Project</span>
        </div>
        <div className="d-flex align-items-center mb-2">
          <FaSolarPanel className="text-success me-2" /> <span>Station</span>
        </div>
        <div className="d-flex align-items-center mb-2">
          <FaServer className="text-warning me-2" /> <span>Inverter</span>
        </div>
        <div className="d-flex align-items-center">
          <FaMicrochip className="text-info me-2" /> <span>PV Module</span>
        </div>
      </div>
      <hr />
      {tree.map(node => renderNode(node))}
    </div>
  );
};

export default DataTree; 