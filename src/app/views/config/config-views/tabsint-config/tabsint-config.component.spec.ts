import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { TabsintConfigComponent } from './tabsint-config.component';
import { MatMenuModule } from '@angular/material/menu';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';

describe('TabsintConfigComponent', () => {
  let component: TabsintConfigComponent;
  let fixture: ComponentFixture<TabsintConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TabsintConfigComponent],
      imports: [
        MatMenuModule,
        NgbModule,
        FormsModule,
        QRCodeModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      
    }).compileComponents();

    fixture = TestBed.createComponent(TabsintConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
