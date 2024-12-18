import { PageDefinition } from "../../interfaces/page-definition.interface";

export interface PageInterface extends PageDefinition {
    exportToCSV?: boolean;
    name?: string;
    filename?: string;
    units?: string;
    example?: number;
    other?: Array<string>;
    dict?: object;
    isSubmittable?: boolean;
    canGoBack?: boolean;
    subtitle?: string,
    loadingRequired?: boolean;
    loadingActive?: boolean;
}