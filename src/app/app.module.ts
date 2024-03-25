import { NgModule } from '@angular/core';
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

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// import ngx-translate and the http loader
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
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
import { PageModel } from './models/page/page.service';
import { ProtocolModel } from './models/protocol/protocol.service';
import { ResultsModel } from './models/results/results.service';
import { StateModel } from './models/state/state.service';

// Utilities
import { Json } from './utilities/json.service';
import { Notifications } from './utilities/notifications.service';
import { SqLite } from './utilities/sqLite.service';
import { Logger } from './utilities/logger.service';
import { Paths } from './utilities/paths.service';
import { FileChooser } from './utilities/file-chooser.service';

// Controllers
import { FileService } from './controllers/file.service';
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
    ExamFinalizedComponent
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
    NgbModule,
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
    PageModel,
    ProtocolModel,
    ResultsModel,
    StateModel,
    Json,
    SqLite,
    Notifications,
    Logger,
    Paths,
    FileChooser,
    FileService,
    ConfigService,
    VersionService,
    ProtocolService,
    LocalServerService,
    ResultsService,
    ExamService,
    AdminService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
