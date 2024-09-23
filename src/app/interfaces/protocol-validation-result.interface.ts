import { ErrorObject } from "ajv/dist/types";

export interface ProtocolValidationResultInterface {
    valid: boolean;
    error: ErrorObject<string, Record<string, any>, unknown>[] | null | undefined;
}