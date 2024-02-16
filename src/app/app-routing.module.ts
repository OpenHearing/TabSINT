import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './views/welcome/welcome.component';
import { ConfigComponent } from './views/config/config.component';

const routes: Routes = [
  { path: '', component: WelcomeComponent},
  { path: 'config', component: ConfigComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
