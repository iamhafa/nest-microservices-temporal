import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../config/database.config';

// Khởi tạo instance của DataSource theo đúng yêu cầu của TypeORM CLI
const dataSource = new DataSource(dataSourceOptions);

// CLI bắt buộc phải nhận được export default này để chạy lệnh
export default dataSource;
