import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Expense } from '../schemas/expense.schema';
import { CreateExpenseDto } from '../dto/expense.dto';
import { UpdateExpenseDto } from '../dto/expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    const expenseData: any = {
      date: new Date(createExpenseDto.date),
      amount: createExpenseDto.amount,
      category: createExpenseDto.category,
      paymentMethod: createExpenseDto.paymentMethod,
      organizationId: new Types.ObjectId(createExpenseDto.organizationId),
    };

    if (createExpenseDto.supplierId) {
      expenseData.supplierId = createExpenseDto.supplierId;
    }

    if (createExpenseDto.invoicePicture) {
      expenseData.invoicePicture = createExpenseDto.invoicePicture;
    }

    if (createExpenseDto.notes) {
      expenseData.notes = createExpenseDto.notes;
    }

    const createdExpense = new this.expenseModel(expenseData);
    return createdExpense.save();
  }

  async findAll(organizationId: string): Promise<Expense[]> {
    return this.expenseModel.find({ organizationId: new Types.ObjectId(organizationId) }).exec();
  }

  async findOne(id: string): Promise<Expense | null> {
    return this.expenseModel.findById(id).exec();
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto): Promise<Expense | null> {
    const updateData: any = {};

    if (updateExpenseDto.date !== undefined) {
      updateData.date = new Date(updateExpenseDto.date);
    }

    if (updateExpenseDto.amount !== undefined) {
      updateData.amount = updateExpenseDto.amount;
    }

    if (updateExpenseDto.supplierId !== undefined) {
      updateData.supplierId = updateExpenseDto.supplierId;
    }

    if (updateExpenseDto.category !== undefined) {
      updateData.category = updateExpenseDto.category;
    }

    if (updateExpenseDto.paymentMethod !== undefined) {
      updateData.paymentMethod = updateExpenseDto.paymentMethod;
    }

    if (updateExpenseDto.invoicePicture !== undefined) {
      updateData.invoicePicture = updateExpenseDto.invoicePicture;
    }

    if (updateExpenseDto.notes !== undefined) {
      updateData.notes = updateExpenseDto.notes;
    }

    return this.expenseModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Expense | null> {
    return this.expenseModel.findByIdAndDelete(id).exec();
  }
}

