import { AfterViewInit, Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { WAIResultsInterface } from '../wai-exam/wai-exam.interface';
import { createLegend, createWAIResultsChartSvg } from '../../../../../utilities/d3-plot-functions';

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
    console.log("waiResults",this.waiResults);
    this.svg = this.createResultsPlot();
  }

  private createResultsPlot() {
    let svg = d3.select('#wai-results-plot')
      .append('svg')
          .attr('width', this.width + this.margin.left + this.margin.right)
          .attr('height', this.height + this.margin.top + this.margin.bottom)
          .append('g')
          .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Define the individual graph dimensions
    // const plotWidth = (this.width - this.margin.left - this.margin.right) / 2;
    // const plotHeight = (this.height - this.margin.top - this.margin.bottom) / 2;

    // Create groups for the four graphs
    // const graphs = [
    //   { id: "Absorbance", x: 0, y: 0 },
    //   { id: "Power Reflectance", x: plotWidth, y: 0 },
    //   { id: "Impedance Magnitude", x: 0, y: plotHeight },
    //   { id: "Impedance Phase", x: plotWidth, y: plotHeight },
    // ];
    
    // graphs.forEach(({ id, x, y }) => {
    //   svg.append("g")
    //     .attr("id", id)
    //     .attr("transform", `translate(${this.margin.left + x}, ${this.margin.top + y})`);
    // });

    const yScale = d3.scaleLinear()
      .domain([
        // d3.min(this.waiResults.Absorbance!) as number, 
        // d3.max(this.waiResults.Absorbance!) as number
        0, 1
      ]).range([this.height, 0]);
    
    svg = createWAIResultsChartSvg(svg, this.width, this.height, this.xTicks, this.xScale, yScale);

    // Define the line generator
    const line = d3.line<{ frequency: number; amplitude: number }>()
      .x(d => this.xScale(d.frequency)) // Map x values
      .y(d => yScale(d.amplitude)) // Map y values
      .curve(d3.curveLinear); // smoothing

    const lineData = this.waiResults.Frequency!.map((frequency, i) => ({
      frequency,
      amplitude: this.waiResults.Absorbance![i],
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
      { label: 'Absorbance', color: 'blue', line: 'solid' }
    ];

    createLegend(svg, legendData, this.width, 85);
    return svg;
  }

}
