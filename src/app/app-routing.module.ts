import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './views/welcome/welcome.component';
import { ConfigComponent } from './views/config/config.component';
import { AdminComponent } from './views/admin/admin.component';
import { ResultsComponent } from './views/results/results.component';
import { ProtocolsComponent } from './views/protocols/protocols.component';

const routes: Routes = [
  { path: '', component: WelcomeComponent},
  { path: 'admin', component: AdminComponent},
  { path: 'config', component: ConfigComponent},
  { path: 'results', component: ResultsComponent},
  { path: 'protocols', component: ProtocolsComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
