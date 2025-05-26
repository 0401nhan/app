import mysql from 'mysql2/promise';
import { scadaAuth } from './scadaAuth';
import axios from 'axios';

interface Project {
    id: number;
    name: string;
    id_project_platform: string;
    platform_type: string;
    acc_platform: string;
    pass_platform: string;
}

interface Station {
    id: number;
    name: string;
    id_station_platform: string;
    project_id: number;
}

interface ScadaDataPoint {
    ExtensionData: any;
    Name: string;
    Status: string;
    TimeStamp: string;
    Value: string;
}

interface ScadaResponse {
    Status: boolean;
    Result: ScadaDataPoint[];
}

class ScadaService {
    private dbConfig: any;
    private currentProject: Project | null = null;
    private readonly API_URL = 'http://sol-scada.com/DataRealTime/Read';

    constructor() {
        this.dbConfig = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
        };
    }

    async getScadaProjects(): Promise<Project[]> {
        const connection = await mysql.createConnection(this.dbConfig);
        try {
            const [rows] = await connection.execute(
                'SELECT id, name, id_project_platform, platform_type, acc_platform, pass_platform FROM project WHERE platform_type = ?',
                ['SCADA']
            );
            return rows as Project[];
        } finally {
            await connection.end();
        }
    }

    async getProjectStations(projectId: number): Promise<Station[]> {
        const connection = await mysql.createConnection(this.dbConfig);
        try {
            const [rows] = await connection.execute(
                'SELECT id, name, id_station_platform FROM station WHERE project_id = ?',
                [projectId]
            );
            return rows as Station[];
        } finally {
            await connection.end();
        }
    }

    private async loginWithProjectCredentials(project: Project) {
        try {
            console.log(`\n🔐 Kiểm tra đăng nhập cho project ${project.name}...`);
            console.log(`📝 Project details: ID=${project.id}, Platform=${project.id_project_platform}`);

            if (this.currentProject?.id !== project.id || !scadaAuth.isLoggedIn()) {
                console.log(`🔄 Cần đăng nhập mới cho project ${project.name}`);
                console.log(`   Lý do: ${this.currentProject?.id !== project.id ? 'Khác project' : 'Không có session'}`);

                if (scadaAuth.isLoggedIn()) {
                    console.log('🔒 Đăng xuất session cũ...');
                    await scadaAuth.logout();
                }

                console.log(`🔑 Đang đăng nhập với tài khoản: ${project.acc_platform}`);
                const loginResult = await scadaAuth.login(project.acc_platform, project.pass_platform);

                if (!loginResult.success) {
                    console.error(`❌ Đăng nhập thất bại:`, loginResult.message);
                    throw new Error(`Không thể đăng nhập SCADA cho project ${project.name}: ${loginResult.message}`);
                }

                this.currentProject = project;
                console.log(`✅ Đăng nhập thành công cho project ${project.name}`);
                console.log(`🍪 Session cookies:`, scadaAuth.getCookies());
            } else {
                console.log(`✓ Đang sử dụng session hiện tại cho project ${project.name}`);
                console.log(`🍪 Session cookies hiện tại:`, scadaAuth.getCookies());
            }
        } catch (error) {
            console.error(`❌ Lỗi trong quá trình đăng nhập SCADA:`, error);
            this.currentProject = null;
            throw error;
        }
    }

    async fetchAndSaveStationData(station: Station, project: Project) {
        const connection = await mysql.createConnection(this.dbConfig);
        try {
            console.log(`🔄 Đang fetch dữ liệu cho station ${station.name}...`);

            await this.loginWithProjectCredentials(project);

            const stationData = await this.fetchStationData(station.id_station_platform);
            console.log('📊 Dữ liệu station:', stationData);

            await this.saveStationData(connection, station.id, stationData);

            console.log('🔄 Đang fetch dữ liệu inverter...');
            await this.fetchAndSaveInverterData(connection, station);

            console.log(`✅ Đã cập nhật dữ liệu cho station ${station.name}`);
        } catch (error) {
            console.error(`❌ Lỗi chi tiết khi cập nhật dữ liệu station ${station.name}:`, error);
            throw error;
        } finally {
            await connection.end();
        }
    }

    private async fetchDataFromScada(requestData: string[]): Promise<ScadaResponse> {
        try {
            const cookies = scadaAuth.getCookies();
            if (!cookies) {
                throw new Error('Chưa đăng nhập SCADA!');
            }

            console.log('📡 Gửi request tới SCADA API...');
            const response = await axios.post(this.API_URL, requestData, {
                headers: {
                    'Cookie': cookies.join('; '),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.data || !response.data.Result) {
                throw new Error('SCADA API trả về dữ liệu không hợp lệ');
            }

            console.log(`✅ Nhận được ${response.data.Result.length} điểm dữ liệu từ SCADA`);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                console.error('❌ SCADA API error:', {
                    status: error.response.status,
                    data: error.response.data
                });
            }
            throw new Error(`Lỗi khi lấy dữ liệu từ SCADA: ${error.message}`);
        }
    }

    private generateStationRequestData(stationId: string): string[] {
        return [
            `ITN${stationId}Common.DailyEnergy`,
            `ITN${stationId}Common.MonthlyEnergy`,
            `ITN${stationId}Common.YearlyEnergy`,
            `${stationId}PowerMeter.ActivePower`,
            `${stationId}PowerMeter.ReactivePower`,
            `${stationId}PowerMeter.TotalEnergy`,
            `${stationId}Weather.AmbientTemp`,
            `${stationId}Weather.Irradiation`,
            `${stationId}Weather.PVmoduleTemp1`,
            `${stationId}Weather.PVmoduleTemp2`
        ];
    }

    private parseScadaValue(value: string): number {
        return parseFloat(value) || 0;
    }

    private async fetchStationData(stationPlatformId: string) {
        const requestData = this.generateStationRequestData(stationPlatformId);
        const response = await this.fetchDataFromScada(requestData);

        const getValue = (name: string) => {
            const point = response.Result.find(p => p.Name === name);
            return point ? this.parseScadaValue(point.Value) : 0;
        };

        return {
            power_active: getValue(`${stationPlatformId}PowerMeter.ActivePower`),
            power_reactive: getValue(`${stationPlatformId}PowerMeter.ReactivePower`),
            energy: getValue(`${stationPlatformId}PowerMeter.TotalEnergy`),
            daily_energy: getValue(`ITN${stationPlatformId}Common.DailyEnergy`),
            monthly_energy: getValue(`ITN${stationPlatformId}Common.MonthlyEnergy`),
            yearly_energy: getValue(`ITN${stationPlatformId}Common.YearlyEnergy`),
            ambient_temperature: getValue(`${stationPlatformId}Weather.AmbientTemp`),
            pvmodule_temperature1: getValue(`${stationPlatformId}Weather.PVmoduleTemp1`),
            pvmodule_temperature2: getValue(`${stationPlatformId}Weather.PVmoduleTemp2`),
            irradiation: getValue(`${stationPlatformId}Weather.Irradiation`)
        };
    }

    private async saveStationData(connection: mysql.Connection, stationId: number, data: any) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const values = {
            station_id: stationId,
            timestamp: timestamp,
            power_active: data.power_active || 0,
            power_reactive: data.power_reactive || 0,
            energy: data.energy || 0,
            pr: data.pr || 0,
            ambient_temperature: data.ambient_temperature || 0,
            pvmodule_temperature1: data.pvmodule_temperature1 || 0,
            pvmodule_temperature2: data.pvmodule_temperature2 || 0,
            irradiation: data.irradiation || 0,
            excess_power: data.excess_power || 0,
            purchased_power: data.purchased_power || 0,
            excess_energy: data.excess_energy || 0,
            purchased_energy: data.purchased_energy || 0
        };

        await connection.execute(
            `INSERT INTO station_realtime 
            (station_id, timestamp, power_active, power_reactive, energy, pr,
            ambient_temperature, pvmodule_temperature1, pvmodule_temperature2,
            irradiation, excess_power, purchased_power, excess_energy, purchased_energy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                values.station_id,
                values.timestamp,
                values.power_active,
                values.power_reactive,
                values.energy,
                values.pr,
                values.ambient_temperature,
                values.pvmodule_temperature1,
                values.pvmodule_temperature2,
                values.irradiation,
                values.excess_power,
                values.purchased_power,
                values.excess_energy,
                values.purchased_energy
            ]
        );

        console.log(`✅ Đã lưu dữ liệu realtime cho station ${stationId}`);
    }

    private async fetchAndSaveInverterData(connection: mysql.Connection, station: Station) {
        try {
            console.log(`🔍 Đang lấy danh sách inverter cho station ${station.name}...`);
            const [inverters] = await connection.execute(
                'SELECT id, inverter_id_platform FROM inverter WHERE station_id = ?',
                [station.id]
            );
            console.log(`📋 Tìm thấy ${(inverters as any[]).length} inverters`);

            for (const inverter of inverters as any[]) {
                try {
                    // Lấy inverter id số để tạo tag, giả sử inverter_id_platform kiểu 'Inverter1' => lấy số 1
                    const inverterIdMatch = inverter.inverter_id_platform.match(/\d+$/);
                    const inverterId = inverterIdMatch ? inverterIdMatch[0] : '';

                    const stationIdPlatform = station.id_station_platform;

                    console.log(`\n⚡ Đang xử lý inverter: ${inverter.inverter_id_platform}`);

                    // Các tag cần lấy dữ liệu
                    const requestData = [
                        `${stationIdPlatform}${inverter.inverter_id_platform}.OutputActivePower`,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.OutputReactivePower`,
                        `ITN${stationIdPlatform}Energy.DailyEnergyINV${inverterId}`,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.InverterTemperature`,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.DCPower`,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.GridVoltageA`,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.GridVoltageB`,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.GridVoltageC`,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.GridCurrentA`,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.GridCurrentB`,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.GridCurrentC`
                    ];

                    console.log('📡 Tag names:', requestData);

                    const response = await this.fetchDataFromScada(requestData);
                    console.log('📊 SCADA response:', response);

                    const getValue = (name: string) => {
                        const point = response.Result.find(p => p.Name === name);
                        if (!point) {
                            console.log(`⚠️ Không tìm thấy dữ liệu cho tag ${name}`);
                            return 0;
                        }
                        return this.parseScadaValue(point.Value);
                    };

                    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

                    const inverterData = {
                        inverter_id: inverter.id,
                        timestamp: timestamp,
                        power_active: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.OutputActivePower`),
                        power_reactive: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.OutputReactivePower`),
                        energy: getValue(`ITN${stationIdPlatform}Energy.DailyEnergyINV${inverterId}`),
                        pr: 0,
                        temperature: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.InverterTemperature`),
                        dc_power: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.DCPower`),
                        grid_voltage_a: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.GridVoltageA`),
                        grid_voltage_b: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.GridVoltageB`),
                        grid_voltage_c: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.GridVoltageC`),
                        grid_current_a: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.GridCurrentA`),
                        grid_current_b: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.GridCurrentB`),
                        grid_current_c: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.GridCurrentC`)
                    };

                    console.log('💾 Dữ liệu sẽ lưu:', inverterData);

                    // Sử dụng INSERT ... ON DUPLICATE KEY UPDATE để ghi đè bản ghi inverter_id
                    await connection.execute(
                        `INSERT INTO inverter_realtime 
                        (inverter_id, timestamp, power_active, power_reactive, energy, pr, 
                        temperature, dc_power, grid_voltage_a, grid_voltage_b, grid_voltage_c,
                        grid_current_a, grid_current_b, grid_current_c)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                        timestamp = VALUES(timestamp),
                        power_active = VALUES(power_active),
                        power_reactive = VALUES(power_reactive),
                        energy = VALUES(energy),
                        pr = VALUES(pr),
                        temperature = VALUES(temperature),
                        dc_power = VALUES(dc_power),
                        grid_voltage_a = VALUES(grid_voltage_a),
                        grid_voltage_b = VALUES(grid_voltage_b),
                        grid_voltage_c = VALUES(grid_voltage_c),
                        grid_current_a = VALUES(grid_current_a),
                        grid_current_b = VALUES(grid_current_b),
                        grid_current_c = VALUES(grid_current_c)
                        `,
                        [
                            inverterData.inverter_id,
                            inverterData.timestamp,
                            inverterData.power_active,
                            inverterData.power_reactive,
                            inverterData.energy,
                            inverterData.pr,
                            inverterData.temperature,
                            inverterData.dc_power,
                            inverterData.grid_voltage_a,
                            inverterData.grid_voltage_b,
                            inverterData.grid_voltage_c,
                            inverterData.grid_current_a,
                            inverterData.grid_current_b,
                            inverterData.grid_current_c
                        ]
                    );

                    console.log(`✅ Đã cập nhật dữ liệu cho inverter ${inverter.inverter_id_platform}`);
                } catch (error) {
                    console.error(`❌ Lỗi chi tiết khi cập nhật dữ liệu inverter ${inverter.inverter_id_platform}:`, error);
                }
            }
        } catch (error) {
            console.error(`❌ Lỗi khi lấy danh sách inverter:`, error);
            throw error;
        }
    }

    async updateAllScadaData() {
        try {
            console.log('🔍 Đang lấy danh sách SCADA projects...');
            const scadaProjects = await this.getScadaProjects();
            console.log(`📋 Tìm thấy ${scadaProjects.length} SCADA projects`);

            for (const project of scadaProjects) {
                try {
                    console.log(`\n🏭 Đang xử lý project: ${project.name} (${project.id_project_platform})`);

                    await this.loginWithProjectCredentials(project);
                    console.log('✅ Đăng nhập SCADA thành công');

                    const stations = await this.getProjectStations(project.id);
                    console.log(`📋 Tìm thấy ${stations.length} stations cho project ${project.name}`);

                    for (const station of stations) {
                        try {
                            console.log(`\n🏢 Đang xử lý station: ${station.name} (${station.id_station_platform})`);
                            await this.fetchAndSaveStationData(station, project);
                        } catch (error) {
                            console.error(`❌ Lỗi khi cập nhật dữ liệu station ${station.name}:`, error);
                        }
                    }

                    console.log(`✅ Hoàn thành cập nhật dữ liệu cho project ${project.name}`);
                } catch (error) {
                    console.error(`❌ Lỗi khi cập nhật dữ liệu project ${project.name}:`, error);
                }
            }
        } catch (error) {
            console.error('❌ Lỗi khi cập nhật dữ liệu SCADA:', error);
            throw error;
        }
    }
}

export const scadaService = new ScadaService();
