import { Component, Input } from '@angular/core';

/**
 * Structural, type-agnostic rendering of a stored response for any response-area type that has
 * no dedicated results viewer: primitives as text, arrays as lists, objects as key/value tables -
 * recursing into nested arrays/objects. Used as the results-view dispatcher's fallback so no
 * response-area type is ever silently omitted.
 */
@Component({
  selector: 'app-generic-result-viewer',
  templateUrl: './generic-result-viewer.component.html',
  styleUrl: './generic-result-viewer.component.css',
})
export class GenericResultViewerComponent {
  @Input() response: unknown;

  get kind(): 'array' | 'object' | 'value' {
    if (Array.isArray(this.response)) {
      return 'array';
    }
    if (typeof this.response === 'object' && this.response !== null) {
      return 'object';
    }
    return 'value';
  }

  get asArray(): unknown[] {
    return this.response as unknown[];
  }

  get entries(): [string, unknown][] {
    return Object.entries(this.response as Record<string, unknown>);
  }
}
