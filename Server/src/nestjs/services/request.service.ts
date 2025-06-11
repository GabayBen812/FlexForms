
import { Injectable, Query } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Request, RequestDocument } from "../schemas/request.schema";

@Injectable()
export class RequestService {
constructor(@InjectModel(Request.name) private model: Model<RequestDocument>) {}

findByOrganization(organizationId: string) {
  console.log('Finding requests for organization:', organizationId);

  if (!Types.ObjectId.isValid(organizationId)) {
    throw new Error('Invalid organizationId');
  }

  return this.model.find({
    organizationId: new Types.ObjectId(organizationId),
  }).exec();
}

 private async generateUniqueCode(): Promise<number> {
    let code = 0;
    let exists = true;

    while (exists) {
      code = Math.floor(100000 + Math.random() * 900000);
      exists = !!(await this.model.exists({ code }));
    }

    return code;
  }

 async create(data: Partial<Request>) {
   const code = await this.generateUniqueCode();
 
   const { organizationId, ...rest } = data;
 
   return this.model.create({
     ...rest,
     code,
     organizationId: new Types.ObjectId(organizationId),
   });
 
}
}
