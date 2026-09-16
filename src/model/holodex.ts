export interface HolodexVideo {
    id: string;
    title: string;
    type: "stream" | "clip";
    topic_id: string | null;
    published_at: string | null;
    available_at: string;
    duration: number;
    status: "new" | "upcoming" | "live" | "past" | "missing";
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