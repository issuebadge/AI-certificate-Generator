
export interface BaseElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  letterSpacing: number; // in px
  lineHeight: number; // multiplier e.g., 1.5
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
}

export interface ShapeElement extends BaseElement {
    type: 'shape';
    shapeType: 'line';
    stroke: string;
    strokeWidth: number;
}

export type Element = TextElement | ImageElement | ShapeElement;

export interface CertificateElement {
    backgroundColor: string;
    borderColor: string;
    elements: Element[];
}
