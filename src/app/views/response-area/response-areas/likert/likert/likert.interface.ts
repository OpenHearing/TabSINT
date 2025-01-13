import { CommonResponseAreaInterface } from "../../../../../interfaces/page-definition.interface";

export interface LikertInterface extends CommonResponseAreaInterface {
    type: "likertResponseArea";
    useEmoticons?: boolean;
    levels?: number;
    labels?: string[];
    position?: "above" | "below";
    questions?: string[];
    useSlider?: boolean;
    naBox?: boolean;
  }
  