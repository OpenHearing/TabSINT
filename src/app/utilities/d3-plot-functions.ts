import * as d3 from 'd3';

interface LegendItemInterface {
    label: string;
    color: string;
    symbol?: string;
    line?: string;
}

export function createOAEResultsChartSvg(
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  chartWidth: number,
  chartHeight: number,
  xTicks: number[],
  xScale: d3.ScaleLogarithmic<number, number, never>,
  yScale: d3.ScaleLinear<number, number, never>
) {

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
      .attr('transform', `translate(0,${chartHeight})`)
      .attr('class', 'axis-label')
      .call(xAxis)
      .append('text')
      .attr('class', 'label')
      .attr('font-size', 20)
      .attr('x', chartWidth / 2)
      .attr('y', 50)
      .style('text-anchor', 'middle')
      .attr('fill', 'black')
      .text('Frequency (Hz)');

    svg.append('g')
    .attr('class', 'axis-label')
      .call(yAxis)
      .append('text')
      .attr('class', 'label')
      .attr('font-size', 20)
      .attr('x', -chartHeight / 2)
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
      .call(xAxisMinor.tickSize(chartHeight).tickFormat(() => ""));

    // Major Y Axis gridlines
    svg
      .append("g")
      .attr("class", "grid")
      .style("stroke-dasharray", "1,3")
      .style("stroke-opacity", "0.5")
      .call(yAxis.ticks(10).tickSize(-chartWidth).tickFormat(() => ""));

    svg.selectAll('.axis-label .tick text')
      .attr('font-size', 16) // Set font size for tick labels
      .style('fill', 'black'); // Optionally, ensure the color is correct

    // Border around chart
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('height', chartHeight)
      .attr('width', chartWidth)
      .style('stroke', 'black')
      .style('fill', 'none')
      .style('stroke-width', 2);

    return svg;
}

export function createWAIResultsChartSvg(
  svg: any,
  chartX: number,
  chartY: number,
  chartWidth: number,
  chartHeight: number,
  xTicks: number[],
  xScale: d3.ScaleLogarithmic<number, number, never>,
  yScale: d3.ScaleLinear<number, number, never>
) {
    // Define axes
    const xAxisMinor = d3.axisBottom(xScale).ticks(10).tickFormat(() => '');
    const xAxis = d3.axisBottom(xScale).tickValues(xTicks).tickFormat(d => {
      const value = +d
      if (value >= 1000) {
        return `${value / 1000}k`; // Convert to 'k' format for thousands
      }
      return `${value}`; // Display as is for values below 1000
    });
    const yAxis = d3.axisLeft(yScale);

    // Append axes
    svg.append('g')
      .attr('transform', `translate(${chartX},${chartY+chartHeight})`)
      .attr('class', 'axis-label')
      .call(xAxis)
      .append('text')
      .attr('class', 'label')
      .attr('font-size', 20)
      .attr('x', chartWidth / 2)
      .attr('y', 40)
      .style('text-anchor', 'middle')
      .attr('fill', 'black')
      .text('Frequency (Hz)');

    if (chartY>chartHeight && chartX<chartWidth) {
      svg.append('g')
      .attr('transform', `translate(${chartX},${chartY})`)
      .attr('class', 'axis-label')
      .call(yAxis.tickFormat(d3.format(".1e")))
      .append('text')
      .attr('class', 'label')
      .attr('font-size', 20)
      .attr('x', -chartHeight / 2)
      .attr('y', -40)
      .attr('transform', 'rotate(-90)')
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Absorbance');
    } else {
      svg.append('g')
      .attr('transform', `translate(${chartX},${chartY})`)
      .attr('class', 'axis-label')
      .call(yAxis)
      .append('text')
      .attr('class', 'label')
      .attr('font-size', 20)
      .attr('x', -chartHeight / 2)
      .attr('y', -40)
      .attr('transform', 'rotate(-90)')
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Absorbance');
    }

    // Major X Axis Gridlines
    svg.append("g")
      .attr('transform', `translate(${chartX},${chartY})`)
      .attr("class", "grid")
      .style("stroke-dasharray", "1,3")
      .style("stroke-opacity", "0.5")
      .call(xAxisMinor.tickSize(chartHeight).tickFormat(() => ""));

    // Major Y Axis gridlines
    svg.append("g")
      .attr('transform', `translate(${chartX},${chartY})`)
      .attr("class", "grid")
      .style("stroke-dasharray", "1,3")
      .style("stroke-opacity", "0.5")
      .call(yAxis.ticks(10).tickSize(-chartWidth).tickFormat(() => ""));

    svg.selectAll('.axis-label .tick text')
      .attr('font-size', 16) // Set font size for tick labels
      .style('fill', 'black'); // Optionally, ensure the color is correct

    // Border around chart
    svg.append('rect')
      .attr('x', chartX)
      .attr('y', chartY)
      .attr('height', chartHeight)
      .attr('width', chartWidth)
      .style('stroke', 'black')
      .style('fill', 'none')
      .style('stroke-width', 2);

    return svg;
}

export function createLegend(
    svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
    legendData: LegendItemInterface[], 
    chartWidth: number,
    legendWidth: number
) {
    // Append the legend group
    const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${chartWidth - legendWidth - 5}, 15)`); // Position legend in the upper-right corner

    // Add a background box for the legend
    legend.append('rect')
      .attr('class', 'legend-box')
      .attr('x', -10) // Add some padding
      .attr('y', -10)
      .attr('width', legendWidth) 
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

    // Add symbols, lines, and labels for each legend item
    legendGroups.each(function (legendItem) {
      const group = d3.select<SVGGElement, LegendItemInterface>(this);

      if (legendItem.symbol) {
          addSymbol(group, legendItem);
      }

      if (legendItem.line) {
          addLine(group, legendItem);
      }

      // Add label
      group.append('text')
          .attr('x', 30)
          .attr('y', 5)
          .style('font-size', '12px')
          .style('fill', 'black')
          .text(legendItem.label);
  });

  function addSymbol(group: d3.Selection<SVGGElement, LegendItemInterface, null, undefined>, legendItem: LegendItemInterface) {
      const size = 5;
      if (legendItem.symbol === 'circle') {
          group.append('circle')
              .attr('cx', 10)
              .attr('cy', 0)
              .attr('r', size)
              .style('fill', 'none')
              .style('stroke', legendItem.color)
              .style('stroke-width', 2);
      } else if (legendItem.symbol === 'X') {
          group.append('line')
              .attr('x1', -size + 10).attr('y1', -size)
              .attr('x2', size + 10).attr('y2', size)
              .style('stroke', legendItem.color)
              .style('stroke-width', 2);

          group.append('line')
              .attr('x1', -size + 10).attr('y1', size)
              .attr('x2', size + 10).attr('y2', -size)
              .style('stroke', legendItem.color)
              .style('stroke-width', 2);
      }
  }

  function addLine(group: d3.Selection<SVGGElement, LegendItemInterface, null, undefined>, legendItem: LegendItemInterface) {
      group.append('line')
          .attr('x1', -5).attr('y1', 0)
          .attr('x2', 25).attr('y2', 0)
          .attr('stroke', legendItem.color)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', legendItem.line === 'dashed' ? '5,5' : '0');
  }
}
