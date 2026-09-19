export interface AppVideo {
    title: string;
    video_id: string;
    time: number;
    ended: boolean;
    channel: AppChannel;
}

export interface AppChannel {
    id: string,
    name: string,
    romaji: string | null,
    profile_picture: string,
    group: string | null,
    is_inactive: boolean,
    is_group_channel: boolean,
    organization: string
}
