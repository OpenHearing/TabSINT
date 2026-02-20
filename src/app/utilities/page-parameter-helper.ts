import { PageInterface } from '../models/page/page.interface';
import { pageSchema } from '../../schema/page.schema';

export function parsePageParameters(page: PageInterface) {
  const pageParameters: PageInterface = {
    id: page.id,
    autoSubmit: page.autoSubmit ?? pageSchema.properties.autoSubmit.default,
    autoSubmitDelay: page.autoSubmitDelay ?? pageSchema.properties.autoSubmitDelay.default,
    hideProgressBar: page.hideProgressBar ?? pageSchema.properties.hideProgressBar.default,
  };
  return pageParameters;
}
