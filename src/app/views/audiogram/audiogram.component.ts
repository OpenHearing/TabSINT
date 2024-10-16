import { Component, ElementRef, OnInit, Input } from '@angular/core';
import * as d3 from 'd3';
import { AudiogramDataNoNullInterface, AudiogramDataStructInterface } from '../../interfaces/audiogram.interface';

// See https://www.asha.org/policy/GL1990-00006/ for audiogram specifications
@Component({
  selector: 'audiogram',
  templateUrl: './audiogram.component.html',
  styleUrl: './audiogram.component.css'
})
export class AudiogramComponent implements OnInit{

  @Input()
  dataStruct!: AudiogramDataStructInterface;

  constructor(private readonly elementRef: ElementRef) {
  }

  ngOnInit(): void {
    if (this.dataStruct) {
      this.createAudiogram();
    }
  }

  createAudiogram(): void {
    const data: AudiogramDataNoNullInterface[] = this.dataStruct.frequencies
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
      .filter((item): item is AudiogramDataNoNullInterface => item !== null); // Filter out null values

    const xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const xTicksMinor = [750, 1500, 3000, 6000];
    const yTicks = [-20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    const aspectRatio = (yTicks.length - 1) / 2 / (xTicks.length - 1); // maintain 20dB/octave ratio
  
    const margin = { top: 55, right: 60, bottom: 60, left: 80 };
    const width = 540 - margin.left - margin.right;
    const height = width * aspectRatio - 20;
  
    const xScale = d3.scaleLog().base(2).range([0, width]).domain([93.75, 24000]);
    const yScale = d3.scaleLinear().range([0, height]).domain([d3.min(yTicks)!, d3.max(yTicks)!]);
  
    const xAxis = d3.axisTop(xScale).tickFormat(d3.format(",.0f")).tickValues(xTicks).tickSize(15);
    const xAxisMinor = d3.axisTop(xScale).tickFormat(d3.format(",.0f")).tickValues(xTicksMinor).tickSize(3);
    const yAxis = d3.axisLeft(yScale).tickValues(yTicks).tickSize(10);

    const colorMap = (d: any) => d.channel.includes('left') ? 'blue' : '#FF6347';
    const strokeWidthMap = () => 2;
    const symbolMap = (d: any) => {
      if (d.channel === 'left') {
        return "M -4,-4 L 4,4 M -4,4 L 4,-4"; // "X" shape as custom path
      } else {
        return d3.symbol().type(d3.symbolCircle).size(50)(); // Circle for the right ear
      }
    };
      
    // Chart Area
    const svg = d3.select(this.elementRef.nativeElement)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // X-axis
    svg.append('g').attr('class', 'x axis').attr('font-size', 16).call(xAxis);
    svg.append('g').attr('class', 'x axis minor').call(xAxisMinor);
    svg.append('text')
      .attr('class', 'label')
      .attr('font-size', 20)
      .attr('x', width / 2)
      .attr('y', -40)
      .style('text-anchor', 'middle')
      .text('Frequency (Hz)');
  
    // Y-axis
    svg.append('g').attr('class', 'y axis').attr('font-size', 16).call(yAxis);
    svg.append('text')
      .attr('font-size', 20)
      .attr('class', 'label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .text('Hearing Level (dB)');

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

    // Border around chart
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('height', height)
      .attr('width', width)
      .style('stroke', 'black')
      .style('fill', 'none')
      .style('stroke-width', 2);
  
    // Data Points
    const nodes = svg.selectAll('.node')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => {
        const x = xScale(d!.frequency*1000);
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
      let theta = Math.atan(
        (yScale(data[k + 1].threshold) - yScale(data[k].threshold)) /
          (xScale(data[k + 1].frequency*1000) - xScale(data[k].frequency*1000))
      );
      if (data[k].channel === "left" && data[k + 1].channel === "left") {
        if (data[k].resultType === "Threshold" && data[k + 1].resultType === "Threshold") {
          dline
            .enter()
            .append("line")
            .attr("x1", xScale(data[k].frequency*1000) + r * Math.cos(theta))
            .attr("y1", yScale(data[k].threshold) + r * Math.sin(theta))
            .attr("x2", xScale(data[k + 1].frequency*1000) - r * Math.cos(theta))
            .attr("y2", yScale(data[k + 1].threshold) - r * Math.sin(theta))
            .attr("stroke", colorMap(data[k]))
            .attr("stroke-width", strokeWidthMap);
        }
      } else if (data[k].channel === "right" && data[k + 1].channel === "right") {
        if (data[k].resultType === "Threshold" && data[k + 1].resultType === "Threshold") {
          dline
            .enter()
            .append("line")
            .attr("x1", xScale(data[k].frequency*1000) + r * Math.cos(theta))
            .attr("y1", yScale(data[k].threshold) + r * Math.sin(theta))
            .attr("x2", xScale(data[k + 1].frequency*1000) - r * Math.cos(theta))
            .attr("y2", yScale(data[k + 1].threshold) - r * Math.sin(theta))
            .attr("stroke", colorMap(data[k]))
            .attr("stroke-width", strokeWidthMap);
        }
      }
    }
  }
}