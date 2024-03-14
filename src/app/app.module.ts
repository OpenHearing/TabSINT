import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { NgbModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Views
import { ConfigComponent } from './views/config/config.component';
import { WelcomeComponent } from './views/welcome/welcome.component';
import { AdminComponent } from './views/admin/admin.component';
import { ProtocolsComponent } from './views/protocols/protocols.component';
import { ResultsComponent } from './views/results/results.component';
import { HeaderComponent } from './views/header/header.component';
import { ExamComponent } from './views/exam/exam.component';
import { IndicatorComponent } from './views/indicator/indicator.component';

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
    IndicatorComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatIconModule,
    MatTabsModule,
    MatButtonModule,
    MatMenuModule,
    NgbModule,
    NgbAccordionModule
  ],
  providers: [
    provideClientHydration(),
    AppModel,
    DevicesModel,
    DiskModel,
    PageModel,
    ProtocolModel,
    ResultsModel,
    StateModel,
    Json,
    SqLite,
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
