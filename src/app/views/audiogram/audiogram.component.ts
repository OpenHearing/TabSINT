import { Component, ElementRef, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import * as d3 from 'd3';

interface ResponsesInterface {
  frequencies: number[],
  leftThresholds: (number|null)[],
  rightThresholds: (number|null)[],
}

interface AudiogramData {
  frequency: number[];
  level: number[];
  channel: string[];
  ResultType: string[];
  masking: boolean[];
  xLabel?: string;
  yLabel?: string;
  title?: string;
}

@Component({
  selector: 'audiogram',
  templateUrl: './audiogram.component.html',
  styleUrl: './audiogram.component.css'
})
export class AudiogramComponent implements OnInit, OnChanges {
  private svg: any;

  @Input()
  data!: ResponsesInterface;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.updateChart();
    }
  }

  createChart(): void {
    // Get the native element of the component
    const domElem = this.elementRef.nativeElement;

    const data = dataStruct.frequency.map((frequency, index) => ({
      level: dataStruct.level[index],
      frequency,
      channel: dataStruct.channel[index],
      ResultType: dataStruct.ResultType[index],
      masking: dataStruct.masking[index],
    }));
  
    const xTicks = [125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const xTicksMinor = [750, 1500, 3000, 6000];
    const yTicks = [-20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
    const aspectRatio = (yTicks.length - 1) / 2 / (xTicks.length - 1); // maintain 20dB/octave ratio
  
    const margin = { top: 55, right: 60, bottom: 60, left: 60 };
    const width = 520 - margin.left - margin.right;
    const height = width * aspectRatio;
  
    const xScale = d3.scaleLog().base(2).range([0, width]).domain([93.75, 24000]);
    const yScale = d3.scaleLinear().range([0, height]).domain([d3.min(yTicks)!, d3.max(yTicks)!]);
  
    const xAxis = d3.axisTop(xScale).tickFormat(d3.format(",.0f")).tickValues(xTicks).tickSize(15);
    const xAxisMinor = d3.axisTop(xScale).tickFormat(d3.format(",.0f")).tickValues(xTicksMinor).tickSize(3);
    const yAxis = d3.axisLeft(yScale).tickValues(yTicks).tickSize(10);
  
    const colorMap = (d: any) => d.channel.includes('left') ? 'blue' : '#FF6347';
    const strokeWidthMap = () => 2;
    const symbolMap = (d: any) => d.channel === 'left' ? 'M0,-10L10,10H-10Z' : 'M0,10L10,-10L-10,-10Z'; // simple triangle shapes
  
    // Clear existing SVG if present
    d3.select(domElem).selectAll('*').remove();
  
    const svg = d3.select(domElem)
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
  
    // Border around chart
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('height', height)
      .attr('width', width)
      .style('stroke', 'black')
      .style('fill', 'none')
      .style('stroke-width', 2);
  
    // Plot points
    const nodes = svg.selectAll('.node')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${xScale(d.frequency)},${yScale(d.level)})`);
  
    nodes.append('path')
      .attr('d', symbolMap)
      .attr('stroke', colorMap)
      .attr('fill', 'none')
      .attr('stroke-width', strokeWidthMap);
  
    // Draw lines between points (thresholds only)
    svg.selectAll('.dline')
      .data(data)
      .enter()
      .append('line')
      .filter((d, i, arr) => i < arr.length - 1 && d.ResultType === 'Threshold' && arr[i + 1].ResultType === 'Threshold' && d.channel === arr[i + 1].channel)
      .attr('x1', d => xScale(d.frequency))
      .attr('y1', d => yScale(d.level))
      .attr('x2', (d, i) => xScale(data[i + 1].frequency))
      .attr('y2', (d, i) => yScale(data[i + 1].level))
      .attr('stroke', colorMap)
      .attr('stroke-width', strokeWidthMap);
  }

  updateChart(): void {
    // Update the chart based on the new data
  }
}