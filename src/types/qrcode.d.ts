declare module 'qrcode' {
  interface QRCodeOptions {
    width?: number;
    height?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: string;
    quality?: number;
    rendererOpts?: {
      quality?: number;
    };
  }

  interface QRCodeToCanvasOptions extends QRCodeOptions {
    version?: number;
    maskPattern?: number;
    toSJISFunc?: (text: string) => number[];
  }

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QRCodeToCanvasOptions
  ): Promise<void>;

  export function toCanvas(
    text: string,
    options?: QRCodeToCanvasOptions
  ): Promise<HTMLCanvasElement>;

  export function toDataURL(
    text: string,
    options?: QRCodeOptions
  ): Promise<string>;

  export function toString(
    text: string,
    options?: QRCodeOptions
  ): Promise<string>;

  export const CorrectLevel: {
    L: number;
    M: number;
    Q: number;
    H: number;
  };
}
