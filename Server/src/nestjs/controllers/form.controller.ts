import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Put,
  Req,
  UseGuards,
  Delete,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { FormService } from "../services/form.service";
import { CreateFormDto } from "../dto/form.dto";
import { Types } from "mongoose";
import { JwtAuthGuard } from "../middlewares/jwt-auth.guard";
import { CustomRequest } from "../types/Requests/CustomRequest";

@Controller("forms")
export class FormController {
  constructor(private readonly service: FormService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateFormDto, @Req() req: CustomRequest) {
    return this.service.create(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  update(@Param("id") id: string, @Body() dto: CreateFormDto) {
    const { organizationId, ...rest } = dto;
    return this.service.update(id, rest);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id/settings")
  async updateSettings(@Param("id") id: string, @Body() body: any) {
    // Only allow updating specific fields
    const { isActive, maxRegistrators, registrationDeadline } = body;
    return this.service.update(id, {
      isActive,
      maxRegistrators,
      registrationDeadline,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(@Query() query: any) {
    console.log("Query params:", query);
    const result = await this.service.findAll(query);
    console.log("Query result:", result);
    return {
      status: 200,
      data: result.data,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    };
  }

  @Get("find-by-code")
  async findByCode(@Query("code") code: string) {
    return this.service.findByCode(code);
  }

  @UseGuards(JwtAuthGuard)
  @Get("organization/:orgId")
  async getByOrganization(@Param("orgId") orgId: string) {
    return this.service.findByOrganization(orgId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.service.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async delete(@Param("id") id: string) {
    try {
      console.log("Delete request received for form ID:", id);
      const result = await this.service.delete(id);
      console.log("Delete result:", result);
      return result;
    } catch (error) {
      //@ts-ignore
      console.error("Delete error:", error.message);
      //@ts-ignore
      if (error.message === "Form not found") {
        throw new NotFoundException(`Form with ID ${id} not found`);
      }
      //@ts-ignore
      if (error.message === "Invalid form ID format") {
        throw new BadRequestException("Invalid form ID format");
      }
      throw new InternalServerErrorException("Error deleting form");
    }
  }
}
