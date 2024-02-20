import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import {MatIconModule} from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConfigComponent } from './views/config/config.component';
import { WelcomeComponent } from './views/welcome/welcome.component';
import { AdminComponent } from './views/admin/admin.component';
import { ProtocolsComponent } from './views/protocols/protocols.component';
import { ResultsComponent } from './views/results/results.component';

import { PageM } from './models/page/page-m.service';

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    ConfigComponent,
    AdminComponent,
    ProtocolsComponent,
    ResultsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatIconModule ,
    MatTabsModule
  ],
  providers: [
    provideClientHydration(),
    PageM
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
