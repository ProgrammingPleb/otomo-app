export type NotificationStatus = "soon" | "now" | "none";

export interface AppVideo {
    title: string;
    video_id: string;
    start_scheduled: number | null;
    start_actual: number | null;
    ended: boolean;
    notification: NotificationStatus;
    channel: AppChannel;
}

export interface AppChannel {
    id: string;
    name: string;
    romaji: string | null;
    profile_picture: string;
    group: string | null;
    major_group: string | null;
    is_inactive: boolean;
    is_group_channel: boolean;
    organization: string;
}
