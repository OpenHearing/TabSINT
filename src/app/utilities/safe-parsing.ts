import Ajv, { JSONSchemaType } from 'ajv';

/**
 * Helper function to get around AJV errors with optionals requiring nullable set to true.
 * When nullable is set to true with an optional it will take the place of undefined and types may no longer match interface types.
 * This will ideally be removed once updated to v9 of AJV.
 *
 * ...
 *   properties: {
 *    field: nullable({ type: "string" }),
 *   },
 * ...
 *
 * @param input The field object for the property.
 * @returns The field object converted to be used in place of the original field object to get around nullable issues.
 */
export function nullable<T>(input: T): T & { nullable: true } {
  return input as T & { nullable: true };
}

/**
 * A safe parsing function which recursively checks properties and applies defaults to invalid types and missing properties.
 * @param jsonString The string representation of the object to be parsed.
 * @param schema The schema type used for parsing and adjusting the JSON data.
 * @returns A new object matching the templated type or undefined on failure.
 */
export function safeParse<T>(jsonString: string, schema: JSONSchemaType<T>): T | undefined {
  const safeParseAjv = new Ajv({
    allErrors: true,
    useDefaults: true,
    removeAdditional: true,
  });

  /**
   * Recursive function for validation, attempts to fix inner properties as it validates.
   * @param value The object to recursively check.
   * @param schema The schema to validate against.
   * @returns The object with defaults applied to match the templated type or undefined on failure.
   */
  function deepFix<T, S>(data: T, schema: JSONSchemaType<S>, defaultData: T | undefined): T | undefined {
    // Check if we pass validation and return immediately if so
    const copyData = structuredClone(data);
    const copySchema = structuredClone(schema);
    delete copySchema['default']; // Remove default from the copy to bypass strict mode errors
    const validate = safeParseAjv.compile(copySchema);
    if (validate(copyData)) return copyData;

    if (schema && schema.type === 'object' && data && typeof data === 'object') {
      // Loop through object properties and apply fixes
      const fixed: Record<string, unknown> = {};
      const properties = schema.properties || {};
      for (const key of Object.keys(properties)) {
        const propSchema = properties[key];
        const expectedType = propSchema.type;
        const defaultValue = propSchema.default;
        const valueCopy = structuredClone((data as Record<string, unknown>)[key]);
        if (expectedType === 'array' && Array.isArray(valueCopy)) {
          const itemsSchema = propSchema.items;
          fixed[key] = valueCopy.map(item => deepFix(item, itemsSchema, undefined)).filter(item => item !== undefined);
        } else {
          fixed[key] = deepFix(valueCopy, propSchema, defaultValue);
        }
      }
      // Check that inner validation fixed the object
      const finalValidate = safeParseAjv.compile(copySchema);
      if (finalValidate(fixed)) return fixed as T;
    }
    return defaultData;
  }

  try {
    const parsedObject = JSON.parse(jsonString);
    return deepFix(parsedObject, schema, undefined);
  } catch (err) {
    console.error('Error safe parsing the supplied JSON data: ' + err);
  }
  return undefined;
}
