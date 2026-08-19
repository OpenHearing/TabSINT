import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrialProgressionPlotComponent } from './trial-progression-plot.component';
import { TrialProgressionPlotDataInterface } from './trial-progression-plot.interface';

describe('TrialProgressionPlotComponent', () => {
  let component: TrialProgressionPlotComponent;
  let fixture: ComponentFixture<TrialProgressionPlotComponent>;

  const baseData: TrialProgressionPlotDataInterface = {
    y: [10, 20, 15],
    xLabel: 'Presentation',
    yLabel: 'Hz',
    title: 'Short Title',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrialProgressionPlotComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrialProgressionPlotComponent);
    component = fixture.componentInstance;
  });

  it('renders a short title on a single line', () => {
    component.data = { ...baseData };
    fixture.detectChanges();

    const tspans: NodeListOf<SVGTSpanElement> = fixture.nativeElement.querySelectorAll('svg text tspan');
    expect(tspans.length).toBe(1);
    expect(tspans[0].textContent).toBe('Short Title');
  });

  it('wraps a long title onto multiple lines instead of letting it get clipped', () => {
    const title = 'This Is A Very Long Progression Plot Title That Should Not Fit On One Single Line At All';
    component.data = { ...baseData, title };
    fixture.detectChanges();

    const tspans: NodeListOf<SVGTSpanElement> = fixture.nativeElement.querySelectorAll('svg text tspan');
    expect(tspans.length).toBeGreaterThan(1);
    tspans.forEach(tspan => {
      expect(tspan.textContent?.length).toBeGreaterThan(0);
      expect(tspan.textContent).not.toBe(title);
    });
    // Rejoining every wrapped line reproduces the original words, in order, with nothing dropped.
    const rejoined = Array.from(tspans)
      .map(tspan => tspan.textContent)
      .join(' ');
    expect(rejoined).toBe(title);
  });

  it('defaults the reference line to a black dashed stroke when no color is specified', () => {
    component.data = { ...baseData, referenceLine: 15 };
    fixture.detectChanges();

    const referenceLine: SVGPathElement | null = fixture.nativeElement.querySelector('svg path[stroke="black"]');
    expect(referenceLine).toBeTruthy();
  });

  it('uses a custom reference line color when one is specified', () => {
    component.data = { ...baseData, referenceLine: 15, referenceLineColor: '#FF0000' };
    fixture.detectChanges();

    const referenceLine: SVGPathElement | null = fixture.nativeElement.querySelector('svg path[stroke="#FF0000"]');
    expect(referenceLine).toBeTruthy();
    const blackReferenceLine: SVGPathElement | null = fixture.nativeElement.querySelector('svg path[stroke="black"]');
    expect(blackReferenceLine).toBeFalsy();
  });

  it('shows one x-axis tick per presentation when there are only a few', () => {
    component.data = { ...baseData, y: [10, 20, 15] };
    fixture.detectChanges();

    // minX defaults to at least 5, so with nothing to thin out, ticks run 0..5 inclusive.
    const tickLabels = fixture.nativeElement.querySelectorAll('svg .x-axis .tick text');
    expect(tickLabels.length).toBe(6);
  });

  it('thins out x-axis ticks so labels do not overlap when there are many presentations', () => {
    component.data = { ...baseData, y: Array.from({ length: 100 }, (_, i) => i) };
    fixture.detectChanges();

    const tickLabels: NodeListOf<SVGTextElement> = fixture.nativeElement.querySelectorAll('svg .x-axis .tick text');
    expect(tickLabels.length).toBeGreaterThan(1);
    expect(tickLabels.length).toBeLessThan(15);
  });
});
