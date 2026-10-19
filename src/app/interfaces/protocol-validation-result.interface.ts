import { ErrorObject } from 'ajv/dist/types';

export interface ProtocolValidationResultInterface {
  valid: boolean;
  error: ErrorObject<string, Record<string, unknown>, unknown>[] | null | undefined;
}
