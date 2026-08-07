import { AfterViewInit, Directive, Input } from '@angular/core';
import * as d3 from 'd3';
import { NormativeDataInterface } from '../../../../../interfaces/normative-data-interface';
import { DpoaeResultsCommonInterface } from './dpoae-common.interface';

/**
 * Shared base for the final "results" view of a DPOAE-family response area. Owns the common
 * @Input plumbing and the ngAfterViewInit hook; subclasses supply createResultsPlot() since the
 * plotted data shape and drawing style (continuous curve vs. discrete points) differs.
 */
@Directive()
export abstract class DpoaeResultsBaseComponent<TResults extends DpoaeResultsCommonInterface> implements AfterViewInit {
  @Input() results!: TResults;
  @Input() width!: number;
  @Input() height!: number;
  @Input() margin!: { top: number; right: number; bottom: number; left: number };
  @Input() normativeData!: NormativeDataInterface[];

  svg: d3.Selection<SVGGElement, unknown, HTMLElement, any> | undefined;

  ngAfterViewInit(): void {
    this.svg = this.createResultsPlot();
  }

  protected abstract createResultsPlot(): d3.Selection<SVGGElement, unknown, HTMLElement, any>;
}
