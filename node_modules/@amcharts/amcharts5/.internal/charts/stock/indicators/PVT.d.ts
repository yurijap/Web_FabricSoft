import type { IIndicatorEditableSetting } from "./Indicator";
import type { XYSeries } from "../../xy/series/XYSeries";
import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";
export interface IPVTSettings extends IChartIndicatorSettings {
    /**
     * Chart's main volume series.
     */
    volumeSeries: XYSeries;
}
export interface IPVTPrivate extends IChartIndicatorPrivate {
}
export interface IPVTEvents extends IChartIndicatorEvents {
}
/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export declare class PVT extends ChartIndicator {
    static className: string;
    static classNames: Array<string>;
    _settings: IPVTSettings;
    _privateSettings: IPVTPrivate;
    _events: IPVTEvents;
    /**
     * Indicator series.
     */
    series: LineSeries;
    _editableSettings: IIndicatorEditableSetting[];
    _afterNew(): void;
    _createSeries(): LineSeries;
    /**
     * @ignore
     */
    prepareData(): void;
}
//# sourceMappingURL=PVT.d.ts.map