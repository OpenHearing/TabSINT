import { AfterViewInit, Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { WAIResultsInterface } from '../wai-exam/wai-exam.interface';
import { createLegend, createOAEResultsChartSvg } from '../../../../../utilities/d3-plot-functions';

@Component({
  selector: 'wai-results',
  templateUrl: './wai-results.component.html',
  styleUrl: './wai-results.component.css'
})
export class WAIResultsComponent implements AfterViewInit {
  @Input() waiResults!: WAIResultsInterface;
  @Input() xScale!: d3.ScaleLogarithmic<number, number, never>;
  @Input() width!: number;
  @Input() height!: number;
  @Input() xTicks!: number[];
  @Input() margin!: { top: number, right: number, bottom: number, left: number };
  
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, any> | undefined;

  ngAfterViewInit(): void {
    this.svg = this.createResultsPlot();
  }

  private createResultsPlot() {
    const filteredData = {
      DpLow: {
        Amplitude: [1],
        NoiseFloor: [1],
        Frequency: [1]
      },
      F1: {
        Amplitude: [1],
        NoiseFloor: [1],
        Frequency: [1]
      },
      F2: {
        Amplitude: [1],
        NoiseFloor: [1],
        Frequency: [1]
      }
    };

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(
         [...filteredData.DpLow.Amplitude, ...filteredData.DpLow.NoiseFloor, ...filteredData.F1.Amplitude, ...filteredData.F2.Amplitude]) as number, 
        d3.max(
          [...filteredData.DpLow.Amplitude, ...filteredData.DpLow.NoiseFloor, ...filteredData.F1.Amplitude, ...filteredData.F2.Amplitude]) as number]
      ).range([this.height, 0]);

    let svg = d3.select('#wai-results-plot')
      .append('svg')
          .attr('width', this.width + this.margin.left + this.margin.right)
          .attr('height', this.height + this.margin.top + this.margin.bottom)
          .append('g')
          .attr('transform', `translate(${this.margin.left},${this.margin.top})`);;
    
    svg = createOAEResultsChartSvg(svg, this.width, this.height, this.xTicks, this.xScale, yScale);

    // Plot DpLow Amplitude (blue line)
    svg.selectAll('.dot')
      .data(filteredData.DpLow.Frequency)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => this.xScale(filteredData.DpLow.Frequency[i]))
      .attr('cy', (d, i) => yScale(filteredData.DpLow.Amplitude[i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', 'blue')
      .style('stroke-width', 2);

    // Plot Noise Floor (dashed red line)
    svg.selectAll('.dot')
      .data(filteredData.DpLow.Frequency)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => this.xScale(filteredData.DpLow.Frequency[i]))
      .attr('cy', (d, i) => yScale(filteredData.DpLow.NoiseFloor[i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', 'red')
      .style("stroke-dasharray", "1,3")
      .style('stroke-width', 2);

    // Plot F2 (violet line)
    svg.selectAll('.dot')
      .data(filteredData.F2.Frequency)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => this.xScale(filteredData.F2.Frequency[i]))
      .attr('cy', (d, i) => yScale(filteredData.F2.Amplitude[i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', '#9400d3')
      .style('stroke-width', 2);

    // PlotF1 (yellow line)
    svg.selectAll('.dot')
      .data(filteredData.F1.Frequency)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => this.xScale(filteredData.F1.Frequency[i]))
      .attr('cy', (d, i) => yScale(filteredData.F1.Amplitude[i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', '#ffc107')
      .style('stroke-width', 2);

    // Define the line generator
    const line = d3.line<{ frequency: number; amplitude: number }>()
      .x(d => this.xScale(d.frequency)) // Map x values
      .y(d => yScale(d.amplitude)) // Map y values
      .curve(d3.curveLinear); // smoothing

    const lineData = filteredData.DpLow.Frequency.map((frequency, i) => ({
      frequency,
      amplitude: filteredData.DpLow.Amplitude[i],
    }));

    // Append the line path
    svg.append('path')
      .datum(lineData) // Bind data
      .attr('fill', 'none') // Ensure no area is filled
      .attr('stroke', 'blue') // Set line color
      .attr('stroke-width', 2) // Set line thickness
      .attr('d', line); // Call the line generator

    // Define the legend data
    const legendData = [
      { label: 'DPOAE', color: 'blue', line: 'solid' },
      { label: 'NF', color: 'red', line:  'dashed' },
      { label: 'F2', color: '#9400d3',line:  'solid' },
      { label: 'F1', color: '#ffc107', line:  'solid' }
    ];

    createLegend(svg, legendData, this.width, 85);
    return svg;
  }

}
