export interface BackendChannel {
    id: string,
    name: string,
    romaji: string | null,
    profile_picture: string,
    group: string | null,
    is_inactive: boolean,
    is_group_channel: boolean,
    organization: string
}