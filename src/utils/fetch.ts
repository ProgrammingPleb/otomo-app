import { HolodexVideo } from "@/model/holodex";
import { getSettings } from "./db";

export async function getLatestVideos() {
    const apiKey = (await getSettings()).apiKey;
    if (apiKey == "") {
        return [];
    }

    const resp = await fetch("https://holodex.net/api/v2/live?org=Nijisanji", {
        headers: {
            "X-APIKEY": apiKey
        }
    });

    if (resp.ok) {
        return await resp.json() as HolodexVideo[];
    } else {
        return [];
    }
}
