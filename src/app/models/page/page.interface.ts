import { PageDefinition, ResponseArea } from "../../interfaces/page-definition.interface";

export interface PageInterface extends PageDefinition{
    name: string;
    filename: string;
    units: string;
    example: number;
    other: Array<string>;
    dict: object;
    hideProgressBar: boolean;
    isSubmittable: boolean;
    canGoBack: Function;
    subtitle: string,
    loadingRequired: boolean;
    loadingActive: boolean;
}