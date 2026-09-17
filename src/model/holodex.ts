type HolodexVideoType = "stream" | "clip";
type HolodexVideoStatus = "new" | "upcoming" | "live" | "past" | "missing";
type HolodexQueryIncludes = "clips" | "refers" | "sources" | "simulcasts" | "mentions" | "description" | "live_info" | "channel_stats" | "songs";
type HolodexChannelType = "subber" | "vtuber";

interface HolodexGeneralQueryShape {
    type: unknown;
    offset: number;
    limit: number;
    org: string;
    lang: string;
    sort: string;
    order: string;
}

export type HolodexGeneralQuery = Partial<HolodexGeneralQueryShape>;

interface HolodexLiveEndpointOptionsShape extends HolodexGeneralQuery {
    type: HolodexVideoType;
    channel: string;
    status: HolodexVideoStatus[];
    topic: string;
    include: HolodexQueryIncludes[];
    mentioned_channel_id: string;
    paginated: string;
    max_upcoming_hours: number;
    id: string;
}

export type HolodexLiveEndpointOptions = Partial<HolodexLiveEndpointOptionsShape>;

interface HolodexChannelsEndpointOptionsShape extends HolodexGeneralQuery {
    type: HolodexChannelType;
}

export type HolodexChannelsEndpointOptions = Partial<HolodexChannelsEndpointOptionsShape>;

export interface HolodexVideo {
    id: string;
    title: string;
    type: HolodexVideoType;
    topic_id: string | null;
    published_at: string | null;
    available_at: string;
    duration: number;
    status: HolodexVideoStatus;
    start_scheduled: string | null;
    start_actual: string | null;
    end_actual: string | null;
    live_viewers: number | null;
    description: string;
    songcount: number;
    channel: {
        id: string;
        name: string;
        english_name: string;
        photo: string;
        org: string;
        suborg: string;
        type: string;
    };
}

export interface HolodexChannel {
    id: string;
    name: string;
    english_name: string | null;
    type: HolodexChannelType;
    org: string | null;
    group: string | null;
    photo: string | null;
    banner: string | null;
    twitter: string | null;
    video_count: string | null;
    subscriber_count: number | null;
    view_count: string | null;
    clip_count: string | null;
    lang: string | null;
    published_at: string;
    inactive: boolean;
    description: string;
}
