import { Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { DpoaeResultsBaseComponent } from '../../shared/dpoae/dpoae-results-base.component';
import { SweptDpoaeResultsInterface } from '../swept-dpoae-exam/swept-dpoae-exam.interface';
import { DPOAE_LEGEND_DATA, DPOAE_SERIES_STYLE, DPOAE_Y_AXIS_DOMAIN } from '../../shared/dpoae/dpoae-common.interface';
import { appendNormativeDataBand, createLegend, createOAEResultsChartSvg, plotDpoaeSeries } from '../../../../../utilities/d3-plot-functions';

@Component({
  selector: 'app-swept-dpoae-results',
  templateUrl: './swept-dpoae-results.component.html',
  styleUrl: './swept-dpoae-results.component.css',
})
export class SweptDpoaeResultsComponent extends DpoaeResultsBaseComponent<SweptDpoaeResultsInterface> {
  @Input() f2Start!: number;
  @Input() f2End!: number;
  @Input() xScale!: d3.ScaleLogarithmic<number, number, never>;
  @Input() xTicks!: number[];

  protected createResultsPlot() {
    const series = this.plottableSeries(this.results);

    const [yClampMin, yClampMax] = DPOAE_Y_AXIS_DOMAIN;
    const yScale = d3.scaleLinear().domain(DPOAE_Y_AXIS_DOMAIN).range([this.height, 0]);

    let svg = d3
      .select('#dpoae-results-plot')
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    svg = createOAEResultsChartSvg(svg, this.width, this.height, this.xTicks, this.xScale, yScale);

    appendNormativeDataBand(svg, this.width, this.height, this.normativeData, this.xScale, yScale, yClampMin, yClampMax);

    // Plot each series indexed by the nominal F2 test frequency (rather than each series' own
    // measured frequency) so the four lines share a common x-axis position per test point.
    const f2Freq = series.f2Freq;
    plotDpoaeSeries(svg, this.xScale, yScale, f2Freq, series.F1, { ...DPOAE_SERIES_STYLE.F1, yClampMin, yClampMax });
    plotDpoaeSeries(svg, this.xScale, yScale, f2Freq, series.F2, { ...DPOAE_SERIES_STYLE.F2, yClampMin, yClampMax });
    plotDpoaeSeries(svg, this.xScale, yScale, f2Freq, series.DpLow, { ...DPOAE_SERIES_STYLE.DpLow, yClampMin, yClampMax });
    plotDpoaeSeries(svg, this.xScale, yScale, f2Freq, series.NoiseFloor, { ...DPOAE_SERIES_STYLE.NoiseFloor, yClampMin, yClampMax });

    createLegend(svg, DPOAE_LEGEND_DATA, this.width, 85);
    return svg;
  }

  /**
   * Reduce the device results to the four amplitude series the plot draws, defaulting any series
   * the device omitted to an empty array.
   */
  private plottableSeries(data: SweptDpoaeResultsInterface) {
    return {
      f2Freq: data.F2?.Frequency ?? [],
      F1: data.F1?.Amplitude ?? [],
      F2: data.F2?.Amplitude ?? [],
      DpLow: data.DpLow?.Amplitude ?? [],
      NoiseFloor: data.DpLow?.NoiseFloor ?? [],
    };
  }
}
