import { Component, ElementRef, OnInit, Input,SimpleChanges  } from '@angular/core';
import * as d3 from 'd3';
import { AudiogramDatumNoNullInterface, AudiometryResultsInterface } from '../../interfaces/audiometry-results.interface';
import { LevelUnits, ResultType } from '../../utilities/constants';

// See https://www.asha.org/policy/GL1990-00006/ for audiogram specifications
@Component({
  selector: 'audiogram',
  templateUrl: './audiogram.component.html',
  styleUrl: './audiogram.component.css'
})
export class AudiogramComponent implements OnInit{

  @Input()
  dataStruct!: AudiometryResultsInterface;

  @Input() selectedEar: string | null = null;

  @Input() earChannel: 'left' | 'right' = 'left';

  @Input() isManualExam: boolean = false;

  @Input() levelUnits: string = "dB HL";
  constructor(private readonly elementRef: ElementRef) {
  }

  ngOnInit(): void {
    if (this.dataStruct) {
      this.createAudiogram();
      this.updateGraphBorders();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedEar']) {
      this.updateGraphBorders();
    }
  }


  updateGraphBorders(): void {
  
    const svg = d3.select(this.elementRef.nativeElement).select('svg');
  
    const graphBorder = svg.select('rect.graph-border');
  
    if (this.selectedEar === 'Left') {
      graphBorder
        .style('stroke', 'blue')
        .style('stroke-width', '3px');
    } else if (this.selectedEar === 'Right') {
      graphBorder
        .style('stroke', 'red')
        .style('stroke-width', '3px');
    } else {
      graphBorder
        .style('stroke', 'black')
        .style('stroke-width', '1px');
    }
  }
  

  createAudiogram(): void {
    const data: AudiogramDatumNoNullInterface[] = this.dataStruct.frequencies
      .map((frequency, index) => {
        const threshold = this.dataStruct.thresholds[index];
        // Check that the threshold is defined and not null
        if (threshold !== null && threshold !== undefined) {
          return {
            threshold,
            frequency,
            channel: this.dataStruct.channels[index],
            resultType: this.dataStruct.resultTypes[index],
            masking: this.dataStruct.masking[index],
          };
        }
        // Return null if the threshold is null or undefined
        return null;
      })
      .filter((item): item is AudiogramDatumNoNullInterface => item !== null); // Filter out null values

    const title = this.dataStruct.levelUnits === LevelUnits.dB_SPL
      ? 'Hearing Level (dB SPL)'
      : this.dataStruct.levelUnits === LevelUnits.dB_HL
        ? 'Hearing Level (dB HL)'
        : 'Incorrect Level Units, should not be here';
    const xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const xTicksMinor = [750, 1500, 3000, 6000];
    const yTicks = [-20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    const aspectRatio = (yTicks.length - 1) / 2 / (xTicks.length - 1); // maintain 20dB/octave ratio
    const margin = this.isManualExam
    ? { top: 50, right: 60, bottom: 60, left: 80 }
    : { top: 55, right: 60, bottom: 60, left: 80 };
    const width = this.isManualExam
      ? 350 - margin.left - margin.right
      : 540 - margin.left - margin.right;
    const height = width * aspectRatio - 20;
    const graphBorderColor = this.dataStruct.channels[0] === 'left' ? 'blue' : 'red';
    const xScale = d3.scaleLog().base(2).range([0, width]).domain([93.75, 24000]);
    const yScale = d3.scaleLinear().range([0, height]).domain([d3.min(yTicks)!, d3.max(yTicks)!]);
  
    const xAxis = d3.axisTop(xScale).tickFormat(d3.format(",.0f")).tickValues(xTicks).tickSize(15);
    const xAxisMinor = d3.axisTop(xScale).tickFormat(d3.format(",.0f")).tickValues(xTicksMinor).tickSize(3);
    const yAxis = d3.axisLeft(yScale).tickValues(yTicks).tickSize(10);

    const colorMap = (d: any) => d.channel.includes('left') ? 'blue' : '#FF6347';
    const strokeWidthMap = () => 2;
    // M -10,12 L -8,7
    const symbolMap = (d: any): string => {
      if (d.resultType === ResultType.Beyond || d.resultType=== ResultType.Better) {
        if (d.channel === 'left') {
          // X with a proper southeast arrowhead
          return `
           M -4,-4 L 4,9
           M -4,4 L 4, -4
           M 4,9 L 6,4
           M 4,9 L -2,8
          `;
        } else if (d.channel === 'right') {
          // Circle with a proper southwest arrowhead
          return `
            M 0,-5 A 5,5 0 1,0 0,5 A 5,5 0 1,0 0,-5
            M 0,5 L -10,12
            M -10,12 L -8,7
            M -10,12 L -2,11
          `;
        }
      } else {
        // Default symbols for Threshold points
        if (d.channel === 'left') {
          return "M -4,-4 L 4,4 M -4,4 L 4,-4"; // X Shape
        }
          return d3.symbol().type(d3.symbolCircle).size(50)() ?? "";
      }
    
      return ""; // Return an empty string as a fallback
    };
    
    
    // Chart Area
    const svg = d3.select(this.elementRef.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // X-axis
    svg.append('g').attr('class', 'x axis').attr('font-size', 14).call(xAxis);
    svg.append('g').attr('class', 'x axis minor').call(xAxisMinor);
    svg.append('text')
      .attr('class', 'label')
      .attr('font-size', 18)
      .attr('x', width / 2)
      .attr('y', -35)
      .style('text-anchor', 'middle')
      .text('Frequency (Hz)');
  
    // Y-axis
    svg.append('g').attr('class', 'y axis').attr('font-size', 14).call(yAxis);
    svg.append('text')
      .attr('font-size', 18)
      .attr('class', 'label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 30)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .text(title);

    // Major X Axis Gridlines, Solid
    svg
      .append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis.tickSize(height).tickFormat(() => ""));

    // Minor X Axis Gridlines, Dashed
    svg
      .append("g")
      .attr("class", "grid")
      .attr("transform", "translate(0," + (height - height / 39 + 9) + ")")
      .style("stroke-dasharray", "" + height / 39 + "," + (2 * height) / 39 + "")
      .call(xAxisMinor.tickSize(height - (2 * height) / 39 + 9).tickFormat(() => ""));

    // Major Y Axis Gridlines, Solid
    svg
      .append("g")
      .attr("class", "grid")
      .call(yAxis.ticks(10).tickSize(-width).tickFormat(() => ""));

  svg.append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('height', height)
  .attr('width', width)
  .attr('class', 'graph-border')
  .style('stroke', graphBorderColor)  // Use the color you defined earlier
  .style('fill', 'none')
  .style('stroke-width', '1px'); 
  
    // Data Points
    const nodes = svg.selectAll('.node')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => {
        const x = xScale(d!.frequency);
        const y = yScale(d!.threshold);
        return `translate(${x},${y})`;
      });
      
    nodes.append('path')
      .attr('d', (d: any) => symbolMap(d))
      .attr('stroke', colorMap)
      .attr('fill', 'none')
      .attr('stroke-width', strokeWidthMap);
  
    data.sort((a, b) => a.channel.localeCompare(b.channel) || a.frequency - b.frequency);

    // draw lines between symbols
    let dline = svg.selectAll(".dline").data(data);

    // r is the buffer radius around symbols in pixels
    let r = 12;
    for (let k = 0; k < data.length - 1; k++) {
      // Calculate the angle (theta) for buffer adjustment
      let theta = Math.atan(
        (yScale(data[k + 1].threshold) - yScale(data[k].threshold)) /
        (xScale(data[k + 1].frequency) - xScale(data[k].frequency))
      );
    
      // Ensure lines are drawn only between points belonging to the same ear channel
      if (data[k].channel === data[k + 1].channel) {
        dline
          .enter()
          .append("line")
          .attr("x1", xScale(data[k].frequency) + r * Math.cos(theta)) // Starting X position with buffer
          .attr("y1", yScale(data[k].threshold) + r * Math.sin(theta)) // Starting Y position with buffer
          .attr("x2", xScale(data[k + 1].frequency) - r * Math.cos(theta)) // Ending X position with buffer
          .attr("y2", yScale(data[k + 1].threshold) - r * Math.sin(theta)) // Ending Y position with buffer
          .attr("stroke", colorMap(data[k])) // Stroke color based on channel
          .attr("stroke-width", strokeWidthMap); // Stroke width
      }
    }
  }
}