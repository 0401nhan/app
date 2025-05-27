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
    id_station_platform1?: string;
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
                'SELECT id, name, id_station_platform, id_station_platform1 FROM station WHERE project_id = ?',
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

            const stationData = await this.fetchStationData(station);
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

    private generateStationRequestData(stationId: string, stationPlatformId1: string | null): string[] {
        // Xác định prefix cho PowerMeter dựa vào stationId
        const powerMeterPrefix = ['Project1', 'Project2'].includes(stationId) ? 'PowerMeter' : 'SolarPowerMeter';

        return [
            `ITN${stationId}Common.DailyEnergy`,
            `${stationId}${powerMeterPrefix}.ActivePower`,
            `${stationId}${powerMeterPrefix}.ReactivePower`,
            `WetherStation${stationPlatformId1 || stationId}.AmbientTemp`,
            `WetherStation${stationPlatformId1 || stationId}.PVmoduleTemp1`,
            `WetherStation${stationPlatformId1 || stationId}.PVmoduleTemp2`,
            `WetherStation${stationPlatformId1 || stationId}.Irradiation`,
            `ITN${stationId}Common.ExcessPower`,
            `ITN${stationId}Common.PurchasedPower`,
            `${stationId}SolarPanelMainCB.ON`
        ];
    }

    private parseScadaValue(value: string): number {
        return parseFloat(value) || 0;
    }

    private async fetchStationData(station: Station) {
        const requestData = this.generateStationRequestData(
            station.id_station_platform, 
            station.id_station_platform1 || null
        );

        // Thêm tag ACB cho Project3 và Project6
        if (['Project3', 'Project6'].includes(station.id_station_platform)) {
            requestData.push(
                `${station.id_station_platform}SolarPanelMainCB1.ON`,
                `${station.id_station_platform}SolarPanelMainCB2.ON`
            );
        } else {
            requestData.push(`${station.id_station_platform}SolarPanelMainCB.ON`);
        }

        const response = await this.fetchDataFromScada(requestData);

        const getValue = (name: string) => {
            const point = response.Result.find(p => p.Name === name);
            return point ? this.parseScadaValue(point.Value) : 0;
        };

        // Xác định prefix cho PowerMeter
        const powerMeterPrefix = ['Project1', 'Project2'].includes(station.id_station_platform) 
            ? 'PowerMeter' 
            : 'SolarPowerMeter';

        // Xử lý ACB status đặc biệt cho Project3 và Project6
        let acb_status = 'OFF';
        if (['Project3', 'Project6'].includes(station.id_station_platform)) {
            const cb1Status = getValue(`${station.id_station_platform}SolarPanelMainCB1.ON`);
            const cb2Status = getValue(`${station.id_station_platform}SolarPanelMainCB2.ON`);
            acb_status = (cb1Status === 1 && cb2Status === 1) ? 'ON' : 'OFF';
        } else {
            acb_status = getValue(`${station.id_station_platform}SolarPanelMainCB.ON`) === 1 ? 'ON' : 'OFF';
        }

        return {
            power_active: getValue(`${station.id_station_platform}${powerMeterPrefix}.ActivePower`),
            power_reactive: getValue(`${station.id_station_platform}${powerMeterPrefix}.ReactivePower`),
            energy: getValue(`ITN${station.id_station_platform}Common.DailyEnergy`),
            pr: 0, // Tạm thời chưa có
            ambient_temperature: getValue(`WetherStation${station.id_station_platform1 || station.id_station_platform}.AmbientTemp`),
            pvmodule_temperature1: getValue(`WetherStation${station.id_station_platform1 || station.id_station_platform}.PVmoduleTemp1`),
            pvmodule_temperature2: getValue(`WetherStation${station.id_station_platform1 || station.id_station_platform}.PVmoduleTemp2`),
            irradiation: getValue(`WetherStation${station.id_station_platform1 || station.id_station_platform}.Irradiation`),
            excess_power: getValue(`ITN${station.id_station_platform}Common.ExcessPower`),
            purchased_power: getValue(`ITN${station.id_station_platform}Common.PurchasedPower`),
            excess_energy: 0, // Chưa có mapping
            purchased_energy: 0, // Chưa có mapping
            expected_power: 0, // Chưa có mapping
            status: '', // Chưa có mapping
            acb_status
        };
    }

    private async saveStationData(connection: mysql.Connection, stationId: number, data: any) {
        // Lấy timestamp theo múi giờ Việt Nam (UTC+7)
        const timestamp = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6');

        // Xóa dữ liệu cũ của station này (nếu có)
        await connection.execute(
            `DELETE FROM station_realtime WHERE station_id = ?`,
            [stationId]
        );

        // Insert dữ liệu mới
        await connection.execute(
            `INSERT INTO station_realtime 
            (station_id, timestamp, power_active, power_reactive, energy, pr,
            ambient_temperature, pvmodule_temperature1, pvmodule_temperature2,
            irradiation, excess_power, purchased_power, excess_energy, purchased_energy,
            expected_power, status, acb_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                stationId,
                timestamp,
                data.power_active,
                data.power_reactive,
                data.energy,
                data.pr,
                data.ambient_temperature,
                data.pvmodule_temperature1,
                data.pvmodule_temperature2,
                data.irradiation,
                data.excess_power,
                data.purchased_power,
                data.excess_energy,
                data.purchased_energy,
                data.expected_power,
                data.status,
                data.acb_status
            ]
        );

        console.log(`✅ Đã cập nhật dữ liệu realtime cho station ${stationId}`);
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
                    const stationIdPlatform = station.id_station_platform;

                    // Lấy danh sách MPPT của inverter
                    const [mppts] = await connection.execute(
                        'SELECT id, mppt_platform_id FROM MPPT WHERE inverter_id = ?',
                        [inverter.id]
                    );

                    console.log(`\n⚡ Đang xử lý inverter: ${inverter.inverter_id_platform} với ${(mppts as any[]).length} MPPTs`);

                    // Tạo danh sách tag cho tất cả MPPT
                    const mpptTags: string[] = [];
                    for (const mppt of mppts as any[]) {
                        const mpptBase = `${stationIdPlatform}${inverter.inverter_id_platform}.${mppt.mppt_platform_id}`;
                        mpptTags.push(`${mpptBase}Voltage`);
                        mpptTags.push(`${mpptBase}Current`);
                    }

                    // Thêm các tag MPPT vào danh sách request
                    const requestData = [
                        ...mpptTags,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.OutputActivePower`,
                        `${stationIdPlatform}${inverter.inverter_id_platform}.OutputReactivePower`,
                        `ITN${stationIdPlatform}Energy.DailyEnergyINV${inverter.inverter_id_platform.match(/\d+$/)[0]}`,
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

                    // Xử lý dữ liệu MPPT
                    for (const mppt of mppts as any[]) {
                        const mpptBase = `${stationIdPlatform}${inverter.inverter_id_platform}.${mppt.mppt_platform_id}`;
                        
                        const voltagePoint = response.Result.find(p => p.Name === `${mpptBase}Voltage`);
                        const currentPoint = response.Result.find(p => p.Name === `${mpptBase}Current`);

                        if (voltagePoint && currentPoint) {
                            const voltage = this.parseScadaValue(voltagePoint.Value);
                            const current = this.parseScadaValue(currentPoint.Value);
                            const status = voltagePoint.Status === 'Good' && currentPoint.Status === 'Good' ? 'Good' : 'Bad';

                            // Cập nhật dữ liệu MPPT
                            await connection.execute(
                                `UPDATE MPPT 
                                SET voltage = ?, 
                                    current = ?, 
                                    status = ?,
                                    timestamp = ?
                                WHERE id = ?`,
                                [
                                    voltage,
                                    current,
                                    status,
                                    new Date().toLocaleString('en-US', { 
                                        timeZone: 'Asia/Ho_Chi_Minh',
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: false
                                    }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6'),
                                    mppt.id
                                ]
                            );

                            console.log(`✅ Đã cập nhật dữ liệu cho MPPT ${mppt.mppt_platform_id}`);
                        } else {
                            console.log(`⚠️ Không tìm thấy dữ liệu cho MPPT ${mppt.mppt_platform_id}`);
                        }
                    }

                    // Lấy timestamp theo múi giờ Việt Nam (UTC+7)
                    const timestamp = new Date().toLocaleString('en-US', { 
                        timeZone: 'Asia/Ho_Chi_Minh',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2 $4:$5:$6');

                    // Xóa dữ liệu cũ của inverter này (nếu có)
                    await connection.execute(
                        `DELETE FROM inverter_realtime WHERE inverter_id = ?`,
                        [inverter.id]
                    );

                    // Chuẩn bị dữ liệu inverter
                    const inverterData = {
                        inverter_id: inverter.id,
                        timestamp: timestamp,
                        power_active: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.OutputActivePower`),
                        power_reactive: getValue(`${stationIdPlatform}${inverter.inverter_id_platform}.OutputReactivePower`),
                        energy: getValue(`ITN${stationIdPlatform}Energy.DailyEnergyINV${inverter.inverter_id_platform.match(/\d+$/)[0]}`),
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

                    console.log('💾 Dữ liệu inverter sẽ lưu:', inverterData);

                    // Insert dữ liệu mới
                    await connection.execute(
                        `INSERT INTO inverter_realtime 
                        (inverter_id, timestamp, power_active, power_reactive, energy, pr, 
                        temperature, dc_power, grid_voltage_a, grid_voltage_b, grid_voltage_c,
                        grid_current_a, grid_current_b, grid_current_c)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
