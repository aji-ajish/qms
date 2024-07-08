type SeriesSize = 'sm' | 'md' | 'lg';

export interface ColorValuePair {
  color: string;
  value: number;
}

export interface SimpleOptions {
  [x: string]: any;
  type: string;
  text: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
  XYZurl?: string;
  dataKey?: string;
  unit?: any;
  header?: string | undefined;
  zoomBoolean: boolean;
  zoomInd?: number;
  dataUnits?: Record<string, string>;
  colorPairs: ColorValuePair[];
  defColor?: any;
  pinText?: string;
}
