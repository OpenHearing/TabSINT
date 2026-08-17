import { Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { DpoaeResultsBaseComponent } from '../../shared/dpoae/dpoae-results-base.component';
import { DpGramResultsInterface } from '../dp-gram-exam/dp-gram-exam.interface';
import { DPOAE_Y_AXIS_DOMAIN } from '../../shared/dpoae/dpoae-common.interface';
import { appendNormativeDataBand, createLegend, createOAEResultsChartSvg, plotDpoaeSeries } from '../../../../../utilities/d3-plot-functions';

@Component({
  selector: 'app-dp-gram-results',
  templateUrl: './dp-gram-results.component.html',
})
export class DpGramResultsComponent extends DpoaeResultsBaseComponent<DpGramResultsInterface> {
  @Input() xScale!: d3.ScaleLogarithmic<number, number, never>;
  @Input() xTicks!: number[];

  protected createResultsPlot() {
    const filteredData = this.filterDpGramResults(this.results);

    const [yClampMin, yClampMax] = DPOAE_Y_AXIS_DOMAIN;
    const yScale = d3.scaleLinear().domain(DPOAE_Y_AXIS_DOMAIN).range([this.height, 0]);

    let svg = d3
      .select('#dp-gram-results-plot')
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    svg = createOAEResultsChartSvg(svg, this.width, this.height, this.xTicks, this.xScale, yScale);

    appendNormativeDataBand(svg, this.width, this.height, this.normativeData, this.xScale, yScale, yClampMin, yClampMax);

    // Plot each series as open circle markers, all indexed by the nominal F2 test frequency
    // (rather than each series' own measured frequency) so the four lines share a common x-axis
    // position per test point. Only DPOAE gets a connecting line, matching Swept DPOAE's results plot.
    const f2Freq = filteredData.F2.Frequency;
    plotDpoaeSeries(svg, this.xScale, yScale, f2Freq, filteredData.DpLow.Amplitude, 'blue', false, yClampMin, yClampMax);
    plotDpoaeSeries(svg, this.xScale, yScale, f2Freq, filteredData.DpLow.NoiseFloor, 'red', true, yClampMin, yClampMax);
    plotDpoaeSeries(svg, this.xScale, yScale, f2Freq, filteredData.F2.Amplitude, '#9400d3', false, yClampMin, yClampMax);
    plotDpoaeSeries(svg, this.xScale, yScale, f2Freq, filteredData.F1.Amplitude, '#ffc107', false, yClampMin, yClampMax);

    const legendData = [
      { label: 'DPOAE', color: 'blue', line: 'solid' },
      { label: 'NF', color: 'red', line: 'dashed' },
      { label: 'F2', color: '#9400d3', line: 'solid' },
      { label: 'F1', color: '#ffc107', line: 'solid' },
    ];

    createLegend(svg, legendData, this.width, 85);
    return svg;
  }

  private filterDpGramResults(data: DpGramResultsInterface): {
    DpLow: { Frequency: number[]; Amplitude: number[]; NoiseFloor: number[] };
    F2: { Frequency: number[]; Amplitude: number[] };
    F1: { Frequency: number[]; Amplitude: number[] };
  } {
    // Initialize filtered data
    const filteredData = {
      DpLow: {
        Frequency: [],
        Amplitude: [],
        NoiseFloor: [],
      },
      F2: {
        Frequency: [],
        Amplitude: [],
      },
      F1: {
        Frequency: [],
        Amplitude: [],
      },
    };

    // Helper function to filter and populate
    const filterAndPush = (
      source: { Frequency: number[]; Amplitude: number[]; NoiseFloor?: number[] },
      target: { Frequency: number[]; Amplitude: number[]; NoiseFloor?: number[] }
    ) => {
      for (let i = 0; i < source.Frequency.length; i++) {
        const freq = source.Frequency[i];
        target.Frequency.push(freq);
        target.Amplitude.push(source.Amplitude[i]);
        if (source.NoiseFloor && target.NoiseFloor) {
          target.NoiseFloor.push(source.NoiseFloor[i]);
        }
      }
    };

    if (data.DpLow) {
      filterAndPush(data.DpLow, filteredData.DpLow);
    }

    if (data.F2) {
      filterAndPush(data.F2, filteredData.F2);
    }

    if (data.F1) {
      filterAndPush(data.F1, filteredData.F1);
    }

    return filteredData;
  }
}
