import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './views/welcome/welcome.component';
import { AdminComponent } from './views/admin/admin.component';
import { ExamComponent } from './views/exam/exam.component';

const routes: Routes = [
  { path: '',   redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'welcome', component: WelcomeComponent},
  { path: 'exam', component: ExamComponent},
  { path: 'admin', component: AdminComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
