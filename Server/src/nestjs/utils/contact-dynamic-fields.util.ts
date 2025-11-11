const DYNAMIC_FIELD_MAX_KEYS = 100;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const ensureValidDynamicFields = (fields?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!fields) {
    return undefined;
  }

  if (!isPlainObject(fields)) {
    throw new Error('dynamicFields must be a plain object');
  }

  const keys = Object.keys(fields);

  if (keys.length > DYNAMIC_FIELD_MAX_KEYS) {
    throw new Error(`dynamicFields exceeded the maximum of ${DYNAMIC_FIELD_MAX_KEYS} keys`);
  }

  return fields;
};

export const buildDynamicFieldsUpdate = (fields?: Record<string, unknown>): Record<string, unknown> | null => {
  const valid = ensureValidDynamicFields(fields);

  if (!valid) {
    return null;
  }

  return Object.keys(valid).reduce<Record<string, unknown>>((acc, key) => {
    acc[`dynamicFields.${key}`] = valid[key];
    return acc;
  }, {});
};

export const namespaceDynamicFields = (
  fields: Record<string, unknown> | undefined,
  namespace: string,
): Record<string, unknown> | undefined => {
  if (!fields) {
    return undefined;
  }

  const namespaced: Record<string, unknown> = {};

  Object.entries(ensureValidDynamicFields(fields) ?? {}).forEach(([key, value]) => {
    namespaced[`${namespace}.${key}`] = value;
  });

  return namespaced;
};


