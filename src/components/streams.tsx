import { Image } from "@/components/image";
import { useState } from "react";

interface ThumbnailImageProps {
    videoId: string;
}

export function ThumbnailImage({ videoId }: ThumbnailImageProps) {
    const [thumbnailType, setThumbnailType] = useState("maxresdefault");

    return (
        <Image
            className="flex-1"
            source={`https://img.youtube.com/vi/${videoId}/${thumbnailType}.jpg`}
            contentFit="cover"
            onError={() => setThumbnailType("hqdefault")}    // Fallback to hqdefault (since it's a confirmed quality) on failure
        />
    );
}
