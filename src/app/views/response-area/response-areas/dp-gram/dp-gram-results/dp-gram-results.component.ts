import { Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { DpoaeResultsBaseComponent } from '../../shared/dpoae/dpoae-results-base.component';
import { DpGramResultsInterface } from '../dp-gram-exam/dp-gram-exam.interface';
import { createLegend, createOAEResultsChartSvg, createNormativeDataPath, plotOAELineSeries } from '../../../../../utilities/d3-plot-functions';

@Component({
  selector: 'app-dp-gram-results',
  templateUrl: './dp-gram-results.component.html',
})
export class DpGramResultsComponent extends DpoaeResultsBaseComponent<DpGramResultsInterface> {
  @Input() xScale!: d3.ScaleLogarithmic<number, number, never>;
  @Input() xTicks!: number[];

  protected createResultsPlot() {
    const filteredData = this.filterDpGramResults(this.results);

    const yScale = d3.scaleLinear().domain([-40, 100]).range([this.height, 0]);

    let svg = d3
      .select('#dp-gram-results-plot')
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    svg = createOAEResultsChartSvg(svg, this.width, this.height, this.xTicks, this.xScale, yScale, 'F2 Frequency, (Hz)', 'Magnitude, (dB)');

    // Define definitions for the svg and add clip path
    const defs = svg.append('defs');
    defs.append('clipPath').attr('id', 'clipRect').append('rect').attr('x', 0).attr('y', 0).attr('height', this.height).attr('width', this.width);

    // Apply clipping to the group for additional plotting steps
    const clippedGroup = svg.append('g').attr('clip-path', `url(#clipRect)`);

    // Plot normative data (grey area)
    const normativePath = createNormativeDataPath(this.normativeData, this.xScale, yScale);
    clippedGroup.append('path').attr('d', normativePath).attr('fill', 'gray').attr('stroke', 'gray').attr('stroke-width', 2);

    // Plot each series as a connected line with markers, all indexed by the nominal F2 test
    // frequency (rather than each series' own measured frequency) so the four lines share a
    // common x-axis position per test point.
    const f2Freq = filteredData.F2.Frequency;
    plotOAELineSeries(svg, this.xScale, yScale, f2Freq, filteredData.F1.Amplitude, '#984ea3', 'dot');
    plotOAELineSeries(svg, this.xScale, yScale, f2Freq, filteredData.F2.Amplitude, '#ff7f00', 'dot');
    plotOAELineSeries(svg, this.xScale, yScale, f2Freq, filteredData.DpLow.Amplitude, '#3773b8', 'circle');
    plotOAELineSeries(svg, this.xScale, yScale, f2Freq, filteredData.DpLow.NoiseFloor, '#aaaaaa', 'cross');

    const legendData = [
      { label: 'F1', color: '#984ea3', symbol: 'dot', line: 'solid' },
      { label: 'F2', color: '#ff7f00', symbol: 'dot', line: 'solid' },
      { label: 'DPlow', color: '#3773b8', symbol: 'circle', line: 'solid' },
      { label: 'NFlow', color: '#aaaaaa', symbol: 'X', line: 'solid' },
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
