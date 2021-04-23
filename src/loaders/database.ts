import { createConnection } from 'typeorm';
import ormconfig from '../config/ormconfig';

export const connectDB = async () => {
  return await createConnection(ormconfig);
};