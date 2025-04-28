
export const replaceOrgIdRecursively = (
    obj: any, orgId: number
): any => {
if (Array.isArray(obj)) {
    return obj.map((item) => replaceOrgIdRecursively(item, orgId));
    }
    if (obj && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
        const value = obj[key];
        if (
        key === "organizationId" ||
        (typeof value === "object" && value?.equals === "CONTEXT_USER_ORGANIZATION_ID")
        ) {
        newObj[key] = { equals: orgId };
        } else {
        newObj[key] = replaceOrgIdRecursively(value, orgId);
        }
    }
    return newObj;
    }
    if (obj === "CONTEXT_USER_ORGANIZATION_ID") {
    return orgId;
    }
    return obj;
};


  
export const normalizeTypes = (
    obj: any
): any => {
    if (Array.isArray(obj)) return obj.map(normalizeTypes);
  
    if (typeof obj === "object" && obj !== null) {
      const newObj: any = {};
      for (const key in obj) {
        if (typeof obj[key] === "string" && !isNaN(Number(obj[key]))) {
          newObj[key] = Number(obj[key]);
        } else {
          newObj[key] = normalizeTypes(obj[key]);
        }
      }
      return newObj;
    }
  
    return obj;
};
