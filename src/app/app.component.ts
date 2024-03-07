import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProtocolService } from './controllers/protocol.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tabsint';
  
  constructor(
    private protocolService: ProtocolService,
    private router: Router
  ) {}

  ngOnInit() {
    this.protocolService.init();
    this.router.navigate([''])
  }
}
