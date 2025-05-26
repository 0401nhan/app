import mysql from 'mysql2/promise';

// SQL để tạo bảng inverter_realtime nếu chưa tồn tại
const CREATE_INVERTER_TABLE = `
CREATE TABLE IF NOT EXISTS inverter_realtime (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inverter_id INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    UNIQUE KEY unique_inverter_timestamp (inverter_id, timestamp),
    INDEX idx_inverter_timestamp (inverter_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tạo bảng khi khởi động
pool.execute(CREATE_INVERTER_TABLE)
    .then(() => console.log('✅ Đã tạo/kiểm tra bảng inverter_realtime'))
    .catch(err => console.error('❌ Lỗi khi tạo bảng inverter_realtime:', err));

export default pool; 