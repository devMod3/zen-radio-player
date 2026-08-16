export type StreamType = "HLS" | "MP3" | "AAC" | "STREAM" | "UNKNOWN";
export type PlaybackState = "EMPTY" | "LOADING" | "PLAYING" | "PAUSED" | "BUFFERING" | "ERROR";

export interface Station {
  id: string;
  name: string;
  streamUrl: string;
  type: StreamType;
}

export interface Diagnostic {
  entry: string;
  status: "VALID" | "WARNING" | "INVALID";
  message: string;
}

export interface ParsedPlaylist {
  stations: Station[];
  diagnostics: Diagnostic[];
}
