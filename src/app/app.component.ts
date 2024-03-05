import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Protocol } from './controllers/protocol.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tabsint';
  
  constructor(
    private protocol: Protocol,
    private router: Router
  ) {}

  ngOnInit() {
    this.protocol.init();
    this.router.navigate([''])
  }
}
