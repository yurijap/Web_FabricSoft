import type { MapChart } from "./MapChart";
import { ZoomTools, IZoomToolsPrivate, IZoomToolsSettings } from "../../core/render/ZoomTools";
export interface IZoomControlSettings extends IZoomToolsSettings {
}
export interface IZoomControlPrivate extends IZoomToolsPrivate {
    /**
     * @ignore
     */
    chart?: MapChart;
}
/**
 * A control that displays button for zooming [[MapChart]] in and out.
 *
 * @see {@link https://www.amcharts.com/docs/v5/charts/map-chart/map-pan-zoom/#Zoom_control} for more information
 * @important
 */
export declare class ZoomControl extends ZoomTools {
    static className: string;
    static classNames: Array<string>;
    _settings: IZoomControlSettings;
    _privateSettings: IZoomControlPrivate;
    protected _afterNew(): void;
    _prepareChildren(): void;
}
//# sourceMappingURL=ZoomControl.d.ts.map