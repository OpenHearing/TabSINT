import * as d3 from 'd3';
import { NormativeDataInterface } from '../interfaces/normative-data-interface';
import { WAIResultsPlotInterface } from '../views/response-area/response-areas/wideband-acoustic-immittance/wai-exam/wai-exam.interface';
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
  yScale: d3.ScaleLinear<number, number, never>,
  xAxisLabel: string = 'Frequency (Hz)',
  yAxisLabel: string = 'Amplitude (dB SPL)'
) {
  // Define axes
  const xAxisMinor = d3
    .axisBottom(xScale)
    .ticks(10)
    .tickFormat(() => '');
  const xAxis = d3
    .axisBottom(xScale)
    .tickValues(xTicks)
    .tickFormat(d => {
      const value = +d;
      if (value >= 1000) {
        return `${value / 1000}k`; // Convert to 'k' format for thousands
      }
      return `${value}`; // Display as is for values below 1000
    });
  const yAxis = d3.axisLeft(yScale);

  // Append axes
  svg
    .append('g')
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
    .text(xAxisLabel);

  svg
    .append('g')
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
    .text(yAxisLabel);

  // Major X Axis Gridlines
  svg
    .append('g')
    .attr('class', 'grid')
    .style('stroke-dasharray', '1,3')
    .style('stroke-opacity', '0.5')
    .call(xAxisMinor.tickSize(chartHeight).tickFormat(() => ''));

  // Major Y Axis gridlines
  svg
    .append('g')
    .attr('class', 'grid')
    .style('stroke-dasharray', '1,3')
    .style('stroke-opacity', '0.5')
    .call(
      yAxis
        .ticks(10)
        .tickSize(-chartWidth)
        .tickFormat(() => '')
    );

  svg
    .selectAll('.axis-label .tick text')
    .attr('font-size', 16) // Set font size for tick labels
    .style('fill', 'black'); // Optionally, ensure the color is correct

  // Border around chart
  svg
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', chartHeight)
    .attr('width', chartWidth)
    .style('stroke', 'black')
    .style('fill', 'none')
    .style('stroke-width', 2);

  return svg;
}

export function createWAIResultsChartSvg(plotData: WAIResultsPlotInterface) {
  // Define axes
  const xAxisMinor = d3
    .axisBottom(plotData.xScale)
    .ticks(10)
    .tickFormat(() => '');
  const xAxis = d3
    .axisBottom(plotData.xScale)
    .tickValues(plotData.xTicks)
    .tickFormat(d => {
      const value = +d;
      if (value >= 1000) {
        return `${value / 1000}k`; // Convert to 'k' format for thousands
      }
      return `${value}`; // Display as is for values below 1000
    });
  const yAxis = d3.axisLeft(plotData.yScale);

  // Append axes
  plotData.svg
    .append('g')
    .attr('transform', `translate(${plotData.chartX},${plotData.chartY + plotData.chartHeight})`)
    .attr('class', 'axis-label')
    .call(xAxis)
    .append('text')
    .attr('class', 'label')
    .attr('font-size', 20)
    .attr('x', plotData.chartWidth / 2)
    .attr('y', 50)
    .style('text-anchor', 'middle')
    .attr('fill', 'black')
    .text('Frequency (Hz)');

  plotData.svg
    .append('g')
    .attr('transform', `translate(${plotData.chartX},${plotData.chartY})`)
    .attr('class', 'axis-label')
    .call(yAxis.tickFormat(d3.format(plotData.yAxisFormat)))
    .append('text')
    .attr('class', 'label')
    .attr('font-size', 20)
    .attr('x', -plotData.chartHeight / 2)
    .attr('y', -50)
    .attr('transform', 'rotate(-90)')
    .attr('fill', 'black')
    .style('text-anchor', 'middle')
    .text(plotData.yAxisName);

  // Major X Axis Gridlines
  plotData.svg
    .append('g')
    .attr('transform', `translate(${plotData.chartX},${plotData.chartY})`)
    .attr('class', 'grid')
    .style('stroke-dasharray', '1,3')
    .style('stroke-opacity', '0.5')
    .call(xAxisMinor.tickSize(plotData.chartHeight).tickFormat(() => ''));

  // Major Y Axis gridlines
  plotData.svg
    .append('g')
    .attr('transform', `translate(${plotData.chartX},${plotData.chartY})`)
    .attr('class', 'grid')
    .style('stroke-dasharray', '1,3')
    .style('stroke-opacity', '0.5')
    .call(
      yAxis
        .ticks(10)
        .tickSize(-plotData.chartWidth)
        .tickFormat(() => '')
    );

  plotData.svg
    .selectAll('.axis-label .tick text')
    .attr('font-size', 16) // Set font size for tick labels
    .style('fill', 'black'); // Optionally, ensure the color is correct

  // Border around chart
  plotData.svg
    .append('rect')
    .attr('x', plotData.chartX)
    .attr('y', plotData.chartY)
    .attr('height', plotData.chartHeight)
    .attr('width', plotData.chartWidth)
    .style('stroke', 'black')
    .style('fill', 'none')
    .style('stroke-width', 2);

  return plotData.svg;
}

export function createLegend(
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  legendData: LegendItemInterface[],
  chartWidth: number,
  legendWidth: number
) {
  // Append the legend group
  const legend = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${chartWidth - legendWidth - 5}, 15)`); // Position legend in the upper-right corner

  // Add a background box for the legend
  legend
    .append('rect')
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
  const legendGroups = legend
    .selectAll('.legend-item')
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
    group.append('text').attr('x', 30).attr('y', 5).style('font-size', '12px').style('fill', 'black').text(legendItem.label);
  });

  function addSymbol(group: d3.Selection<SVGGElement, LegendItemInterface, null, undefined>, legendItem: LegendItemInterface) {
    const size = 5;
    if (legendItem.symbol === 'circle' || legendItem.symbol === 'dot') {
      group
        .append('circle')
        .attr('cx', 10)
        .attr('cy', 0)
        .attr('r', legendItem.symbol === 'dot' ? size - 1 : size)
        .style('fill', legendItem.symbol === 'dot' ? legendItem.color : 'none')
        .style('stroke', legendItem.color)
        .style('stroke-width', 2);
    } else if (legendItem.symbol === 'X') {
      group
        .append('line')
        .attr('x1', -size + 10)
        .attr('y1', -size)
        .attr('x2', size + 10)
        .attr('y2', size)
        .style('stroke', legendItem.color)
        .style('stroke-width', 2);

      group
        .append('line')
        .attr('x1', -size + 10)
        .attr('y1', size)
        .attr('x2', size + 10)
        .attr('y2', -size)
        .style('stroke', legendItem.color)
        .style('stroke-width', 2);
    }
  }

  function addLine(group: d3.Selection<SVGGElement, LegendItemInterface, null, undefined>, legendItem: LegendItemInterface) {
    group
      .append('line')
      .attr('x1', -5)
      .attr('y1', 0)
      .attr('x2', 25)
      .attr('y2', 0)
      .attr('stroke', legendItem.color)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', legendItem.line === 'dashed' ? '5,5' : '0');
  }
}

/**
 * Create a path data string from normative data
 * @summary Create a path data string from normative data
 * @param data The normative data for the area to use
 * @param xScale The scale of the data in the x-direction
 * @param yScale The scale of the data in the y-direction
 * @param yClampMin Optional minimum y value to clamp the data above
 * @param yClampMax Optional maximum y value to clamp the data below
 * @returns Path data string of the area
 */
export function createNormativeDataPath(
  data: NormativeDataInterface[],
  xScale: d3.ScaleContinuousNumeric<number, number, never>,
  yScale: d3.ScaleContinuousNumeric<number, number, never>,
  yClampMin?: number | undefined,
  yClampMax?: number | undefined
): string | null {
  const minAllowableY = yClampMin ?? Number.NEGATIVE_INFINITY;
  const maxAllowableY = yClampMax ?? Number.POSITIVE_INFINITY;

  const pathAreaGenerator = d3
    .area<NormativeDataInterface>()
    .x(d => xScale(d.x))
    .y0(d => yScale(Math.min(Math.max(d.yMin, minAllowableY), maxAllowableY)))
    .y1(d => yScale(Math.min(Math.max(d.yMax, minAllowableY), maxAllowableY)));

  return pathAreaGenerator(data);
}

/**
 * Draw discrete DPOAE amplitude markers (blue open circles) and noise floor markers (red X) at
 * the given x/amplitude/noiseFloor values, with no connecting line between points.
 * @param svg The svg group to draw into
 * @param xScale The x-axis (frequency) scale
 * @param yScale The y-axis (amplitude) scale
 * @param xValues The x-axis value for each point
 * @param amplitudeValues The DPOAE amplitude for each point, index-aligned with xValues
 * @param noiseFloorValues The noise floor for each point, index-aligned with xValues
 */
export function plotOAEPointMarkers(
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  xScale: d3.ScaleLogarithmic<number, number, never>,
  yScale: d3.ScaleLinear<number, number, never>,
  xValues: number[],
  amplitudeValues: number[],
  noiseFloorValues: number[]
) {
  // Plot Amplitude / DPOAE (blue open circles)
  svg
    .selectAll('.dot')
    .data(xValues)
    .enter()
    .append('circle')
    .attr('cx', (d, i) => xScale(xValues[i]))
    .attr('cy', (d, i) => yScale(amplitudeValues[i]))
    .attr('r', 4)
    .style('fill', 'none')
    .style('stroke', 'blue')
    .style('stroke-width', 2);

  // Plot NoiseFloor (red X)
  svg
    .selectAll('.cross')
    .data(xValues)
    .enter()
    .append('text')
    .attr('x', (d, i) => xScale(xValues[i]))
    .attr('y', (d, i) => yScale(noiseFloorValues[i]))
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .style('fill', 'red')
    .style('font-size', '10px')
    .style('font-weight', 'bold')
    .text('X');
}

/**
 * Plot a single OAE series (e.g. F1, F2, DPOAE, noise floor) as a connected line with markers.
 * @param svg The svg group to draw into
 * @param xScale The x-axis (frequency) scale
 * @param yScale The y-axis (amplitude) scale
 * @param xValues The x-axis value for each point
 * @param yValues The y-axis value for each point, index-aligned with xValues
 * @param color The stroke/fill color for the line and markers
 * @param marker The marker shape: 'dot' (small filled circle), 'circle' (open circle), or 'cross' ('X')
 */
export function plotOAELineSeries(
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
  xScale: d3.ScaleLogarithmic<number, number, never>,
  yScale: d3.ScaleLinear<number, number, never>,
  xValues: number[],
  yValues: number[],
  color: string,
  marker: 'dot' | 'circle' | 'cross'
) {
  const lineGenerator = d3
    .line<number>()
    .x((_d, i) => xScale(xValues[i]))
    .y(d => yScale(d));

  svg.append('path').datum(yValues).attr('d', lineGenerator).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2);

  if (marker === 'cross') {
    svg
      .selectAll(null)
      .data(xValues)
      .enter()
      .append('text')
      .attr('x', (_d, i) => xScale(xValues[i]))
      .attr('y', (_d, i) => yScale(yValues[i]))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .style('fill', color)
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text('X');
  } else {
    svg
      .selectAll(null)
      .data(xValues)
      .enter()
      .append('circle')
      .attr('cx', (_d, i) => xScale(xValues[i]))
      .attr('cy', (_d, i) => yScale(yValues[i]))
      .attr('r', marker === 'dot' ? 3 : 4)
      .style('fill', marker === 'dot' ? color : 'none')
      .style('stroke', color)
      .style('stroke-width', 2);
  }
}
