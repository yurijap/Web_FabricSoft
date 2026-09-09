import type { IIndicatorEditableSetting } from "./Indicator";
import { ChartIndicator, IChartIndicatorSettings, IChartIndicatorPrivate, IChartIndicatorEvents } from "./ChartIndicator";
import { LineSeries } from "../../xy/series/LineSeries";
export interface IBullBearPowerSettings extends IChartIndicatorSettings {
}
export interface IBullBearPowerPrivate extends IChartIndicatorPrivate {
}
export interface IBullBearPowerEvents extends IChartIndicatorEvents {
}
/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export declare class BullBearPower extends ChartIndicator {
    static className: string;
    static classNames: Array<string>;
    _settings: IBullBearPowerSettings;
    _privateSettings: IBullBearPowerPrivate;
    _events: IBullBearPowerEvents;
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
//# sourceMappingURL=BullBearPower.d.ts.map