import { Component, Input } from '@angular/core';
import * as d3 from 'd3';

import { DpoaeInProgressBaseComponent } from '../../shared/dpoae/dpoae-in-progress-base.component';
import { DPOAEDataInterface, SweptDpoaeResultsInterface } from '../swept-dpoae-exam/swept-dpoae-exam.interface';
import { createLegend, createOAEResultsChartSvg } from '../../../../../utilities/d3-plot-functions';
import { sweptDpoaeSchema } from '../../../../../../schema/response-areas/swept-dpoae.schema';

@Component({
  selector: 'app-swept-dpoae-in-progress',
  templateUrl: './swept-dpoae-in-progress.component.html',
  styleUrl: './swept-dpoae-in-progress.component.css',
})
export class SweptDpoaeInProgressComponent extends DpoaeInProgressBaseComponent<SweptDpoaeResultsInterface> {
  protected readonly examLabel = 'Swept DPOAE';

  @Input() f2Start: number = sweptDpoaeSchema.properties.f2Start.default;
  @Input() f2End: number = sweptDpoaeSchema.properties.f2End.default;
  @Input() xScale!: d3.ScaleLogarithmic<number, number, never>;

  protected createProgressPlot(yScale: d3.ScaleLinear<number, number, never>) {
    const plot = d3.select('#dpoae-in-progress-plot');
    plot.select('svg').remove(); // Remove existing svg in case of update
    let svg = plot
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    svg = createOAEResultsChartSvg(svg, this.width, this.height, this.xTicks, this.xScale, yScale);

    const legendData = [
      { label: 'DPOAE', color: 'blue', symbol: 'circle' },
      { label: 'NF', color: 'red', symbol: 'X' },
    ];

    createLegend(svg, legendData, this.width, 85);

    return svg;
  }

  protected onResultsUpdate(results: SweptDpoaeResultsInterface): void {
    if (results.DpLow && results.F2) {
      this.updatePlot(results.DpLow, results.F2);
    }
  }

  private updatePlot(dpLowData: DPOAEDataInterface, f2Data: DPOAEDataInterface) {
    const filteredData = this.filterData(dpLowData, f2Data);

    // Re-create the plot with expanding Y scale
    const yDomainLower = Math.min(...this.yScale.domain());
    const yDomainUpper = Math.max(...this.yScale.domain());
    const newMin = Math.min(yDomainLower, ...filteredData['Amplitude'], ...filteredData['NoiseFloor']);
    const newMax = Math.max(yDomainUpper, ...filteredData['Amplitude'], ...filteredData['NoiseFloor']);
    const extendedYScale = this.yScale.copy();
    extendedYScale.domain([newMin, newMax]);
    this.svg = this.createProgressPlot(extendedYScale);

    // Plot DpLow Amplitude / DPOAE (blue open circles)
    this.svg
      .selectAll('.dot')
      .data(filteredData['F2Frequency'])
      .enter()
      .append('circle')
      .attr('cx', (d, i) => this.xScale(filteredData['F2Frequency'][i]))
      .attr('cy', (d, i) => extendedYScale(filteredData['Amplitude'][i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', 'blue')
      .style('stroke-width', 2);

    // Plot DpLow NoiseFloor (red X)
    this.svg
      .selectAll('.cross')
      .data(filteredData['F2Frequency'])
      .enter()
      .append('text')
      .attr('x', (d, i) => this.xScale(filteredData['F2Frequency'][i]))
      .attr('y', (d, i) => extendedYScale(filteredData['NoiseFloor'][i]))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .style('fill', 'red')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text('X');
  }

  private filterData(dpLowData: DPOAEDataInterface, f2Data: DPOAEDataInterface) {
    const filteredData: Record<string, number[]> = {
      Frequency: [],
      F2Frequency: [],
      Amplitude: [],
      NoiseFloor: [],
    };
    for (let i = 0; i < dpLowData.Frequency.length; i++) {
      const freq = dpLowData.Frequency[i];
      filteredData['Frequency'].push(freq);
      filteredData['F2Frequency'].push(f2Data.Frequency[i]);
      filteredData['Amplitude'].push(dpLowData.Amplitude[i]);
      if (dpLowData['NoiseFloor'] && filteredData['NoiseFloor']) {
        filteredData['NoiseFloor'].push(dpLowData.NoiseFloor[i]);
      }
    }
    return filteredData;
  }
}
