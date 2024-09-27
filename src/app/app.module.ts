import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'
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
import { DevicesModel } from './models/devices/devices.service';
import { DiskModel } from './models/disk/disk.service';
import { ProtocolModel } from './models/protocol/protocol-model.service';
import { ResultsModel } from './models/results/results-model.service';
import { StateModel } from './models/state/state.service';

// Utilities
import { Notifications } from './utilities/notifications.service';
import { SqLite } from './utilities/sqLite.service';
import { Logger } from './utilities/logger.service';
import { Paths } from './utilities/paths.service';

// Controllers
import { FileService } from './utilities/file.service';
import { ConfigService } from './controllers/config.service';
import { VersionService } from './controllers/version.service';
import { ProtocolService } from './controllers/protocol.service';
import { LocalServerService } from './controllers/local-server.service';
import { ResultsService } from './controllers/results.service';
import { ExamService } from './controllers/exam.service';
import { AdminService } from './controllers/admin.service';
import { TabsintConfigComponent } from './views/tabsint-config/tabsint-config.component';
import { SoftwareConfigComponent } from './views/software-config/software-config.component';
import { LogConfigComponent } from './views/log-config/log-config.component';
import { ChaConfigComponent } from './views/cha-config/cha-config.component';
import { ChaInfoComponent } from './views/cha-info/cha-info.component';
import { DebugComponent } from './views/debug/debug.component';
import { ExamReadyComponent } from './views/exam-ready/exam-ready.component';
import { ExamNotReadyComponent } from './views/exam-not-ready/exam-not-ready.component';
import { ExamTestingComponent } from './views/exam-testing/exam-testing.component';
import { ExamFinalizedComponent } from './views/exam-finalized/exam-finalized.component';
import { ResponseAreaComponent } from './views/response-area/response-area.component';
import { TextboxComponent } from './views/response-area/response-areas/textbox/textbox.component';
import { MultipleChoiceComponent } from './views/response-area/response-areas/multiple-choice/multiple-choice.component';
import { SingleResultModalComponent } from './views/single-result-modal/single-result-modal/single-result-modal.component';
import { ExternalResponseAreaComponent } from './views/response-area/response-areas/external-response-area/external-response-area.component';
import { TasksBannerComponent } from './views/tasks-banner/tasks-banner.component';

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
    TabsintConfigComponent,
    SoftwareConfigComponent,
    LogConfigComponent,
    ChaConfigComponent,
    ChaInfoComponent,
    DebugComponent,
    ExamReadyComponent,
    ExamNotReadyComponent,
    ExamTestingComponent,
    ExamFinalizedComponent,
    ResponseAreaComponent,
    TextboxComponent,
    MultipleChoiceComponent,
    SingleResultModalComponent,
    ExternalResponseAreaComponent,
    TasksBannerComponent,
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
    NgbModule,
    NgxJsonViewerModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    provideClientHydration(),
    provideHttpClient(withFetch()),
    AppModel,
    DevicesModel,
    DiskModel,
    ProtocolModel,
    ResultsModel,
    StateModel,
    SqLite,
    Notifications,
    Logger,
    Paths,
    FileService,
    ConfigService,
    VersionService,
    ProtocolService,
    LocalServerService,
    ResultsService,
    ExamService,
    AdminService,
    TranslateService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
