import { Component } from '@angular/core';
import { AdminService } from '../../controllers/admin.service';
import { ExamService } from '../../controllers/exam.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  
  constructor(public adminService: AdminService, public examService: ExamService) { }

  active = 1;
}
