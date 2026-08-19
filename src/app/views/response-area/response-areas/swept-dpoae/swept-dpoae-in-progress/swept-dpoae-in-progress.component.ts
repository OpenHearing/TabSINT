import { Component, Input } from '@angular/core';
import * as d3 from 'd3';

import { DpoaeInProgressBaseComponent } from '../../shared/dpoae/dpoae-in-progress-base.component';
import { DPOAEDataInterface, SweptDpoaeResultsInterface } from '../swept-dpoae-exam/swept-dpoae-exam.interface';
import { DPOAE_LEGEND_DATA, DPOAE_SERIES_STYLE, DPOAE_Y_AXIS_DOMAIN } from '../../shared/dpoae/dpoae-common.interface';
import { appendNormativeDataBand, createLegend, createOAEResultsChartSvg, plotDpoaeSeries } from '../../../../../utilities/d3-plot-functions';
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

    appendNormativeDataBand(svg, this.width, this.height, this.normativeData, this.xScale, yScale, DPOAE_Y_AXIS_DOMAIN[0], DPOAE_Y_AXIS_DOMAIN[1]);

    createLegend(svg, DPOAE_LEGEND_DATA, this.width, 85);

    return svg;
  }

  protected onResultsUpdate(results: SweptDpoaeResultsInterface): void {
    if (results.DpLow && results.F2) {
      this.updatePlot(results.DpLow, results.F2, results.F1);
    }
  }

  private updatePlot(dpLowData: DPOAEDataInterface, f2Data: DPOAEDataInterface, f1Data?: DPOAEDataInterface) {
    const filteredData = this.filterData(dpLowData, f2Data, f1Data);
    const [yClampMin, yClampMax] = DPOAE_Y_AXIS_DOMAIN;

    this.svg = this.createProgressPlot(this.yScale);

    plotDpoaeSeries(this.svg, this.xScale, this.yScale, filteredData['F2Frequency'], filteredData['Amplitude'], {
      ...DPOAE_SERIES_STYLE.DpLow,
      yClampMin,
      yClampMax,
    });
    plotDpoaeSeries(this.svg, this.xScale, this.yScale, filteredData['F2Frequency'], filteredData['NoiseFloor'], {
      ...DPOAE_SERIES_STYLE.NoiseFloor,
      yClampMin,
      yClampMax,
    });
    plotDpoaeSeries(this.svg, this.xScale, this.yScale, filteredData['F2Frequency'], filteredData['F2Amplitude'], {
      ...DPOAE_SERIES_STYLE.F2,
      yClampMin,
      yClampMax,
    });
    if (filteredData['F1Amplitude'].length) {
      plotDpoaeSeries(this.svg, this.xScale, this.yScale, filteredData['F2Frequency'], filteredData['F1Amplitude'], {
        ...DPOAE_SERIES_STYLE.F1,
        yClampMin,
        yClampMax,
      });
    }
  }

  /**
   * F1 and F2 are indexed by their own nominal F2 test frequency (not each series' own measured
   * frequency), matching SweptDpoaeResultsComponent, so all four lines share a common x-axis
   * position per completed test point.
   */
  private filterData(dpLowData: DPOAEDataInterface, f2Data: DPOAEDataInterface, f1Data?: DPOAEDataInterface) {
    const filteredData: Record<string, number[]> = {
      F2Frequency: [],
      Amplitude: [],
      NoiseFloor: [],
      F2Amplitude: [],
      F1Amplitude: [],
    };
    for (let i = 0; i < dpLowData.Frequency.length; i++) {
      filteredData['F2Frequency'].push(f2Data.Frequency[i]);
      filteredData['Amplitude'].push(dpLowData.Amplitude[i]);
      if (dpLowData.NoiseFloor) {
        filteredData['NoiseFloor'].push(dpLowData.NoiseFloor[i]);
      }
      filteredData['F2Amplitude'].push(f2Data.Amplitude[i]);
      if (f1Data) {
        filteredData['F1Amplitude'].push(f1Data.Amplitude[i]);
      }
    }
    return filteredData;
  }
}
