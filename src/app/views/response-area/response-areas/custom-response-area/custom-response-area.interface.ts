import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

export interface CustomResponseAreaInterface extends CommonResponseAreaInterface {
  htmlFilePath?: string;
  jsFilePath?: string;
  html?: string;
  js?: string;
}
