import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { GapPlotDataInterface } from '../gap.interface';

@Component({
  selector: 'app-gap-results',
  templateUrl: './gap-results.component.html',
  styleUrl: './gap-results.component.css',
})
export class GapResultsComponent implements AfterViewInit {
  @Input() data!: GapPlotDataInterface;
  @ViewChild('gapResultsPlot') private readonly plotRef!: ElementRef<HTMLDivElement>;

  private readonly plotWidth = 400;
  private readonly plotHeight = 400;
  private readonly margin = { top: 40, right: 10, bottom: 40, left: 65 };
  private readonly reversalColor = '#FF6347';
  private readonly dotColor = '#1f77b4';

  ngAfterViewInit(): void {
    this.createPlot();
  }

  /**
   * Render the gap detection results: one dot per presentation (gap length on the y axis),
   * reversal presentations highlighted, plus an optional threshold reference line.
   */
  private createPlot(): void {
    const y = this.data.y ?? [];
    const width = this.plotWidth - this.margin.left - this.margin.right;
    const height = this.plotHeight - this.margin.top - this.margin.bottom;

    const dataMin = y.length ? Math.min(...y) : 0;
    // y-axis lower bound: 0 when all gap lengths are non-negative, otherwise the
    // next multiple of 20 below the smallest value (rounds dataMin down to a clean tick).
    const minY = dataMin < 0 ? -20 * Math.ceil(Math.abs(dataMin) / 20) : 0;
    // y-axis upper bound: max gap length reported by the device, defaulting to 200 ms.
    const maxY = this.data.maxY ?? 200;
    const minX = Math.max(y.length, 5);

    const xScale = d3.scaleLinear().range([0, width]).domain([0, minX]);
    const yScale = d3.scaleLinear().range([height, 0]).domain([minY, maxY]);

    const svg = d3
      .select(this.plotRef.nativeElement)
      .append('svg')
      .attr('width', width + this.margin.left + this.margin.right)
      .attr('height', height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // x-axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('font-size', 16)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')));
    svg
      .append('text')
      .attr('font-size', 20)
      .attr('x', width / 2)
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

    // title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 10)
      .style('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .style('font-size', '20px')
      .text(this.data.title);

    // threshold reference line
    if (this.data.GapThreshold) {
      const line = d3
        .line<{ x: number; y: number }>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y));
      svg
        .append('path')
        .datum([
          { x: 0, y: this.data.GapThreshold },
          { x: minX, y: this.data.GapThreshold },
        ])
        .attr('stroke', 'black')
        .attr('fill', 'none')
        .style('stroke-dasharray', '4,4')
        .attr('d', line);
    }

    // data points
    svg
      .selectAll('.dot')
      .data(y)
      .enter()
      .append('circle')
      .attr('r', 5)
      .attr('cx', (_d, i) => xScale(i + 1))
      .attr('cy', d => yScale(d))
      .style('fill', (_d, i) => (this.data.reversals?.[i] ? this.reversalColor : this.dotColor));
  }
}
