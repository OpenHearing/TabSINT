import { Component, Input } from '@angular/core';
import * as d3 from 'd3';

import { DpoaeInProgressBaseComponent } from '../../shared/dpoae/dpoae-in-progress-base.component';
import { DPOAEDataInterface, DpGramResultsInterface } from '../dp-gram-exam/dp-gram-exam.interface';
import { createLegend, createOAEResultsChartSvg, plotOAEPointMarkers } from '../../../../../utilities/d3-plot-functions';

@Component({
  selector: 'app-dp-gram-in-progress',
  templateUrl: './dp-gram-in-progress.component.html',
  styleUrl: './dp-gram-in-progress.component.css',
})
export class DpGramInProgressComponent extends DpoaeInProgressBaseComponent<DpGramResultsInterface> {
  protected readonly examLabel = 'DP-gram';

  @Input() xScale!: d3.ScaleLogarithmic<number, number, never>;

  protected createProgressPlot(yScale: d3.ScaleLinear<number, number, never>) {
    const plot = d3.select('#dp-gram-in-progress-plot');
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

  protected onResultsUpdate(results: DpGramResultsInterface): void {
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

    plotOAEPointMarkers(this.svg, this.xScale, extendedYScale, filteredData['F2Frequency'], filteredData['Amplitude'], filteredData['NoiseFloor']);
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
