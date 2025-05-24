export interface PaginationParams {
  page?: string | null;
  limit?: string | null;
  sort?: string | null;
  order?: string | null;
}

export interface TimeRangeParams {
  startDate: string;
  endDate: string;
}

export interface QueryParams {
  startDate: string;
  endDate: string;
  page?: number;
  limit?: number;
  groupBy?: 'hour' | 'day' | 'month' | null;
  sort?: string | null;
  order?: 'asc' | 'desc' | null;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function validateTimeRange(startDate: string | null, endDate: string | null): boolean {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start.getTime() <= end.getTime() && !isNaN(start.getTime()) && !isNaN(end.getTime());
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.limit) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function getGroupByQuery(groupBy?: 'hour' | 'day' | 'month' | null) {
  if (!groupBy) return '';
  
  const groupByMap = {
    hour: "DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')",
    day: "DATE_FORMAT(timestamp, '%Y-%m-%d')",
    month: "DATE_FORMAT(timestamp, '%Y-%m-01')"
  };

  return groupByMap[groupBy] || '';
}

export function buildTimeSeriesQuery(
  tableName: string,
  idField: string,
  id: string | number | null,
  metrics: string[],
  params: QueryParams
): { query: string; values: any[] } {
  if (!id || !params.startDate || !params.endDate) {
    throw new Error('Missing required parameters');
  }

  const { startDate, endDate, groupBy } = params;
  const { limit, offset } = getPaginationParams({
    page: params.page?.toString(),
    limit: params.limit?.toString()
  });
  const sort = params.sort || 'timestamp';
  const order = (params.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC');

  const groupByExpr = getGroupByQuery(groupBy);
  const selectFields = groupBy
    ? `${groupByExpr} as timestamp, ${metrics.map(m => `AVG(${m}) as ${m}`).join(', ')}`
    : `timestamp, ${metrics.join(', ')}`;

  const query = `
    SELECT ${selectFields}
    FROM ${tableName}
    WHERE ${idField} = ?
    AND timestamp BETWEEN ? AND ?
    ${groupBy ? `GROUP BY ${groupByExpr}` : ''}
    ORDER BY timestamp ${order}
    LIMIT ? OFFSET ?
  `;

  return {
    query,
    values: [id, startDate, endDate, limit, offset]
  };
}

export interface TimeSeriesData {
  timestamp: string;
  power_active?: number;
  power_reactive?: number;
  energy?: number;
  pr?: number;
  temperature?: number;
  dc_power?: number;
  ambient_temperature?: number;
  pvmodule_temperature?: number;
  pvmodule_temperature1?: number;
  pvmodule_temperature2?: number;
  irradiation?: number;
  excess_power?: number;
  purchased_power?: number;
  excess_energy?: number;
  purchased_energy?: number;
  acb_status?: string;
}

export function validateTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

export function buildInsertQuery(
  tableName: string,
  idField: string,
  id: string | number,
  data: TimeSeriesData
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof TimeSeriesData] !== undefined);
  fields.push(idField);

  const values = fields.map(field => data[field as keyof TimeSeriesData]);
  values.push(id);

  const query = `
    INSERT INTO ${tableName} 
    (${fields.join(', ')}) 
    VALUES (${fields.map(() => '?').join(', ')})
  `;

  return { query, values };
}

export function buildUpdateQuery(
  tableName: string,
  idField: string,
  id: string | number,
  timestamp: string,
  data: Partial<TimeSeriesData>
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof TimeSeriesData] !== undefined);
  const values = fields.map(field => data[field as keyof TimeSeriesData]);

  const query = `
    UPDATE ${tableName}
    SET ${fields.map(field => `${field} = ?`).join(', ')}
    WHERE ${idField} = ? AND timestamp = ?
  `;

  return { query, values: [...values, id, timestamp] };
}

export function buildDeleteQuery(
  tableName: string,
  idField: string,
  id: string | number,
  timestamp: string
): { query: string; values: any[] } {
  const query = `
    DELETE FROM ${tableName}
    WHERE ${idField} = ? AND timestamp = ?
  `;

  return { query, values: [id, timestamp] };
}

export interface MPPTData {
  timestamp: string;
  status?: string;
  voltage?: number;
  current?: number;
}

export function buildMPPTQuery(
  inverterId: string | number | null,
  params: QueryParams
): { query: string; values: any[] } {
  if (!inverterId || !params.startDate || !params.endDate) {
    throw new Error('Missing required parameters');
  }

  const { startDate, endDate, groupBy } = params;
  const { limit, offset } = getPaginationParams({
    page: params.page?.toString(),
    limit: params.limit?.toString()
  });
  const sort = params.sort || 'timestamp';
  const order = (params.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC');

  const groupByExpr = getGroupByQuery(groupBy);
  const selectFields = groupBy
    ? `${groupByExpr} as timestamp, 
       MAX(status) as status,
       AVG(voltage) as voltage,
       AVG(current) as current`
    : 'timestamp, status, voltage, current';

  const query = `
    SELECT ${selectFields}
    FROM MPPT
    WHERE inverter_id = ?
    AND timestamp BETWEEN ? AND ?
    ${groupBy ? `GROUP BY ${groupByExpr}` : ''}
    ORDER BY timestamp ${order}
    LIMIT ? OFFSET ?
  `;

  return {
    query,
    values: [inverterId, startDate, endDate, limit, offset]
  };
}

export function buildMPPTInsertQuery(
  inverterId: string | number,
  data: MPPTData
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof MPPTData] !== undefined);
  fields.push('inverter_id');

  const values = fields.map(field => 
    field === 'inverter_id' ? inverterId : data[field as keyof MPPTData]
  );

  const query = `
    INSERT INTO MPPT 
    (${fields.join(', ')}) 
    VALUES (${fields.map(() => '?').join(', ')})
  `;

  return { query, values };
}

export function buildMPPTUpdateQuery(
  inverterId: string | number,
  timestamp: string,
  data: Partial<MPPTData>
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof MPPTData] !== undefined);
  const values = fields.map(field => data[field as keyof MPPTData]);

  const query = `
    UPDATE MPPT
    SET ${fields.map(field => `${field} = ?`).join(', ')}
    WHERE inverter_id = ? AND timestamp = ?
  `;

  return { query, values: [...values, inverterId, timestamp] };
}

export function buildMPPTDeleteQuery(
  inverterId: string | number,
  timestamp: string
): { query: string; values: any[] } {
  const query = `
    DELETE FROM MPPT
    WHERE inverter_id = ? AND timestamp = ?
  `;

  return { query, values: [inverterId, timestamp] };
}

export interface PVModuleData {
  project_id?: number;
  station_id?: number;
  inverter_id?: number;
  alpha?: number;
  pv_module_name?: string;
  pv_module_type?: string;
  pv_module_capacity?: number;
  pv_module_number?: number;
}

export function validatePVModuleData(data: PVModuleData): { isValid: boolean; error?: string } {
  if (data.pv_module_capacity && data.pv_module_capacity <= 0) {
    return { isValid: false, error: 'PV module capacity must be greater than 0' };
  }

  if (data.pv_module_number && data.pv_module_number <= 0) {
    return { isValid: false, error: 'PV module number must be greater than 0' };
  }

  if (data.alpha && (data.alpha < -1 || data.alpha > 1)) {
    return { isValid: false, error: 'Alpha coefficient must be between -1 and 1' };
  }

  return { isValid: true };
}

export function buildPVModuleQuery(
  params: {
    projectId?: string | null;
    stationId?: string | null;
    inverterId?: string | null;
  }
): { query: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];

  if (params.projectId) {
    conditions.push('project_id = ?');
    values.push(params.projectId);
  }

  if (params.stationId) {
    conditions.push('station_id = ?');
    values.push(params.stationId);
  }

  if (params.inverterId) {
    conditions.push('inverter_id = ?');
    values.push(params.inverterId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      id,
      project_id,
      station_id,
      inverter_id,
      alpha,
      pv_module_name,
      pv_module_type,
      pv_module_capacity,
      pv_module_number,
      pv_module_capacity * pv_module_number as total_capacity
    FROM pv_module
    ${whereClause}
    ORDER BY id ASC
  `;

  return { query, values };
}

export function buildPVModuleInsertQuery(
  data: PVModuleData
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof PVModuleData] !== undefined);
  const values = fields.map(field => data[field as keyof PVModuleData]);

  const query = `
    INSERT INTO pv_module 
    (${fields.join(', ')}) 
    VALUES (${fields.map(() => '?').join(', ')})
  `;

  return { query, values };
}

export function buildPVModuleUpdateQuery(
  id: string | number,
  data: Partial<PVModuleData>
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof PVModuleData] !== undefined);
  const values = fields.map(field => data[field as keyof PVModuleData]);

  const query = `
    UPDATE pv_module
    SET ${fields.map(field => `${field} = ?`).join(', ')}
    WHERE id = ?
  `;

  return { query, values: [...values, id] };
}

export function buildPVModuleDeleteQuery(
  id: string | number
): { query: string; values: any[] } {
  const query = `
    DELETE FROM pv_module
    WHERE id = ?
  `;

  return { query, values: [id] };
}

export type UserRole = 'admin' | 'project_owner' | 'station_owner' | 'operator';

export interface UserData {
  username: string;
  email?: string;
  password: string;
  role: UserRole;
}

export interface UserUpdateData {
  email?: string;
  password?: string;
  role?: UserRole;
}

export function validateUserData(data: Partial<UserData>, isUpdate = false): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

  if (!isUpdate) {
    if (!data.username || !usernameRegex.test(data.username)) {
      return { 
        isValid: false, 
        error: 'Username must be 3-30 characters long and can only contain letters, numbers, and underscores' 
      };
    }

    if (!data.password || !passwordRegex.test(data.password)) {
      return { 
        isValid: false, 
        error: 'Password must be at least 8 characters long and contain at least one letter and one number' 
      };
    }
  }

  if (data.email && !emailRegex.test(data.email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (data.role && !['admin', 'project_owner', 'station_owner', 'operator'].includes(data.role)) {
    return { isValid: false, error: 'Invalid role' };
  }

  return { isValid: true };
}

export function buildUserQuery(
  params: {
    username?: string | null;
    email?: string | null;
    role?: UserRole | null;
    page?: number;
    limit?: number;
  }
): { query: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];

  if (params.username) {
    conditions.push('username LIKE ?');
    values.push(`%${params.username}%`);
  }

  if (params.email) {
    conditions.push('email LIKE ?');
    values.push(`%${params.email}%`);
  }

  if (params.role) {
    conditions.push('role = ?');
    values.push(params.role);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const limit = params.limit || 10;
  const offset = ((params.page || 1) - 1) * limit;

  const query = `
    SELECT 
      id,
      username,
      email,
      role,
      created_at,
      updated_at
    FROM user
    ${whereClause}
    ORDER BY id ASC
    LIMIT ? OFFSET ?
  `;

  values.push(limit, offset);

  return { query, values };
}

export function buildUserCountQuery(
  params: {
    username?: string | null;
    email?: string | null;
    role?: UserRole | null;
  }
): { query: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];

  if (params.username) {
    conditions.push('username LIKE ?');
    values.push(`%${params.username}%`);
  }

  if (params.email) {
    conditions.push('email LIKE ?');
    values.push(`%${params.email}%`);
  }

  if (params.role) {
    conditions.push('role = ?');
    values.push(params.role);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT COUNT(*) as total
    FROM user
    ${whereClause}
  `;

  return { query, values };
}

export function buildUserInsertQuery(
  data: UserData
): { query: string; values: any[] } {
  const query = `
    INSERT INTO user (username, email, password, role)
    VALUES (?, ?, ?, ?)
  `;

  const values = [
    data.username,
    data.email || null,
    data.password, // Note: Password should be hashed before this point
    data.role
  ];

  return { query, values };
}

export function buildUserUpdateQuery(
  id: string | number,
  data: UserUpdateData
): { query: string; values: any[] } {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }

  if (data.password !== undefined) {
    fields.push('password = ?');
    values.push(data.password); // Note: Password should be hashed before this point
  }

  if (data.role !== undefined) {
    fields.push('role = ?');
    values.push(data.role);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');

  const query = `
    UPDATE user
    SET ${fields.join(', ')}
    WHERE id = ?
  `;

  values.push(id);

  return { query, values };
}

export function buildUserDeleteQuery(
  id: string | number
): { query: string; values: any[] } {
  const query = `
    DELETE FROM user
    WHERE id = ?
  `;

  return { query, values: [id] };
}

export interface ProjectData {
  name: string;
  id_project_platform: string;
  platform_type?: string;
  acc_platform?: string;
  pass_platform?: string;
  location?: string;
  description?: string;
  project_owner_id?: number;
  max_ac_capacity?: number;
  max_dc_capacity?: number;
}

export function buildProjectQuery(): { query: string; values: any[] } {
  const query = `
    SELECT 
      id,
      name,
      id_project_platform,
      platform_type,
      location,
      description,
      project_owner_id,
      max_ac_capacity,
      max_dc_capacity
    FROM project
    ORDER BY id ASC
  `;

  return { query, values: [] };
}

export function buildProjectInsertQuery(
  data: ProjectData
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof ProjectData] !== undefined);
  const values = fields.map(field => data[field as keyof ProjectData]);

  const query = `
    INSERT INTO project 
    (${fields.join(', ')}) 
    VALUES (${fields.map(() => '?').join(', ')})
  `;

  return { query, values };
}

export function buildProjectUpdateQuery(
  id: string | number,
  data: Partial<ProjectData>
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof ProjectData] !== undefined);
  const values = fields.map(field => data[field as keyof ProjectData]);

  const query = `
    UPDATE project
    SET ${fields.map(field => `${field} = ?`).join(', ')}
    WHERE id = ?
  `;

  return { query, values: [...values, id] };
}

export function buildProjectDeleteQuery(
  id: string | number
): { query: string; values: any[] } {
  const query = `
    DELETE FROM project
    WHERE id = ?
  `;

  return { query, values: [id] };
}

export interface StationData {
  name: string;
  id_station_platform: string;
  id_station_platform1?: string;
  location_longitude?: number;
  location_latitude?: number;
  description?: string;
  project_id?: number;
  station_owner_id?: number;
  max_ac_capacity?: number;
  max_dc_capacity?: number;
}

export function buildStationQuery(): { query: string; values: any[] } {
  const query = `
    SELECT 
      id,
      name,
      id_station_platform,
      id_station_platform1,
      location_longitude,
      location_latitude,
      description,
      project_id,
      station_owner_id,
      max_ac_capacity,
      max_dc_capacity
    FROM station
    ORDER BY id ASC
  `;

  return { query, values: [] };
}

export function buildStationInsertQuery(
  data: StationData
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof StationData] !== undefined);
  const values = fields.map(field => data[field as keyof StationData]);

  const query = `
    INSERT INTO station 
    (${fields.join(', ')}) 
    VALUES (${fields.map(() => '?').join(', ')})
  `;

  return { query, values };
}

export function buildStationUpdateQuery(
  id: string | number,
  data: Partial<StationData>
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof StationData] !== undefined);
  const values = fields.map(field => data[field as keyof StationData]);

  const query = `
    UPDATE station
    SET ${fields.map(field => `${field} = ?`).join(', ')}
    WHERE id = ?
  `;

  return { query, values: [...values, id] };
}

export function buildStationDeleteQuery(
  id: string | number
): { query: string; values: any[] } {
  const query = `
    DELETE FROM station
    WHERE id = ?
  `;

  return { query, values: [id] };
}

export interface InverterData {
  inverter_id_platform: string;
  model?: string;
  station_id?: number;
  max_ac_capacity?: number;
  max_dc_capacity?: number;
}

export function buildInverterQuery(): { query: string; values: any[] } {
  const query = `
    SELECT 
      id,
      inverter_id_platform,
      model,
      station_id,
      max_ac_capacity,
      max_dc_capacity
    FROM inverter
    ORDER BY id ASC
  `;

  return { query, values: [] };
}

export function buildInverterInsertQuery(
  data: InverterData
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof InverterData] !== undefined);
  const values = fields.map(field => data[field as keyof InverterData]);

  const query = `
    INSERT INTO inverter 
    (${fields.join(', ')}) 
    VALUES (${fields.map(() => '?').join(', ')})
  `;

  return { query, values };
}

export function buildInverterUpdateQuery(
  id: string | number,
  data: Partial<InverterData>
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof InverterData] !== undefined);
  const values = fields.map(field => data[field as keyof InverterData]);

  const query = `
    UPDATE inverter
    SET ${fields.map(field => `${field} = ?`).join(', ')}
    WHERE id = ?
  `;

  return { query, values: [...values, id] };
}

export function buildInverterDeleteQuery(
  id: string | number
): { query: string; values: any[] } {
  const query = `
    DELETE FROM inverter
    WHERE id = ?
  `;

  return { query, values: [id] };
}

export interface NotificationData {
  station_id: number;
  user_id: number;
  enabled?: boolean;
}

export function buildNotificationQuery(): { query: string; values: any[] } {
  const query = `
    SELECT 
      n.id,
      n.station_id,
      n.user_id,
      n.enabled,
      s.name as station_name,
      u.username as user_name
    FROM station_email_notifications n
    JOIN station s ON n.station_id = s.id
    JOIN user u ON n.user_id = u.id
    ORDER BY n.id ASC
  `;

  return { query, values: [] };
}

export function buildNotificationInsertQuery(
  data: NotificationData
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof NotificationData] !== undefined);
  const values = fields.map(field => data[field as keyof NotificationData]);

  const query = `
    INSERT INTO station_email_notifications 
    (${fields.join(', ')}) 
    VALUES (${fields.map(() => '?').join(', ')})
  `;

  return { query, values };
}

export function buildNotificationUpdateQuery(
  id: string | number,
  data: Partial<NotificationData>
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof NotificationData] !== undefined);
  const values = fields.map(field => data[field as keyof NotificationData]);

  const query = `
    UPDATE station_email_notifications
    SET ${fields.map(field => `${field} = ?`).join(', ')}
    WHERE id = ?
  `;

  return { query, values: [...values, id] };
}

export function buildNotificationDeleteQuery(
  id: string | number
): { query: string; values: any[] } {
  const query = `
    DELETE FROM station_email_notifications
    WHERE id = ?
  `;

  return { query, values: [id] };
}

export interface InverterRealtimeData {
  inverter_id: number;
  timestamp: string;
  power_active?: number;
  power_reactive?: number;
  voltage?: number;
  current?: number;
  frequency?: number;
  power_factor?: number;
  temperature?: number;
  status?: string;
}

export function buildInverterRealtimeQuery(
  inverterId?: string | number | null
): { query: string; values: any[] } {
  let query = `
    SELECT 
      r.*,
      i.inverter_id_platform,
      i.model as inverter_model,
      s.name as station_name
    FROM inverter_realtime r
    JOIN inverter i ON r.inverter_id = i.id
    JOIN station s ON i.station_id = s.id
  `;

  const values: any[] = [];

  if (inverterId) {
    query += ' WHERE r.inverter_id = ?';
    values.push(inverterId);
  }

  query += ' ORDER BY r.timestamp DESC';

  return { query, values };
}

export function buildInverterRealtimeUpsertQuery(
  data: InverterRealtimeData
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof InverterRealtimeData] !== undefined);
  const values = fields.map(field => data[field as keyof InverterRealtimeData]);
  const duplicateUpdates = fields
    .filter(field => field !== 'inverter_id')
    .map(field => `${field} = VALUES(${field})`);

  const query = `
    INSERT INTO inverter_realtime 
    (${fields.join(', ')}) 
    VALUES (${fields.map(() => '?').join(', ')})
    ON DUPLICATE KEY UPDATE
    ${duplicateUpdates.join(', ')}
  `;

  return { query, values };
}

export interface StationRealtimeData {
  station_id: number;
  timestamp: string;
  power_active?: number;
  power_reactive?: number;
  energy_today?: number;
  energy_total?: number;
  pr?: number;
  temperature?: number;
  irradiation?: number;
  status?: string;
}

export function buildStationRealtimeQuery(
  stationId?: string | number | null
): { query: string; values: any[] } {
  let query = `
    SELECT 
      r.*,
      s.name as station_name,
      s.location_longitude,
      s.location_latitude,
      p.name as project_name
    FROM station_realtime r
    JOIN station s ON r.station_id = s.id
    JOIN project p ON s.project_id = p.id
  `;

  const values: any[] = [];

  if (stationId) {
    query += ' WHERE r.station_id = ?';
    values.push(stationId);
  }

  query += ' ORDER BY r.timestamp DESC';

  return { query, values };
}

export function buildStationRealtimeUpsertQuery(
  data: StationRealtimeData
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof StationRealtimeData] !== undefined);
  const values = fields.map(field => data[field as keyof StationRealtimeData]);
  const duplicateUpdates = fields
    .filter(field => field !== 'station_id')
    .map(field => `${field} = VALUES(${field})`);

  const query = `
    INSERT INTO station_realtime 
    (${fields.join(', ')}) 
    VALUES (${fields.map(() => '?').join(', ')})
    ON DUPLICATE KEY UPDATE
    ${duplicateUpdates.join(', ')}
  `;

  return { query, values };
}

export interface ProjectRealtimeData {
  project_id: number;
  timestamp: string;
  power_active?: number;
  power_reactive?: number;
  energy_today?: number;
  energy_total?: number;
  pr?: number;
  excess_power?: number;
  purchased_power?: number;
  excess_energy?: number;
  purchased_energy?: number;
  status?: string;
}

export function buildProjectRealtimeQuery(
  projectId?: string | number | null
): { query: string; values: any[] } {
  let query = `
    SELECT 
      r.*,
      p.name as project_name,
      p.location,
      p.max_ac_capacity,
      p.max_dc_capacity
    FROM project_realtime r
    JOIN project p ON r.project_id = p.id
  `;

  const values: any[] = [];

  if (projectId) {
    query += ' WHERE r.project_id = ?';
    values.push(projectId);
  }

  query += ' ORDER BY r.timestamp DESC';

  return { query, values };
}

export function buildProjectRealtimeUpsertQuery(
  data: ProjectRealtimeData
): { query: string; values: any[] } {
  const fields = Object.keys(data).filter(key => data[key as keyof ProjectRealtimeData] !== undefined);
  const values = fields.map(field => data[field as keyof ProjectRealtimeData]);
  const duplicateUpdates = fields
    .filter(field => field !== 'project_id')
    .map(field => `${field} = VALUES(${field})`);

  const query = `
    INSERT INTO project_realtime 
    (${fields.join(', ')}) 
    VALUES (${fields.map(() => '?').join(', ')})
    ON DUPLICATE KEY UPDATE
    ${duplicateUpdates.join(', ')}
  `;

  return { query, values };
} 