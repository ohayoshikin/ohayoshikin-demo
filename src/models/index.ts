// src/models/index.ts
import { UserModel } from './UserModel';
import { UserTokenModel } from './UserTokenModel';
import { OrderModel } from './OrderModel';
import { WithdrawalOrderModel } from './WithdrawalOrderModel'

const models = {
  User: UserModel,
  UserToken: UserTokenModel,
  Order: OrderModel,
  WithdrawalOrder: WithdrawalOrderModel,
};

export default models;