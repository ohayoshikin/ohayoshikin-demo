import {
  prop,
  getModelForClass,
  DocumentType,
  modelOptions,
  type Ref,
  mongoose,
} from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { User } from './UserModel';

// 内部订单状态
export enum WithdrawalOrderState {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
}

export const WithdrawalOrderStateMap: Record<WithdrawalOrderState, string> = {
  [WithdrawalOrderState.PENDING]: '等待中',
  [WithdrawalOrderState.SUCCESS]: '成功',
  [WithdrawalOrderState.FAILED]: '失败',
};

export type WithdrawalOrderDocument = DocumentType<WithdrawalOrder>;

@modelOptions({
  schemaOptions: {
    collection: 'WithdrawalOrder',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
})
export class WithdrawalOrder {
  public _id?: Types.ObjectId;

  @prop({ ref: () => User, required: true })
  public userId!: Ref<User>;

  @prop({ required: true })
  public type!: string;

  @prop()
  public targetOwner?: string;

  @prop({ required: true })
  public targetAccount!: string;

  @prop()
  public notifyUrl?: string;

  @prop({ required: true })
  public amount!: number;

  @prop({ required: true })
  public time!: number;

  @prop({ default: WithdrawalOrderState.PENDING, required: true })
  public state!: number;

  @prop()
  public notifyInfo?: string;
}

// export const WithdrawalOrderModel = mongoose.models.WithdrawalOrder ?? getModelForClass(WithdrawalOrder);
export const WithdrawalOrderModel = mongoose.models.WithdrawalOrder ?? getModelForClass(WithdrawalOrder, {
  options: { customName: 'WithdrawalOrder' }
})