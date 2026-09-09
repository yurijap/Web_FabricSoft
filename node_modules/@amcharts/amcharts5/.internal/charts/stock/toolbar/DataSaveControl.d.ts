import type { IDropdownListItem } from "./DropdownList";
import { DropdownListControl, IDropdownListControlSettings, IDropdownListControlPrivate, IDropdownListControlEvents } from "./DropdownListControl";
import { DrawingControl } from "./DrawingControl";
import { IndicatorControl } from "./IndicatorControl";
export interface IDataSaveControlItem extends IDropdownListItem {
}
export interface IDataSaveControlSettings extends IDropdownListControlSettings {
    /**
     * If set to `true`, all changes to chart's drawings and indicators will be
     * automatically saved to browser local storage and restored on next load.
     *
     * @default false
     */
    autoSave?: boolean;
    /**
     * A unique indentifier for local storage.
     *
     * Will try to use chart's container ID if not set.
     *
     * Consider setting it if you have multipl [[StockChart]] on the same page.
     */
    storageId?: string;
}
export interface IDataSaveControlPrivate extends IDropdownListControlPrivate {
    drawingControl?: DrawingControl;
    indicatorControl?: IndicatorControl;
    storageId?: string;
}
export interface IDataSaveControlEvents extends IDropdownListControlEvents {
    /**
     * Invoked when drawing/indicator data is serialized and saved to local
     * storage.
     */
    saved: {
        drawings: string;
        indicators: string;
    };
    /**
     * Invoked when drawing/indicator data is loaded from local storage and
     * restored on chart.
     */
    restored: {
        drawings: string;
        indicators: string;
    };
    /**
     * Invoked when local storage is cleared.
     */
    cleared: {};
}
/**
 * A control that can be used to serialize indicators and drawings, save them
 * to local storage, and restore as needed.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/stock/toolbar/data-save-control/} for more info
 * @since 5.7.0
 */
export declare class DataSaveControl extends DropdownListControl {
    static className: string;
    static classNames: Array<string>;
    _settings: IDataSaveControlSettings;
    _privateSettings: IDataSaveControlPrivate;
    _events: IDataSaveControlEvents;
    protected _afterNew(): void;
    _beforeChanged(): void;
    saveData(): void;
    restoreData(): void;
    clearData(): void;
    protected _getDefaultIcon(): SVGElement;
    protected _populateInputs(): void;
    protected _getStorageId(bucket: string): string;
    protected _getDrawingControl(): DrawingControl;
    protected _getIndicatorControl(): IndicatorControl;
}
//# sourceMappingURL=DataSaveControl.d.ts.map