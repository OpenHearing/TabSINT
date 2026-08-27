import { PageDefinition } from '../../interfaces/page-definition.interface';

export interface PageInterface extends PageDefinition {
  _uuid: string;
  name?: string;
  filename?: string;
  units?: string;
  example?: number;
  other?: string[];
  dict?: object;
  isSubmittable?: boolean;
  canGoBack?: boolean;
  loadingRequired?: boolean;
  loadingActive?: boolean;
}
