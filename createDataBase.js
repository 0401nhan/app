require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};

async function createDatabase() {
  let connection;
  try {
    // Kết nối không chỉ định database để tạo database nếu chưa tồn tại
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    console.log(`Database "${dbConfig.database}" checked/created successfully.`);

    // Kết nối lại với database vừa tạo hoặc đã tồn tại
    await connection.end();
    connection = await mysql.createConnection(dbConfig);

    console.log('Connected to database.');

    // Tạo bảng theo cấu trúc mới
    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'project_owner', 'station_owner', 'operator') NOT NULL
      );

      CREATE TABLE IF NOT EXISTS project (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        id_project_platform VARCHAR(255) UNIQUE NOT NULL,
        platform_type VARCHAR(255),
        acc_platform VARCHAR(255),
        pass_platform VARCHAR(255),
        location VARCHAR(255),
        description TEXT,
        project_owner_id INT,
        max_ac_capacity FLOAT,
        max_dc_capacity FLOAT,
        FOREIGN KEY (project_owner_id) REFERENCES user(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS station (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        id_station_platform VARCHAR(255) UNIQUE NOT NULL,
        id_station_platform1 VARCHAR(255),
        location_longitude FLOAT,
        location_latitude FLOAT,
        description TEXT,
        project_id INT,
        station_owner_id INT,
        max_ac_capacity FLOAT,
        max_dc_capacity FLOAT,
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
        FOREIGN KEY (station_owner_id) REFERENCES user(id) ON DELETE SET NULL
      );

            CREATE TABLE IF NOT EXISTS inverter (        id INT AUTO_INCREMENT PRIMARY KEY,        inverter_id_platform VARCHAR(255),        model VARCHAR(255),        station_id INT,        max_ac_capacity FLOAT,        max_dc_capacity FLOAT,        FOREIGN KEY (station_id) REFERENCES station(id) ON DELETE CASCADE      );

      CREATE TABLE IF NOT EXISTS inverter_realtime (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inverter_id INT,
        timestamp DATETIME,
        power_active FLOAT,
        power_reactive FLOAT,
        energy FLOAT,
        pr FLOAT,
        temperature FLOAT,
        dc_power FLOAT,
        grid_voltage_a FLOAT,
        grid_voltage_b FLOAT,
        grid_voltage_c FLOAT,
        grid_current_a FLOAT,
        grid_current_b FLOAT,
        grid_current_c FLOAT,
        FOREIGN KEY (inverter_id) REFERENCES inverter(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS inverter_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inverter_id INT,
        timestamp DATETIME,
        power_active FLOAT,
        power_reactive FLOAT,
        energy FLOAT,
        pr FLOAT,
        temperature FLOAT,
        dc_power FLOAT,
        FOREIGN KEY (inverter_id) REFERENCES inverter(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS MPPT (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inverter_id INT,
        mppt_platform_id VARCHAR(255),
        timestamp DATETIME,
        status VARCHAR(255),
        voltage FLOAT,
        current FLOAT,
        FOREIGN KEY (inverter_id) REFERENCES inverter(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS station_realtime (
        id INT AUTO_INCREMENT PRIMARY KEY,
        station_id INT,
        timestamp DATETIME,
        power_active FLOAT,
        power_reactive FLOAT,
        energy FLOAT,
        pr FLOAT,
        ambient_temperature FLOAT,
        pvmodule_temperature1 FLOAT,
        pvmodule_temperature2 FLOAT,
        irradiation FLOAT,
        excess_power FLOAT,
        purchased_power FLOAT,
        excess_energy FLOAT,
        purchased_energy FLOAT,
        expected_power FLOAT,
        status VARCHAR(255),
        acb_status VARCHAR(255),
        FOREIGN KEY (station_id) REFERENCES station(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS station_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        station_id INT,
        timestamp DATETIME,
        power_active FLOAT,
        power_reactive FLOAT,
        energy FLOAT,
        pr FLOAT,
        ambient_temperature FLOAT,
        pvmodule_temperature1 FLOAT,
        pvmodule_temperature2 FLOAT,
        irradiation FLOAT,
        excess_power FLOAT,
        purchased_power FLOAT,
        excess_energy FLOAT,
        purchased_energy FLOAT,
        acb_status VARCHAR(255),
        FOREIGN KEY (station_id) REFERENCES station(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_realtime (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        timestamp DATETIME,
        power_active FLOAT,
        power_reactive FLOAT,
        energy FLOAT,
        pr FLOAT,
        ambient_temperature FLOAT,
        pvmodule_temperature FLOAT,
        irradiation FLOAT,
        excess_power FLOAT,
        purchased_power FLOAT,
        excess_energy FLOAT,
        purchased_energy FLOAT,
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        timestamp DATETIME,
        power_active FLOAT,
        power_reactive FLOAT,
        energy FLOAT,
        pr FLOAT,
        ambient_temperature FLOAT,
        pvmodule_temperature FLOAT,
        irradiation FLOAT,
        excess_power FLOAT,
        purchased_power FLOAT,
        excess_energy FLOAT,
        purchased_energy FLOAT,
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS pv_module (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        station_id INT,
        inverter_id INT,
        alpha FLOAT,
        pv_module_name VARCHAR(255),
        pv_module_type VARCHAR(255),
        pv_module_capacity FLOAT,
        pv_module_number INT,
        FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
        FOREIGN KEY (station_id) REFERENCES station(id) ON DELETE CASCADE,
        FOREIGN KEY (inverter_id) REFERENCES inverter(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS station_email_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        station_id INT,
        user_id INT,
        enabled BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (station_id) REFERENCES station(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      );
    `;

    // Tách câu lệnh SQL theo dấu chấm phẩy và chạy từng câu lệnh một
    const queries = createTablesQuery.split(';').filter(q => q.trim().length > 0);

    for (const query of queries) {
      await connection.query(query);
      console.log(`Executed query: ${query.trim().substring(0, 50)}...`);
    }

    console.log('All tables created or checked successfully.');

  } catch (error) {
    console.error('Error creating database or tables:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

module.exports = createDatabase;
