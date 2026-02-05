import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatDialogActions, MatDialogContent, MatDialogModule } from '@angular/material/dialog';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import 'jeep-sqlite';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// import ngx-translate and the http loader
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';

// Views
import { ConfigComponent } from './views/config/config.component';
import { WelcomeComponent } from './views/welcome/welcome.component';
import { AdminComponent } from './views/admin/admin.component';
import { ProtocolsComponent } from './views/protocols/protocols.component';
import { ResultsComponent } from './views/results/results.component';
import { HeaderComponent } from './views/header/header.component';
import { ExamComponent } from './views/exam/exam.component';
import { IndicatorComponent } from './views/indicator/indicator.component';
import { NotificationsComponent } from './views/notifications/notifications.component';

// Models
import { AppModel } from './models/app/app.service';
import { DiskModel } from './models/disk/disk.service';
import { ProtocolModel } from './models/protocol/protocol-model.service';
import { ResultsModel } from './models/results/results-model.service';
import { StateModel } from './models/state/state.service';

// Utilities
import { Notifications } from './services/notifications.service';
import { SqLite } from './services/sqLite.service';
import { Logger } from './services/logger.service';
import { Paths } from './services/paths.service';

// Controllers
import { FileService } from './services/file.service';
import { VersionModel } from './models/version/version.service';
import { ProtocolService } from './controllers/protocol.service';
import { LocalServerService } from './controllers/local-server.service';
import { ResultsService } from './controllers/results.service';
import { ExamService } from './controllers/exam.service';
import { AdminService } from './controllers/admin.service';
import { TabsintConfigComponent } from './views/config/config-views/tabsint-config/tabsint-config.component';
import { SoftwareConfigComponent } from './views/config/config-views/software-config/software-config.component';
import { LogConfigComponent } from './views/config/config-views/log-config/log-config.component';
import { DebugComponent } from './views/debug/debug.component';
import { ExamReadyComponent } from './views/exam-ready/exam-ready.component';
import { ExamNotReadyComponent } from './views/exam-not-ready/exam-not-ready.component';
import { ExamTestingComponent } from './views/exam-testing/exam-testing.component';
import { ExamFinalizedComponent } from './views/exam-finalized/exam-finalized.component';
import { ResponseAreaComponent } from './views/response-area/response-area.component';
import { TextboxComponent } from './views/response-area/response-areas/textbox/textbox.component';
import { TextboxResultViewerComponent } from './views/response-area/response-areas/textbox-result-viewer/textbox-result-viewer.component';
import { MultipleChoiceComponent } from './views/response-area/response-areas/multiple-choice/multiple-choice.component';
import { SingleResultModalComponent } from './views/single-result-modal/single-result-modal/single-result-modal.component';
import { CustomResponseAreaComponent } from './views/response-area/response-areas/custom-response-area/custom-response-area.component';
import { TasksBannerComponent } from './views/tasks-banner/tasks-banner.component';
import { ManualAudiometryComponent } from './views/response-area/response-areas/manual-audiometry/manual-audiometry';
import { DeviceConfigComponent } from './views/config/config-views/device-config/device-config.component';
import { DeviceInfoComponent } from './views/config/config-views/device-info/device-info.component';
import { ConnectedDevicesComponent } from './views/config/config-views/connected-devices/connected-devices.component';
import { NewConnectionComponent } from './views/config/config-views/new-connection/new-connection.component';
import { CalibrationExamComponent } from './views/response-area/response-areas/calibration-exam/calibration-exam-component/calibration-exam.component';
import { CalibrationScreenComponent } from './views/response-area/response-areas/calibration-exam/calibration-screen/calibration-screen.component';
import { MaxOutputScreenComponent } from './views/response-area/response-areas/calibration-exam/max-output-screen/max-output-screen.component';
import { FPLCalibrationExamComponent } from './views/response-area/response-areas/fpl-calibration-exam/fpl-calibration-exam-component/fpl-calibration-exam.component';
import { FPLCalibrationScreenComponent } from './views/response-area/response-areas/fpl-calibration-exam/fpl-calibration-screen/fpl-calibration-screen.component';
import { DevicesService } from './services/devices/devices.service';
import { CalibrationResultsViewerComponent } from './views/response-area/response-areas/calibration-exam/calibration-results-viewer/calibration-results-viewer.component';
import { ManualAudiometryResultViewerComponent } from './views/response-area/response-areas/manual-audiometry/manual-audiometry-result-viewer/manual-audiometry-result-viewer';
import { AudiogramComponent } from './views/audiogram/audiogram.component';
import { ExamDeviceErrorComponent } from './views/exam-device-error/exam-device-error.component';
import { MultipleInputComponent } from './views/response-area/response-areas/multiple-input/multiple-input.component';
import { LikertComponent } from './views/response-area/response-areas/likert/likert/likert.component';
import { SweptDpoaeExamComponent } from './views/response-area/response-areas/swept-dpoae/swept-dpoae-exam/swept-dpoae-exam.component';
import { SweptDpoaeInProgressComponent } from './views/response-area/response-areas/swept-dpoae/swept-dpoae-in-progress/swept-dpoae-in-progress.component';
import { SweptDpoaeResultsComponent } from './views/response-area/response-areas/swept-dpoae/swept-dpoae-results/swept-dpoae-results.component';
import { WAIExamComponent } from './views/response-area/response-areas/wideband-acoustic-immittance/wai-exam/wai-exam.component';
import { WAIInProgressComponent } from './views/response-area/response-areas/wideband-acoustic-immittance/wai-in-progress/wai-in-progress.component';
import { WAIResultsComponent } from './views/response-area/response-areas/wideband-acoustic-immittance/wai-results/wai-results.component';
import { BuildDetailsComponent } from './views/build-details/build-details.component';
import { MrtExamComponent } from './views/response-area/response-areas/mrt/mrt-exam/mrt-exam.component';
import { MrtResultsComponent } from './views/response-area/response-areas/mrt/mrt-results/mrt-results.component';
import { MemrExamComponent } from './views/response-area/response-areas/memr/memr-exam/memr-exam.component';
import { InputParametersComponent } from './views/response-area/response-areas/shared/input-parameters/input-parameters.component';
import { NetworkService } from './controllers/network.service';
import { SubjectIdComponent } from './views/response-area/response-areas/subject-id/subject-id.component';
import { CheckboxComponent } from './views/response-area/response-areas/checkbox/checkbox.component';

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}
@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    ConfigComponent,
    AdminComponent,
    ProtocolsComponent,
    ResultsComponent,
    HeaderComponent,
    ExamComponent,
    IndicatorComponent,
    NotificationsComponent,
    SoftwareConfigComponent,
    LogConfigComponent,
    DebugComponent,
    ExamReadyComponent,
    ExamNotReadyComponent,
    ExamTestingComponent,
    ExamFinalizedComponent,
    ResponseAreaComponent,
    TextboxComponent,
    SubjectIdComponent,
    CheckboxComponent,
    LikertComponent,
    TextboxResultViewerComponent,
    MultipleChoiceComponent,
    ManualAudiometryComponent,
    ManualAudiometryResultViewerComponent,
    SingleResultModalComponent,
    CustomResponseAreaComponent,
    TasksBannerComponent,
    DeviceConfigComponent,
    DeviceInfoComponent,
    ConnectedDevicesComponent,
    NewConnectionComponent,
    AudiogramComponent,
    CalibrationExamComponent,
    CalibrationScreenComponent,
    MaxOutputScreenComponent,
    FPLCalibrationExamComponent,
    FPLCalibrationScreenComponent,
    CalibrationResultsViewerComponent,
    ExamDeviceErrorComponent,
    MultipleInputComponent,
    LikertComponent,
    SweptDpoaeExamComponent,
    SweptDpoaeInProgressComponent,
    SweptDpoaeResultsComponent,
    WAIExamComponent,
    WAIInProgressComponent,
    WAIResultsComponent,
    BuildDetailsComponent,
    MrtExamComponent,
    MrtResultsComponent,
    MemrExamComponent,
    InputParametersComponent,
    TabsintConfigComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    MatMenuModule,
    MatExpansionModule,
    MatAccordion,
    MatDialogContent,
    MatDialogActions,
    MatDialogModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatSelectModule,
    NgbModule,
    NgxJsonViewerModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    AppModel,
    DiskModel,
    ProtocolModel,
    ResultsModel,
    StateModel,
    SqLite,
    Notifications,
    Logger,
    Paths,
    FileService,
    VersionModel,
    ProtocolService,
    LocalServerService,
    ResultsService,
    ExamService,
    AdminService,
    TranslateService,
    DevicesService,
    NetworkService,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
