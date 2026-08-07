import { Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { DpoaeResultsBaseComponent } from '../../shared/dpoae/dpoae-results-base.component';
import { DpGramResultsInterface } from '../dp-gram-exam/dp-gram-exam.interface';
import { createLegend, createOAEResultsChartSvg, createNormativeDataPath, plotOAEPointMarkers } from '../../../../../utilities/d3-plot-functions';

@Component({
  selector: 'app-dp-gram-results',
  templateUrl: './dp-gram-results.component.html',
  styleUrl: './dp-gram-results.component.css',
})
export class DpGramResultsComponent extends DpoaeResultsBaseComponent<DpGramResultsInterface> {
  @Input() xScale!: d3.ScaleLogarithmic<number, number, never>;
  @Input() xTicks!: number[];

  protected createResultsPlot() {
    const filteredData = this.filterDpGramResults(this.results);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min([
          ...filteredData.DpLow.Amplitude,
          ...filteredData.DpLow.NoiseFloor,
          ...filteredData.F1.Amplitude,
          ...filteredData.F2.Amplitude,
        ]) as number,
        d3.max([
          ...filteredData.DpLow.Amplitude,
          ...filteredData.DpLow.NoiseFloor,
          ...filteredData.F1.Amplitude,
          ...filteredData.F2.Amplitude,
        ]) as number,
      ])
      .range([this.height, 0]);

    let svg = d3
      .select('#dp-gram-results-plot')
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    svg = createOAEResultsChartSvg(svg, this.width, this.height, this.xTicks, this.xScale, yScale);

    // Define definitions for the svg and add clip path
    const defs = svg.append('defs');
    defs.append('clipPath').attr('id', 'clipRect').append('rect').attr('x', 0).attr('y', 0).attr('height', this.height).attr('width', this.width);

    // Apply clipping to the group for additional plotting steps
    const clippedGroup = svg.append('g').attr('clip-path', `url(#clipRect)`);

    // Plot normative data (grey area)
    const normativePath = createNormativeDataPath(this.normativeData, this.xScale, yScale);
    clippedGroup.append('path').attr('d', normativePath).attr('fill', 'gray').attr('stroke', 'gray').attr('stroke-width', 2);

    // Plot DpLow Amplitude (blue open circles) and NoiseFloor (red X) - discrete points, no
    // connecting line, since a handful of possibly non-uniformly-spaced test frequencies
    // shouldn't visually imply a continuous trend.
    plotOAEPointMarkers(svg, this.xScale, yScale, filteredData.DpLow.F2Frequency, filteredData.DpLow.Amplitude, filteredData.DpLow.NoiseFloor);

    // Plot F2 (violet circles)
    svg
      .selectAll('.dot')
      .data(filteredData.F2.Frequency)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => this.xScale(filteredData.F2.Frequency[i]))
      .attr('cy', (d, i) => yScale(filteredData.F2.Amplitude[i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', '#9400d3')
      .style('stroke-width', 2);

    // Plot F1 (yellow circles)
    svg
      .selectAll('.dot')
      .data(filteredData.F1.Frequency)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => this.xScale(filteredData.F1.Frequency[i]))
      .attr('cy', (d, i) => yScale(filteredData.F1.Amplitude[i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', '#ffc107')
      .style('stroke-width', 2);

    const legendData = [
      { label: 'DPOAE', color: 'blue', symbol: 'circle' },
      { label: 'NF', color: 'red', symbol: 'X' },
      { label: 'F2', color: '#9400d3', symbol: 'circle' },
      { label: 'F1', color: '#ffc107', symbol: 'circle' },
    ];

    createLegend(svg, legendData, this.width, 85);
    return svg;
  }

  private filterDpGramResults(data: DpGramResultsInterface): {
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
