export enum Vibe {
  ENERGETIC = 'Energético',
  NOSTALGIC = 'Nostálgico',
  INTIMATE = 'Intimista',
  EUPHORIC = 'Eufórico',
  CHILL = 'Relaxante',
}

export interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
  file?: File; // File is only present before saving, not after loading from storage.
}

export interface Show {
  id: string;
  artist: string;
  date: string;
  location: string;
  vibe: Vibe;
  media: Media[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets: {
            uri: string;
            title: string;
            text: string;
        }[];
    }[]
  };
}