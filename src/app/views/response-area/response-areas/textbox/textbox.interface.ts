import { CommonResponseAreaInterface } from "../../../../interfaces/page-definition.interface";

export interface TextBoxInterface extends CommonResponseAreaInterface {
    rows: number;
    exportToCSV?: boolean;
}