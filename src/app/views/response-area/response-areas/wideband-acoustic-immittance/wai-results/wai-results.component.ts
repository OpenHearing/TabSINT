import { AfterViewInit, Component, Input } from '@angular/core';
import * as d3 from 'd3';
import { WAIResultsInterface } from '../wai-exam/wai-exam.interface';
import { createWAIResultsChartSvg } from '../../../../../utilities/d3-plot-functions';

@Component({
  selector: 'wai-results',
  templateUrl: './wai-results.component.html',
  styleUrl: './wai-results.component.css'
})
export class WAIResultsComponent implements AfterViewInit {
  @Input() waiResults!: WAIResultsInterface;
  @Input() width!: number;
  @Input() height!: number;
  @Input() xTicks!: number[];
  @Input() margin!: { top: number, right: number, bottom: number, left: number, spacerW: number, spacerH: number };
  
  // svg: d3.Selection<SVGGElement, unknown, HTMLElement, any> | undefined;
  svg: any | undefined;

  ngAfterViewInit(): void {
    console.log("waiResults",this.waiResults);
    this.svg = this.createResultsPlot();
  }

  private createResultsPlot() {
    // could i use xticks to get the min/max? should we remove xticks from main template? keep all plotting here?
    let xRange = [Math.min(...this.waiResults.Frequency!), Math.max(...this.waiResults.Frequency!)];
    let svg = d3.select('#wai-results-plot')
      .append('svg')
          .attr('width', this.width + this.margin.left + this.margin.right + this.margin.spacerW)
          .attr('height', this.height + this.margin.top + this.margin.bottom + this.margin.spacerH);

    // Define the individual graph dimensions
    const plotWidth = this.width / 2;
    const plotHeight = this.height / 2;

    // Create groups for the four graphs
    const graphs = [
      { id: "Absorbance", 
        x: this.margin.left, 
        y: this.margin.top, 
        w: plotWidth,
        h: plotHeight,
        xRange: xRange,
        yRange: [0, 1], 
        yAxisFormat: ".1f",
        data: this.waiResults.Absorbance! 
      },
      { id: "Power Reflectance?", 
        x: plotWidth + this.margin.spacerW + this.margin.left, 
        y: this.margin.top, 
        w: plotWidth,
        h: plotHeight,
        xRange: xRange,
        yRange: [0, 1], 
        yAxisFormat: ".1f",
        data: this.waiResults.Absorbance! 
      },
      { id: "Impedance Magnitude", 
        x: this.margin.left, 
        y: plotHeight + this.margin.spacerH + this.margin.top, 
        w: plotWidth,
        h: plotHeight,
        xRange: xRange,
        yRange: [10**6, 10**9], 
        yAxisFormat: ".0e",
        data: this.waiResults.ImpedanceAmp! 
      },
      { id: "Impedance Phase", 
        x: plotWidth + this.margin.spacerW + this.margin.left, 
        y: plotHeight + this.margin.spacerH + this.margin.top, 
        w: plotWidth,
        h: plotHeight,
        xRange: xRange,
        yRange: [-180, 180], 
        yAxisFormat: ".0f",
        data: this.waiResults.ImpedancePhase! 
      },
    ];

    let xScale: any;
    let yScale: any;
    let lineData: any;
    let line: any;
    graphs.forEach(({ id, x, y, w, h, xRange, yRange, yAxisFormat, data }) => {
      xScale = d3.scaleLog()
        .domain(xRange)
        .range([0, plotWidth]);
      yScale = d3.scaleLinear()
          .domain(yRange)
          .range([plotHeight, 0]);

      svg.append("g")
        .attr("id", id)
        .attr("transform", `translate(${this.margin.left + x}, ${this.margin.top + y})`);
      let yAxisName = id;
      svg = createWAIResultsChartSvg(svg, x, y, w, h, this.xTicks, xScale, yScale, yAxisFormat, yAxisName);

      lineData = this.waiResults.Frequency!.map((frequency, i) => ({
        frequency,
        value: data[i],
      }));

      // Define the line generator
      line = d3.line<{ frequency: number; value: number }>()
        .x(d => xScale(d.frequency)) // Map x values
        .y(d => yScale(d.value)) // Map y values
        .curve(d3.curveLinear); // smoothing
  
      // Append the line path
      svg.append('path')
        .attr('transform', `translate(${x},${y})`)
        .datum(lineData) // Bind data
        .attr('fill', 'none') // Ensure no area is filled
        .attr('stroke', 'blue') // Set line color
        .attr('stroke-width', 2) // Set line thickness
        .attr('d', line); // Call the line generator

      // Define the legend data
      // const legendData = [
      //   { label: 'Absorbance', color: 'blue', line: 'solid' }
      // ];
      // createLegend(svg, legendData, this.width, 85);

    });
    
    return svg;
  }

}
