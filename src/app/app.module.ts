import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import {MatIconModule} from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

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
import { AppM } from './models/app/app.service';
import { DevicesM } from './models/devices/devices.service';
import { DiskM } from './models/disk/disk.service';
import { PageM } from './models/page/page.service';
import { ProtocolM } from './models/protocol/protocol.service';
import { ResultsM } from './models/results/results.service';
import { StateM } from './models/state/state.service';

// Utilities
import { Json } from './utilities/json.service';
import { Notifications } from './utilities/notifications.service';
import { SqLite } from './utilities/sqLite.service';
import { Logger } from './utilities/logger.service';
import { Paths } from './utilities/paths.service';
import { FileChooser } from './utilities/file-chooser.service';

// Controllers
import { FileService } from './controllers/file.service';
import { Config } from './controllers/config.service';
import { Version } from './controllers/version.service';
import { Protocol } from './controllers/protocol.service';
import { LocalServer } from './controllers/local-server.service';
import { Results } from './controllers/results.service';
import { Exam } from './controllers/exam.service';
import { Admin } from './controllers/admin.service';

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
    AppRoutingModule,
    MatIconModule,
    MatTabsModule,
    NgbModule
  ],
  providers: [
    provideClientHydration(),
    AppM,
    DevicesM,
    DiskM,
    PageM,
    ProtocolM,
    ResultsM,
    StateM,
    Json,
    SqLite,
    Logger,
    Paths,
    FileChooser,
    FileService,
    Config,
    Version,
    Protocol,
    LocalServer,
    Results,
    Exam,
    Admin
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
