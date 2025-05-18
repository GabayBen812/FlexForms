import { Model, Types } from 'mongoose';
import { ExtendedRequest } from "../types/users/usersRequests";
import { Response } from "express";

export const getDynamicData = async (
  req: ExtendedRequest,
  res: Response,
  options: {
    model: Model<any>;
    searchFields?: { path: string; field: string }[];
    includeCounts?: { [key: string]: boolean };
    include?: { [key: string]: boolean | object };
    defaultSortField?: string;
    transformResponse?: (data: any) => any;
    filters?: string[];
  }
) => {
  try {
    const {
      organizationId,
      page,
      pageSize,
      search,
      sortField,
      sortDirection,
      ...restQuery
    } = req.query;

    const organizationIdNumber = Number(organizationId);
    console.log(req.query, "req.query");

    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const pageSizeNumber = pageSize
      ? parseInt(pageSize as string, 10)
      : undefined;
    const skip =
      pageNumber && pageSizeNumber
        ? (pageNumber - 1) * pageSizeNumber
        : undefined;
    const take = pageSizeNumber;

    const whereClause: any = {
      organizationId: organizationIdNumber,
    };

    // Apply filters
    if (options.filters?.length) {
      for (const filterName of options.filters) {
        if (restQuery[filterName] !== undefined) {
          const value = /^\d+$/.test(restQuery[filterName] as string)
            ? parseInt(restQuery[filterName] as string, 10)
            : restQuery[filterName];
          whereClause[filterName] = value;
        }
      }
    }

    // Apply search
    if (search && options.searchFields?.length) {
      whereClause.$or = options.searchFields.map(({ path, field }) => ({
        [field]: { $regex: search, $options: 'i' }
      }));
    }

    // Build sort clause
    const sortClause = sortField
      ? { [sortField as string]: sortDirection === 'desc' ? -1 : 1 } as { [key: string]: 1 | -1 }
      : options.defaultSortField
      ? { [options.defaultSortField]: 1 } as { [key: string]: 1 | -1 }
      : undefined;

    // Build include clause
    let populateOptions: any[] = [];
    if (options.include) {
      populateOptions = Object.entries(options.include).map(([path, select]) => ({
        path,
        select: typeof select === 'object' ? select : true
      }));
    }

    const isPaginated = page !== undefined && pageSize !== undefined;

    if (isPaginated) {
      const [totalCount, data] = await Promise.all([
        options.model.countDocuments(whereClause),
        options.model
          .find(whereClause)
          .populate(populateOptions)
          .skip(skip || 0)
          .limit(take || 0)
          .sort(sortClause)
      ]);

      const transformedData = options.transformResponse
        ? options.transformResponse(data)
        : data;

      res.status(200).json({
        data: transformedData,
        totalCount,
      });
    } else {
      const data = await options.model
        .find(whereClause)
        .populate(populateOptions)
        .sort(sortClause);

      const transformedData = options.transformResponse
        ? options.transformResponse(data)
        : data;

      res.status(200).json(transformedData);
    }
  } catch (error) {
    console.error(`Error in getDynamicData:`, error);
    res.status(500).json({ message: "Server error" });
  }
};
