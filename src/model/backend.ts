export interface BackendVideo {
    title: string;
    video_id: string;
    thumbhash: string;
    start_scheduled: number | null;
    start_actual: number | null;
    end_actual: number | null;
    published_at: number;
}

export interface BackendChannelRecents {
    videos: BackendVideo[];
    streams: BackendVideo[];
    shorts: BackendVideo[];
}
