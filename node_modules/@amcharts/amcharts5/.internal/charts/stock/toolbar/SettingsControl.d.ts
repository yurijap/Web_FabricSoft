import type { IDropdownListItem } from "./DropdownList";
import { DropdownListControl, IDropdownListControlSettings, IDropdownListControlPrivate, IDropdownListControlEvents } from "./DropdownListControl";
import { DataSaveControl } from "./DataSaveControl";
export interface ISettingsControlItem extends IDropdownListItem {
}
export interface ISettingsControlSettings extends IDropdownListControlSettings {
    /**
     * If set to `true`, all changes to chart's drawings and indicators will be
     * automatically saved to browser local storage and restored on next load.
     *
     * @default false
     *
     * @since 5.4.3
     */
    autoSave?: boolean;
    /**
     * A unique indentifier for local storage.
     *
     * Will try to use chart's container ID if not set.
     *
     * Consider setting it if you have multipl [[StockChart]] on the same page.
     *
     * @since 5.4.3
     */
    storageId?: string;
}
export interface ISettingsControlPrivate extends IDropdownListControlPrivate {
    dataSaveControl?: DataSaveControl;
}
export interface ISettingsControlEvents extends IDropdownListControlEvents {
}
/**
 * A control that is used to change type of the main series of the [[StockChart]].
 */
export declare class SettingsControl extends DropdownListControl {
    static className: string;
    static classNames: Array<string>;
    _settings: ISettingsControlSettings;
    _privateSettings: ISettingsControlPrivate;
    _events: ISettingsControlEvents;
    protected _afterNew(): void;
    protected _getDefaultIcon(): SVGElement;
    protected _populateInputs(): void;
    protected _getFillEnabled(): boolean;
    protected _getYScale(): "percent" | "regular" | "logarithmic";
    protected _setLogarithmic(value: boolean): void;
    protected _setFills(enabled: boolean): void;
}
//# sourceMappingURL=SettingsControl.d.ts.map