import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsintConfigComponent } from './tabsint-config.component';

describe('TabsintConfigComponent', () => {
  let component: TabsintConfigComponent;
  let fixture: ComponentFixture<TabsintConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TabsintConfigComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TabsintConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
