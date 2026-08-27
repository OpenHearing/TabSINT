import { InjectionToken } from '@angular/core';
import { Logger } from '../services/logger.service';
import { ExamService } from '../controllers/exam.service';
import { FileService } from '../services/file.service';
import { ResultsService } from '../controllers/results.service';
import { StateModel } from '../models/state/state.service';
import { DiskModel } from '../models/disk/disk.service';
import { ResultsModel } from '../models/results/results-model.service';
import { PageModel } from '../models/page/page.service';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { PageDefinition } from '../interfaces/page-definition.interface';

export interface TabsintWindow {
  logger: Logger;
  examService: ExamService;
  fileService: FileService;
  resultsService: ResultsService;
  stateModel: StateModel;
  diskModel: DiskModel;
  resultsModel: ResultsModel;
  pageModel: PageModel;
  protocolModel: ProtocolModel;
  /**
   * The page about to be rendered. Preprocess functions may mutate this object
   * (e.g. `window.tabsint.page.instructionText = '...'`) to override that page's
   * protocol variables for this render only.
   */
  page?: PageDefinition;
}
export interface AppWindow extends Window {
  tabsint?: TabsintWindow;
}

export const WINDOW = new InjectionToken<AppWindow>('Global window object', {
  factory: () => window as AppWindow,
});
