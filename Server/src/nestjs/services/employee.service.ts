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
        email: createEmployeeDto.email,
        organizationId: new Types.ObjectId(createEmployeeDto.organizationId),
      };
      
      if (createEmployeeDto.address) {
        employeeData.address = createEmployeeDto.address;
      }
      
      if (createEmployeeDto.phone) {
        employeeData.phone = createEmployeeDto.phone;
      }
      
      if (createEmployeeDto.idNumber) {
        employeeData.idNumber = createEmployeeDto.idNumber;
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
    return this.employeeModel
      .findByIdAndUpdate(id, updateEmployeeDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Employee | null> {
    return this.employeeModel.findByIdAndDelete(id).exec();
  }
}

