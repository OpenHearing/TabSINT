import { Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { DpoaeResultsBaseComponent } from '../../shared/dpoae/dpoae-results-base.component';
import { SweptDpoaeResultsInterface } from '../swept-dpoae-exam/swept-dpoae-exam.interface';
import { DPOAE_Y_AXIS_DOMAIN } from '../../shared/dpoae/dpoae-common.interface';
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
    // TODO: Do I need to filter data? Probably not after I get real firmware.
    const filteredData = this.filterSweptDpoaeResults(this.results);

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

    // Plot each series as open circle markers, all indexed by the nominal F2 test frequency
    // (rather than each series' own measured frequency) so the four lines share a common x-axis
    // position per test point. Only DPOAE gets a connecting line.
    const f2Freq = filteredData.DpLow.F2Frequency;
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

  private filterSweptDpoaeResults(data: SweptDpoaeResultsInterface): {
    DpLow: { Frequency: number[]; F2Frequency: number[]; Amplitude: number[]; NoiseFloor: number[] };
    F2: { Frequency: number[]; Amplitude: number[] };
    F1: { Frequency: number[]; Amplitude: number[] };
  } {
    // Initialize filtered data
    const filteredData = {
      DpLow: {
        Frequency: [],
        F2Frequency: [],
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

    // Update the DpLow frequencies for plotting
    filteredData.DpLow.F2Frequency = filteredData.F2.Frequency;
    return filteredData;
  }
}
