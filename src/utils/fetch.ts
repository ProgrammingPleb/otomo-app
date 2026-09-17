import { HolodexChannel, HolodexChannelsEndpointOptions, HolodexGeneralQuery, HolodexLiveEndpointOptions, HolodexVideo } from "@/model/holodex";
import { getSettings } from "./db";

/**
 * Fetches data from the Holodex endpoint.  
 * Returns `T` if data is received, `undefined` if it has errored out or no data was received.
 * @param endpoint The V2 API endpoint, starting with `/`.
 * @returns Returned data from the endpoint.
 */
async function fetchData<T = unknown>(endpoint: string, options?: HolodexGeneralQuery) {
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
 * Fetches all upcoming and current live streams. Does not contain streams that have already ended.
 * @returns All upcoming and current live streams.
 */
export async function getLatestVideos() {
    const data = await fetchData<HolodexVideo[]>("/live", {
        org: "Nijisanji",
        status: ["live", "upcoming"]
    } as HolodexLiveEndpointOptions);

    return data ?? [];
}

/**
 * Fetches all channels in the organization. Gets through the channel list from the endpoint 50 at a time.
 * @returns All channels.
 */
export async function getLatestChannels() {
    const channels: HolodexChannel[] = [];

    let offset = 0;
    while (true) {
        const resp = await fetchData<HolodexChannel[]>("/channels", {
            org: "Nijisanji",
            limit: 50,
            offset: offset,
            type: "vtuber"
        } as HolodexChannelsEndpointOptions);
        offset += 50;

        if (resp !== undefined) {
            channels.push(...resp);
        }
        if (resp === undefined || resp.length < 50) {
            break;
        }
    }

    return channels;
}
