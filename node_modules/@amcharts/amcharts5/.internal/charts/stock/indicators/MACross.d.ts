import { Indicator, IIndicatorSettings, IIndicatorPrivate, IIndicatorEvents, IIndicatorEditableSetting } from "./Indicator";
import { LineSeries } from "../../xy/series/LineSeries";
import type { Color } from "../../../core/util/Color";
export interface IMACrossSettings extends IIndicatorSettings {
    /**
     * A value for "fast" period.
     */
    fastPeriod?: number;
    fastColor?: Color;
}
export interface IMACrossPrivate extends IIndicatorPrivate {
}
export interface IMACrossEvents extends IIndicatorEvents {
}
/**
 * An implementation of a [[StockChart]] indicator.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/indicators/} for more info
 */
export declare class MACross extends Indicator {
    static className: string;
    static classNames: Array<string>;
    _settings: IMACrossSettings;
    _privateSettings: IMACrossPrivate;
    _events: IMACrossEvents;
    /**
     * Indicator series.
     */
    series: LineSeries;
    /**
     * Indicator series.
     */
    fastSeries: LineSeries;
    _editableSettings: IIndicatorEditableSetting[];
    _prepareChildren(): void;
    protected _dispose(): void;
    protected _afterNew(): void;
    /**
     * @ignore
     */
    prepareData(): void;
}
//# sourceMappingURL=MACross.d.ts.map