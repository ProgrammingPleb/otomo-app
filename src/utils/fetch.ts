import { AppChannel, AppVideo } from "@/model/app";
import { HolodexGeneralQuery, HolodexLiveEndpointOptions, HolodexVideo } from "@/model/holodex";
import { getChannelData, getSettings, isRefreshPossible, updateLastCheckedTime, updateOneChannel } from "./db";

const STREAMS_BUFFER_NAME = "streams";
const CHANNELS_BUFFER_NAME = "channels";
const STREAMS_HOLODEX_BUFFER_HOURS = 0.25;
const STREAMS_BACKEND_BUFFER_HOURS = 0.08;
const CHANNELS_BUFFER_HOURS = 4;

/**
 * Fetches data from the Holodex endpoint.  
 * Returns `T` if data is received, `undefined` if it has errored out or no data was received.
 * @param endpoint The V2 API endpoint, starting with `/`.
 * @returns Returned data from the endpoint.
 */
async function fetchHolodexData<T = unknown>(endpoint: string, options?: HolodexGeneralQuery) {
    const apiKey = (await getSettings()).apiKey;
    if (apiKey == "") {
        return;
    }

    const fetchOptions = Object.entries(options ?? {
        org: "Nijisanji"
    } as HolodexGeneralQuery);
    const urlOptions = [];
    for (const option of fetchOptions) {
        if (Array.isArray(option[1])) {
            urlOptions.push(`${option[0]}=${option[1].join(",")}`);
        } else if (option[0] === "limit") {
            urlOptions.push(`${option[0]}=${option[1] as number > 50 ? 50 : option[1]}`);
        } else {
            urlOptions.push(`${option[0]}=${option[1]}`);
        }
    }

    const resp = await fetch(`https://holodex.net/api/v2${endpoint}${urlOptions.length > 0 ? `?${urlOptions.join("&")}` : ""}`, {
        headers: {
            "X-APIKEY": apiKey
        }
    });

    if (resp.ok) {
        return await resp.json() as T;
    } else {
        return;
    }
}

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

    const data = await fetchHolodexData<HolodexVideo[]>("/live", {
        org: "Nijisanji",
        status: ["live", "upcoming"]
    } as HolodexLiveEndpointOptions);

    if (data) {
        const streams = [];

        for (const row of data) {
            let channelData = await getChannelData(row.channel.id);
            if (!channelData) {
                channelData = await getOneChannel(row.channel.id);
                if (!channelData) {
                    continue;   // TODO: Implement better fallback methods
                }
                await updateOneChannel(channelData);
            }

            streams.push({
                video_id: row.id,
                title: row.title,
                time: row.start_actual != null ?
                    new Date(row.start_actual).getTime() :
                    new Date(row.start_scheduled ?? 0).getTime(),
                channel: channelData,
                ended: false,
            });
        }

        await updateLastCheckedTime(STREAMS_BUFFER_NAME, STREAMS_HOLODEX_BUFFER_HOURS);
        return streams;
    }

    const backendData = await fetchBackendData<AppVideo[]>("/streams");
    await updateLastCheckedTime(STREAMS_BUFFER_NAME, STREAMS_BACKEND_BUFFER_HOURS);

    return backendData ?? [];
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
