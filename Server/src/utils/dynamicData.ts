import { prismaClient } from "../prisma";
import { ExtendedRequest } from "../types/users/usersRequests";
import { Response } from "express";
export const getDynamicData = async (
  req: ExtendedRequest,
  res: Response,
  options: {
    model: string;
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
      whereClause.OR = options.searchFields.map(({ path, field }) => ({
        [field]: {
          path,
          string_contains: search,
          mode: "insensitive",
        },
      }));
    }

    // Build orderBy clause
    const orderByClause = sortField
      ? { [sortField as string]: sortDirection || "asc" }
      : options.defaultSortField
      ? { [options.defaultSortField]: "asc" }
      : undefined;

    // Build include clause only if needed
    let includeClause: any = {};
    if (options.includeCounts) {
      includeClause._count = { select: options.includeCounts };
    }
    if (options.include) {
      includeClause = { ...includeClause, ...options.include };
    }
    const hasIncludes = Object.keys(includeClause).length > 0;

    // Get model
    const prismaModel = prismaClient[
      options.model as keyof typeof prismaClient
    ] as any;

    const isPaginated = page !== undefined && pageSize !== undefined;

    if (isPaginated) {
      const totalCountPromise = prismaModel.count({ where: whereClause });
      const dataPromise = prismaModel.findMany({
        where: whereClause,
        ...(hasIncludes && { include: includeClause }),
        skip,
        take,
        orderBy: orderByClause,
      });

      const [totalCount, data] = await Promise.all([
        totalCountPromise,
        dataPromise,
      ]);

      const transformedData = options.transformResponse
        ? options.transformResponse(data)
        : data;

      res.status(200).json({
        data: transformedData,
        totalCount,
      });
    } else {
      const data = await prismaModel.findMany({
        where: whereClause,
        ...(hasIncludes && { include: includeClause }),
        orderBy: orderByClause,
      });

      const transformedData = options.transformResponse
        ? options.transformResponse(data)
        : data;

      res.status(200).json(transformedData);
    }
  } catch (error) {
    console.error(`Error in getDynamicData for ${options.model}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};
