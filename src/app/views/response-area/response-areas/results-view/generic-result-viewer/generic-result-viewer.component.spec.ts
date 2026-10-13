import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericResultViewerComponent } from './generic-result-viewer.component';

describe('GenericResultViewerComponent', () => {
  let component: GenericResultViewerComponent;
  let fixture: ComponentFixture<GenericResultViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenericResultViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GenericResultViewerComponent);
    component = fixture.componentInstance;
  });

  it('renders a string response as plain text', () => {
    component.response = 'hello';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('hello');
    expect(component.kind).toBe('value');
  });

  it('renders an array response as a list', () => {
    component.response = ['a', 'b'];
    fixture.detectChanges();
    expect(component.kind).toBe('array');
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(2);
  });

  it('renders an object response as a key/value table', () => {
    component.response = { selected: 'yes', other: undefined };
    fixture.detectChanges();
    expect(component.kind).toBe('object');
    expect(component.entries).toEqual([
      ['selected', 'yes'],
      ['other', undefined],
    ]);
    expect(fixture.nativeElement.querySelectorAll('table.results-table tr').length).toBe(2);
  });

  it('treats null as a plain value, not an object', () => {
    component.response = null;
    expect(component.kind).toBe('value');
  });

  it('recurses into an array of objects (e.g. bekesy trial results)', () => {
    component.response = [{ splLevel: 30 }, { splLevel: 25 }];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li table.results-table').length).toBe(2);
  });
});
