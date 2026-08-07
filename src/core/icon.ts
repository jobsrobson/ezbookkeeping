export type LineAwesomeIconClassName = string;

export interface IconInfo extends Record<string, unknown> {
    readonly icon: LineAwesomeIconClassName;
    readonly assetUrl?: string;
    readonly brandColor?: string;
    readonly name?: string;
}

export interface IconInfoWithId extends IconInfo {
    readonly id: string;
    readonly icon: LineAwesomeIconClassName;
}
