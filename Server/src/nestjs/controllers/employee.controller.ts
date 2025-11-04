import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Put } from '@nestjs/common';
import { EmployeeService } from '../services/employee.service';
import { CreateEmployeeDto } from '../dto/employee.dto';
import { UpdateEmployeeDto } from '../dto/employee.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto, @Req() req: Request) {
    console.log('Received create employee request:', createEmployeeDto);
    const user = req.user as { organizationId?: string };
    console.log('User from request:', user);
    if (user && user.organizationId) {
      createEmployeeDto.organizationId = user.organizationId;
    } else {
      console.error('User organizationId not found');
      throw new Error('User organizationId not found');
    }
    console.log('Creating employee with data:', createEmployeeDto);
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { organizationId?: string };
    if (!user || !user.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.employeeService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}

