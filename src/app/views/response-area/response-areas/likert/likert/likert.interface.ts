import { CommonResponseAreaInterface } from '../../../../../interfaces/page-definition.interface';

/** A single label pinned to one level, optionally above or below the scale. */
export interface LikertSpecifier {
  level: number;
  label: string;
  position?: 'above' | 'below';
}

/**
 * A per-question override. Any field left out falls back to the response-area
 * level value. `text` is the question prompt and may contain HTML.
 */
export interface LikertQuestion {
  text?: string;
  levels?: number;
  labels?: string[];
  specifiers?: LikertSpecifier[];
  position?: 'above' | 'below';
  centerLabelAbove?: string;
  centerLabelBelow?: string;
  labelFontSize?: number;
  questionFontSize?: number;
  useEmoticons?: boolean;
}

export interface LikertInterface extends CommonResponseAreaInterface {
  type: 'likertResponseArea';
  useEmoticons?: boolean;
  useRadioButtons?: boolean;
  levels?: number;
  labels?: string[];
  specifiers?: LikertSpecifier[];
  position?: 'above' | 'below';
  centerLabelAbove?: string;
  centerLabelBelow?: string;
  labelFontSize?: number;
  questionFontSize?: number;
  questions?: (string | LikertQuestion)[];
  useSlider?: boolean;
  naBox?: boolean;
  autoSubmit?: boolean;
}
