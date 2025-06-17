// src/models/index.ts
import { UserModel } from './UserModel';
import { UserTokenModel } from './UserTokenModel';
import { OrderModel } from './OrderModel';

const models = {
  User: UserModel,
  UserToken: UserTokenModel,
  Order: OrderModel, // 导出 OrderModel
};

export default models;