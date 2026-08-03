import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { TrialProgressionPlotDataInterface } from './trial-progression-plot.interface';

/**
 * Shared trial-progression plot: one point per trial/presentation (value on the y axis, trial
 * index on the x axis), optionally connected by a line, with per-point styling and an optional
 * dashed reference line. Used for GAP detection results and Hughson-Westlake level progression.
 */
@Component({
  selector: 'app-trial-progression-plot',
  templateUrl: './trial-progression-plot.component.html',
  styleUrl: './trial-progression-plot.component.css',
})
export class TrialProgressionPlotComponent implements AfterViewInit {
  @Input() data!: TrialProgressionPlotDataInterface;
  @ViewChild('trialProgressionPlot') private readonly plotRef!: ElementRef<HTMLDivElement>;

  private readonly plotWidth = 400;
  private readonly plotHeight = 400;
  private readonly margin = { top: 55, right: 10, bottom: 40, left: 65 };
  private readonly filledColor = '#1f77b4';
  private readonly highlightColor = '#FF6347';

  ngAfterViewInit(): void {
    this.createPlot();
  }

  /**
   * Render the trial-progression plot.
   */
  private createPlot(): void {
    const y = this.data.y ?? [];
    const pointStyles = this.data.pointStyles ?? [];
    const width = this.plotWidth - this.margin.left - this.margin.right;
    const height = this.plotHeight - this.margin.top - this.margin.bottom;

    const dataMin = y.length ? Math.min(...y) : 0;
    // y-axis lower bound: 0 when all values are non-negative, otherwise the next multiple of
    // 20 below the smallest value (rounds dataMin down to a clean tick).
    const minY = dataMin < 0 ? -20 * Math.ceil(Math.abs(dataMin) / 20) : 0;
    const maxY = this.data.maxY ?? 200;
    const minX = Math.max(y.length, this.data.minX ?? 5);

    const xScale = d3.scaleLinear().range([0, width]).domain([0, minX]);
    const yScale = d3.scaleLinear().range([height, 0]).domain([minY, maxY]);

    // The left/right margins are asymmetric (extra space on the left for y-axis tick labels), so
    // centering on the drawable `width` alone would skew title/label text right
    const plotCenterX = (width + this.margin.right - this.margin.left) / 2;

    const svg = d3
      .select(this.plotRef.nativeElement)
      .append('svg')
      .attr('width', width + this.margin.left + this.margin.right)
      .attr('height', height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // x-axis: explicit integer tick values (one per presentation) so a fractional "nice" tick
    // step never rounds two adjacent ticks to the same integer label.
    const xTickValues = d3.range(0, minX + 1);
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('font-size', 16)
      .call(d3.axisBottom(xScale).tickValues(xTickValues).tickFormat(d3.format('d')));
    svg
      .append('text')
      .attr('font-size', 20)
      .attr('x', plotCenterX)
      .attr('y', height + 35)
      .style('text-anchor', 'middle')
      .text(this.data.xLabel);

    // y-axis
    svg.append('g').attr('font-size', 16).call(d3.axisLeft(yScale));
    svg
      .append('text')
      .attr('font-size', 18)
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -50)
      .style('text-anchor', 'middle')
      .text(this.data.yLabel);

    // title: placed above the plot area (in the top margin band) so it never overlaps the
    // topmost y-axis tick label, which sits right at the plot's top edge (y=0).
    svg
      .append('text')
      .attr('x', plotCenterX)
      .attr('y', -30)
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .style('font-size', '18px')
      .text(this.data.title);

    // dashed reference line (e.g. a threshold)
    if (this.data.referenceLine !== undefined) {
      const referenceLineGenerator = d3
        .line<{ x: number; y: number }>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));
      svg
        .append('path')
        .datum([
          { x: 0, y: this.data.referenceLine },
          { x: minX, y: this.data.referenceLine },
        ])
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .style('stroke-dasharray', '4,4')
        .attr('d', referenceLineGenerator);
    }

    // line connecting the trial values, in presentation order
    if (this.data.connectLine) {
      const trialLineGenerator = d3
        .line<number>()
        .x((_d, i) => xScale(i + 1))
        .y(d => yScale(d));
      svg.append('path').datum(y).attr('stroke', this.filledColor).attr('fill', 'none').attr('d', trialLineGenerator);
    }

    // data points: filled (response received), open (no response), or highlighted (e.g. the
    // responses that confirmed a threshold)
    const fillFor = (i: number) => (pointStyles[i] === 'open' ? 'none' : pointStyles[i] === 'highlight' ? this.highlightColor : this.filledColor);
    const strokeFor = (i: number) => (pointStyles[i] === 'open' ? this.filledColor : 'none');
    const strokeWidthFor = (i: number) => (pointStyles[i] === 'open' ? 2 : 0);

    if ((this.data.pointShape ?? 'circle') === 'diamond') {
      const diamond = d3.symbol().type(d3.symbolDiamond).size(90);
      svg
        .selectAll('.dot')
        .data(y)
        .enter()
        .append('path')
        .attr('class', 'dot')
        .attr('d', diamond)
        .attr('transform', (d, i) => `translate(${xScale(i + 1)},${yScale(d)})`)
        .style('fill', (_d, i) => fillFor(i))
        .style('stroke', (_d, i) => strokeFor(i))
        .style('stroke-width', (_d, i) => strokeWidthFor(i));
    } else {
      svg
        .selectAll('.dot')
        .data(y)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', 5)
        .attr('cx', (_d, i) => xScale(i + 1))
        .attr('cy', d => yScale(d))
        .style('fill', (_d, i) => fillFor(i))
        .style('stroke', (_d, i) => strokeFor(i))
        .style('stroke-width', (_d, i) => strokeWidthFor(i));
    }
  }
}
