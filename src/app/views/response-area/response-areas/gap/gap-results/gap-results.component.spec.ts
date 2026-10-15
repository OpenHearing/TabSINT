import { GapResultsComponent } from './gap-results.component';

describe('GapResultsComponent', () => {
  it('builds plot data from the stored gap results, highlighting reversals', () => {
    const component = new GapResultsComponent();
    component.results = {
      GapThreshold: 12,
      GapLengthArray: [5, 10, 20],
      ReversalUsedForThresholdArray: [false, true, false],
    };

    expect(component.plotData.y).toEqual([5, 10, 20]);
    expect(component.plotData.pointStyles).toEqual(['filled', 'highlight', 'filled']);
    expect(component.plotData.referenceLine).toBe(12);
  });

  it('returns the same plot data object until the results change', () => {
    const component = new GapResultsComponent();
    component.results = { GapLengthArray: [5] };
    const first = component.plotData;

    expect(component.plotData).toBe(first);

    component.results = { GapLengthArray: [5, 6] };
    expect(component.plotData).not.toBe(first);
  });
});
