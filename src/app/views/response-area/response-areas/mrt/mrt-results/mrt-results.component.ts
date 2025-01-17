import { AfterViewInit, Component, Input } from '@angular/core';
import { MrtResultsInterface } from '../mrt-exam/mrt-exam.interface';

@Component({
  selector: 'mrt-results',
  templateUrl: './mrt-results.component.html',
  styleUrl: './mrt-results.component.css'
})
export class MrtResultsComponent implements AfterViewInit {
  @Input() mrtResults!: MrtResultsInterface;
}
