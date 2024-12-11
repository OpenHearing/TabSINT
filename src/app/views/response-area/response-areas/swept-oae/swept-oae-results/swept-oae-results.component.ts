import { Component, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { SweptOaeResultsInterface } from '../swept-oae-exam/sept-oae-exam.interface';

@Component({
  selector: 'swept-oae-results',
  templateUrl: './swept-oae-results.component.html',
  styleUrl: './swept-oae-results.component.css'
})
export class SweptOaeResultsComponent implements OnInit {
  @Input() sweptOAEResults!: SweptOaeResultsInterface;

  ngOnInit(): void {
    this.createResultsPlot();
  }

  private createResultsPlot() {
    // Set dimensions and margins
    const margin = { top: 20, right: 30, bottom: 60, left: 70 };
    const width = 450 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    const xTicks = [500, 1000, 2000, 4000, 8000, 16000];

    // Create SVG container
    const svg = d3.select('#oae-results-plot')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define scales
    const xScale = d3.scaleLog()
      .domain([500, 16000])
      .range([0, width]);

    const filteredData = this.filterSweptOaeResults(this.sweptOAEResults);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(
         [...filteredData.DpLow.Amplitude, ...filteredData.DpLow.NoiseFloor, ...filteredData.F1.Amplitude, ...filteredData.F2.Amplitude]) as number, 
        d3.max(
          [...filteredData.DpLow.Amplitude, ...filteredData.DpLow.NoiseFloor, ...filteredData.F1.Amplitude, ...filteredData.F2.Amplitude]) as number]
      ).range([height, 0]);

    // Define axes
    const xAxisMinor = d3.axisBottom(xScale).ticks(10).tickFormat(() => '');
    const xAxis = d3.axisBottom(xScale).tickValues(xTicks) .tickFormat(d => {
      const value = +d
      if (value >= 1000) {
        return `${value / 1000}k`; // Convert to 'k' format for thousands
      }
      return `${value}`; // Display as is for values below 1000
    });
    const yAxis = d3.axisLeft(yScale);

    // Append axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'axis-label')
      .call(xAxis)
      .append('text')
      .attr('class', 'label')
      .attr('font-size', 20)
      .attr('x', width / 2)
      .attr('y', 50)
      .style('text-anchor', 'middle')
      .attr('fill', 'black')
      .text('F2 Frequency (Hz)');

    svg.append('g')
    .attr('class', 'axis-label')
      .call(yAxis)
      .append('text')
      .attr('class', 'label')
      .attr('font-size', 20)
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('transform', 'rotate(-90)')
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Amplitude (dB SPL)');

    // Major X Axis Gridlines
    svg
      .append("g")
      .attr("class", "grid")
      .style("stroke-dasharray", "1,3")
      .style("stroke-opacity", "0.5")
      .call(xAxisMinor.tickSize(height).tickFormat(() => ""));

    // Major Y Axis gridlines
    svg
      .append("g")
      .attr("class", "grid")
      .style("stroke-dasharray", "1,3")
      .style("stroke-opacity", "0.5")
      .call(yAxis.ticks(10).tickSize(-width).tickFormat(() => ""));

    svg.selectAll('.axis-label .tick text')
      .attr('font-size', 16) // Set font size for tick labels
      .style('fill', 'black'); // Optionally, ensure the color is correct

    // Border around chart
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('height', height)
      .attr('width', width)
      .style('stroke', 'black')
      .style('fill', 'none')
      .style('stroke-width', 2);
  
    // Plot DpLow Amplitude (blue line)
    svg.selectAll('.dot')
      .data(filteredData.DpLow.Frequency)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => xScale(filteredData.DpLow.Frequency[i]))
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
      .attr('cx', (d, i) => xScale(filteredData.DpLow.Frequency[i]))
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
      .attr('cx', (d, i) => xScale(filteredData.F2.Frequency[i]))
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
      .attr('cx', (d, i) => xScale(filteredData.F1.Frequency[i]))
      .attr('cy', (d, i) => yScale(filteredData.F1.Amplitude[i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', '#ffc107')
      .style('stroke-width', 2);

    // Define the line generator
    const line = d3.line<{ frequency: number; amplitude: number }>()
      .x(d => xScale(d.frequency)) // Map x values
      .y(d => yScale(d.amplitude)) // Map y values
      .curve(d3.curveLinear); // Optional: Use d3.curveBasis or other curves for smoothing

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
      { label: 'OAE', color: 'blue', line: 'solid' },
      { label: 'NF', color: 'red', line:  'dashed' },
      { label: 'F2', color: '#9400d3',line:  'solid' },
      { label: 'F1', color: '#ffc107', line:  'solid' }
    ];

    // Append the legend group
    const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 75}, 15)`); // Position legend in the upper-right corner

    // Add a background box for the legend
    legend.append('rect')
      .attr('class', 'legend-box')
      .attr('x', -10) // Add some padding
      .attr('y', -10)
      .attr('width', 80) 
      .attr('height', legendData.length * 15 + 5) // Adjust height dynamically
      .style('fill', 'white')
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .style('rx', 5) // Rounded corners 
      .style('ry', 5);

    // Add legend items
    const legendGroups = legend.selectAll('.legend-item')
    .data(legendData)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 15})`); // Space items vertically

    legendGroups.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 30)
      .attr('y2', 0)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => (d.line === 'dashed' ? '5,5' : '0'));   

      // Add label
    legendGroups.append('text')
      .attr('x', 35) // Offset the label to the right of the symbol
      .attr('y', 5) // Vertically center the text
      .style('font-size', '12px')
      .style('fill', 'black')
      .text(d => d.label);
  }

  private filterSweptOaeResults(
    data: SweptOaeResultsInterface
  ): {
    DpLow: { Frequency: number[]; Amplitude: number[]; NoiseFloor: number[] };
    F2: { Frequency: number[]; Amplitude: number[] };
    F1: { Frequency: number[]; Amplitude: number[] };
  } {
    // Initialize filtered data
    const filteredData = {
      DpLow: {
        Frequency: [],
        Amplitude: [],
        NoiseFloor: [],
      },
      F2: {
        Frequency: [],
        Amplitude: [],
      },
      F1: {
        Frequency: [],
        Amplitude: [],
      },
    };
  
    // Helper function to filter and populate
    function filterAndPush(
      source: { Frequency: number[]; Amplitude: number[]; NoiseFloor?: number[] },
      target: { Frequency: number[]; Amplitude: number[]; NoiseFloor?: number[] }
    ) {
      for (let i = 0; i < source.Frequency.length; i++) {
        const freq = source.Frequency[i];
        if (freq >= 500 && freq <= 16000) {
          target.Frequency.push(freq);
          target.Amplitude.push(source.Amplitude[i]);
          if (source.NoiseFloor && target.NoiseFloor) {
            target.NoiseFloor.push(source.NoiseFloor[i]);
          }
        }
      }
    }
  
    if (data.DpLow) {
      filterAndPush(data.DpLow, filteredData.DpLow);
    }
  
    if (data.F2) {
      filterAndPush(data.F2, filteredData.F2);
    }
  
    if (data.F1) {
      filterAndPush(data.F1, filteredData.F1);
    }
  
    return filteredData;
  }
  



    dummyResult = {
      "State": "PLAYING",
      "PctComplete": 30,
      "NumSweeps": 1,
      "DpLow": {
        "Frequency": [
          67,
          138,
          284,
          587,
          1212,
          2502,
          5166,
          10667
        ],
        "Amplitude": [
          1.91,
          1.91,
          1.93,
          2.04,
          2.02,
          2.06,
          2.05,
          1.94
        ],
        "Phase": [
          0.505,
          0.495,
          0.505,
          0.5,
          0.494,
          0.505,
          0.504,
          0.502
        ],
        "NoiseFloor": [
          -11.96,
          -12.09,
          -12.01,
          -12.1,
          -11.93,
          -11.97,
          -12.04,
          -12.04
        ]
      },
      "DpHigh": {
        "Frequency": [
          117,
          241,
          497,
          1027,
          2121,
          4378,
          9041,
          18667
        ],
        "Amplitude": [
          -1.99,
          -2.05,
          -1.97,
          -2.1,
          -2.08,
          -2,
          -2.08,
          -2.02
        ],
        "Phase": [
          -2.497,
          -2.492,
          -2.497,
          -2.51,
          -2.506,
          -2.502,
          -2.498,
          -2.495
        ],
        "NoiseFloor": [
          -8.01,
          -7.98,
          -7.95,
          -8.1,
          -8.05,
          -8.07,
          -8.1,
          -7.95
        ]
      },
      "F1": {
        "Frequency": [
          100,
          206,
          426,
          880,
          1818,
          3753,
          7749,
          16000
        ],
        "Amplitude": [
          55.09,
          55.06,
          54.9,
          54.91,
          55.01,
          55,
          54.96,
          55.08
        ],
        "Phase": [
          0.25,
          0.256,
          0.245,
          0.248,
          0.255,
          0.25,
          0.242,
          0.246
        ]
      }
    }
}
