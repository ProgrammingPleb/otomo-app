import { AppChannel, AppVideo } from "@/model/app";
import { isRefreshPossible, updateLastCheckedTime } from "./db";

const STREAMS_BUFFER_NAME = "streams";
const CHANNELS_BUFFER_NAME = "channels";
const STREAMS_BACKEND_BUFFER_MINUTES = 5;
const CHANNELS_BUFFER_HOURS = 4;

/**
 * Fetches data from the backend endpoint.  
 * Returns `T` if data is received, `undefined` if it has errored out or no data was received.
 * @param endpoint The V1 API endpoint, starting with `/`.
 * @returns Returned data from the endpoint.
 */
async function fetchBackendData<T = unknown>(endpoint: string) {
    const resp = await fetch(`https://otomo.pleb.moe/api/v1${endpoint}`);

    if (resp.ok) {
        return await resp.json() as T;
    } else {
        return;
    }
}

/**
 * Fetches all upcoming and current live streams. Does not contain streams that have already ended.
 * @returns All upcoming and current live streams. `undefined` if checked too recently (within 15 minutes).
 */
export async function getLatestVideos(): Promise<AppVideo[] | undefined> {
    if (!await isRefreshPossible(STREAMS_BUFFER_NAME)) {
        return;
    }

    const backendData = await fetchBackendData<AppVideo[]>("/streams");
    await updateLastCheckedTime(STREAMS_BUFFER_NAME, STREAMS_BACKEND_BUFFER_MINUTES / 60);

    return backendData;
}

/**
 * Fetches all channels in the organization. Gets through the channel list from the endpoint 50 at a time.
 * @returns All channels. `undefined` if checked too recently (within 4 hours).
 */
export async function getLatestChannels() {
    if (!await isRefreshPossible(CHANNELS_BUFFER_NAME)) {
        return;
    }

    const channels = await fetchBackendData<AppChannel[]>("/channels");

    await updateLastCheckedTime(CHANNELS_BUFFER_NAME, CHANNELS_BUFFER_HOURS);
    return channels;
}

/**
 * Fetches one channel based on their 
 * @returns The channel's data. `undefined` if not found.
 */
export async function getOneChannel(channelId: string) {
    if (!await isRefreshPossible(CHANNELS_BUFFER_NAME)) {
        return;
    }

    const channels = await fetchBackendData<AppChannel>(`/channels/${channelId}`);

    return channels;
}
