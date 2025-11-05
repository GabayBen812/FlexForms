import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee } from '../schemas/employee.schema';
import { CreateEmployeeDto } from '../dto/employee.dto';
import { UpdateEmployeeDto } from '../dto/employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    console.log('EmployeeService.create - received DTO:', createEmployeeDto);
    try {
      const employeeData: any = {
        firstname: createEmployeeDto.firstname,
        lastname: createEmployeeDto.lastname,
        organizationId: new Types.ObjectId(createEmployeeDto.organizationId),
      };
      
      if (createEmployeeDto.idNumber) {
        employeeData.idNumber = createEmployeeDto.idNumber;
      }

      // Handle dynamicFields - save them to the database
      if (createEmployeeDto.dynamicFields && typeof createEmployeeDto.dynamicFields === 'object') {
        employeeData.dynamicFields = createEmployeeDto.dynamicFields;
      }
      
      console.log('EmployeeService.create - employeeData to save:', employeeData);
      const createdEmployee = new this.employeeModel(employeeData);
      const saved = await createdEmployee.save();
      console.log('EmployeeService.create - saved employee:', saved);
      return saved;
    } catch (error) {
      console.error('EmployeeService.create - error:', error);
      throw error;
    }
  }

  async findAll(organizationId: string): Promise<Employee[]> {
    return this.employeeModel.find({ organizationId: new Types.ObjectId(organizationId) }).exec();
  }

  async findOne(id: string): Promise<Employee | null> {
    return this.employeeModel.findById(id).exec();
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee | null> {
    const updateData: any = { ...updateEmployeeDto };
    
    // Handle dynamicFields separately using dot notation to merge instead of replace
    if (updateEmployeeDto.dynamicFields && typeof updateEmployeeDto.dynamicFields === 'object') {
      const dynamicFieldsUpdate: any = {};
      Object.keys(updateEmployeeDto.dynamicFields).forEach(key => {
        dynamicFieldsUpdate[`dynamicFields.${key}`] = updateEmployeeDto.dynamicFields[key];
      });
      
      // Remove dynamicFields from updateData and use dot notation instead
      delete updateData.dynamicFields;
      Object.assign(updateData, dynamicFieldsUpdate);
    }
    
    return this.employeeModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Employee | null> {
    return this.employeeModel.findByIdAndDelete(id).exec();
  }
}

