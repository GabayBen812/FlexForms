import { ContactType } from "@/types/contacts/contact";

const namespaceByType: Record<ContactType, string> = {
  parent: "parent",
  kid: "kid",
  contact: "contact",
  staff: "staff",
};

export const namespaceDynamicFields = (
  dynamicFields: Record<string, unknown> | undefined,
  type: ContactType,
): Record<string, unknown> | undefined => {
  if (!dynamicFields) {
    return undefined;
  }

  const namespace = namespaceByType[type];
  if (!namespace) {
    return dynamicFields;
  }

  return Object.entries(dynamicFields).reduce<Record<string, unknown>>((acc, [key, value]) => {
    const namespacedKey = key.startsWith(`${namespace}.`) ? key : `${namespace}.${key}`;
    acc[namespacedKey] = value;
    return acc;
  }, {});
};

export const denamespaceDynamicFields = (
  dynamicFields: Record<string, unknown> | undefined,
  type: ContactType,
): Record<string, unknown> | undefined => {
  if (!dynamicFields) {
    return undefined;
  }

  const namespace = namespaceByType[type];
  if (!namespace) {
    return dynamicFields;
  }

  const prefix = `${namespace}.`;

  return Object.entries(dynamicFields).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (key.startsWith(prefix)) {
      acc[key.slice(prefix.length)] = value;
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
};


