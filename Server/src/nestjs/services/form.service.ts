import { Injectable, Query } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Form, FormDocument } from "../schemas/form.schema";
import { UserFromRequest } from "../types/Requests/UserFromRequest";

@Injectable()
export class FormService {
  constructor(@InjectModel(Form.name) private model: Model<FormDocument>) {}

  private async generateUniqueCode(): Promise<number> {
    let code = 0;
    let exists = true;

    while (exists) {
      code = Math.floor(100000 + Math.random() * 900000);
      exists = !!(await this.model.exists({ code }));
    }

    return code;
  }

  async create(data: Partial<Form>, user: UserFromRequest) {
    const code = await this.generateUniqueCode();
    const organizationId = new Types.ObjectId(user.organizationId);
    console.log(data, "data");
    return this.model.create({
      ...data,
      code,
      organizationId,
    });
  }

  update(id: string, data: Partial<Form>) {
    // Unset fields if they are null
    const update: any = {};
    const unset: any = {};
    for (const key of Object.keys(data)) {
      if (data[key] === null) {
        unset[key] = "";
      } else if (data[key] !== undefined) {
        // Clean fields array to remove undefined values and ensure proper structure
        if (key === 'fields' && Array.isArray(data[key])) {
          update[key] = data[key]
            .filter((field: any) => field && typeof field === 'object')
            .map((field: any) => {
              const cleaned: any = {};
              // Only include defined properties
              if (field.name !== undefined) cleaned.name = field.name;
              if (field.label !== undefined) cleaned.label = field.label;
              if (field.type !== undefined) cleaned.type = field.type;
              if (field.isRequired !== undefined) cleaned.isRequired = field.isRequired;
              if (field.config !== undefined && field.config !== null) {
                cleaned.config = field.config;
              }
              return cleaned;
            });
        } else {
          update[key] = data[key];
        }
      }
    }
    // Always use $set operator for proper MongoDB updates
    const updateObj: any = { $set: update };
    if (Object.keys(unset).length > 0) {
      updateObj.$unset = unset;
    }
    return this.model.findByIdAndUpdate(id, updateObj, { new: true }).exec();
  }

  async findAll(query: any = {}) {
    const filter: any = {};

    // Global search (search input)
    if (query.search) {
      filter.title = { $regex: query.search, $options: "i" };
    }

    // Advanced search (field-specific)
    if (query.title) {
      filter.title = { $regex: query.title, $options: "i" };
    }
    if (query.description) {
      filter.description = { $regex: query.description, $options: "i" };
    }
    if (query.isActive !== undefined && query.isActive !== "") {
      filter.isActive = query.isActive;
    }
    if (query.createdAt) {
      filter.createdAt = { $regex: query.createdAt, $options: "i" };
    }
    if (query.organizationId && query.organizationId !== "") {
      filter.organizationId = new Types.ObjectId(query.organizationId);
    }
    
    // Season filtering: show forms matching seasonId OR forms with no season
    if (query.seasonId && query.seasonId !== "") {
      filter.$or = [
        { seasonId: new Types.ObjectId(query.seasonId) },
        { seasonId: { $exists: false } },
        { seasonId: null }
      ];
    }

    // Only add filters if value is not undefined or empty string
    Object.keys(filter).forEach((key) => {
      if (filter[key] === undefined || filter[key] === "") {
        delete filter[key];
      }
    });

    // Handle pagination
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;

    console.log("Pagination:", { page, pageSize, skip });
    console.log("Constructed filter (forms):", filter);

    const [results, total] = await Promise.all([
      this.model.find(filter).skip(skip).limit(pageSize).exec(),
      this.model.countDocuments(filter),
    ]);

    console.log("Results count (forms):", results.length);
    console.log("Total count:", total);

    return {
      data: results,
      totalCount: total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findByOrganization(organizationId: string) {
    return this.model.find({ organizationId }).exec();
  }

  async findByCode(@Query("code") code: string) {
    return this.model
      .findOne({ code: Number(code) })
      .populate('organizationId', 'logo name')
      .exec();
  }

  async delete(id: string) {
    try {
      // Validate if the ID is a valid MongoDB ObjectId
      if (!Types.ObjectId.isValid(id)) {
        console.log("Invalid ObjectId format:", id);
        throw new Error("Invalid form ID format");
      }

      console.log("Attempting to delete form with ID:", id);

      // First check if form exists
      const form = await this.model.findById(id).exec();
      console.log("Found form:", form);

      if (!form) {
        console.log("Form not found");
        throw new Error("Form not found");
      }

      // Delete the form
      const result = await this.model.findByIdAndDelete(id).exec();
      console.log("Delete result:", result);

      return result;
    } catch (error) {
      console.error("Error deleting form:", error);
      throw error;
    }
  }
}
