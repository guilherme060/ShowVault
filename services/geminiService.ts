import { GoogleGenAI, Modality } from "@google/genai";
import { GroundingChunk, Show } from "../types";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Some features may not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const analyzeImageForArtist = async (base64Image: string, mimeType: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        },
                    },
                    { text: 'Analise esta foto de show. Identifique o artista ou banda principal se apresentando. Se visível, identifique também o nome do evento ou local. Responda apenas com o nome do artista ou da banda.' }
                ]
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing image for artist:", error);
        return "Não foi possível analisar a imagem.";
    }
};

export const suggestPlaylist = async (artistName: string) => {
    if (!artistName) return { text: "Por favor, forneça o nome de um artista.", sources: [] };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Encontre uma setlist de show popular ou playlist para o artista "${artistName}". Forneça uma breve descrição e um link.`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text, sources };
    } catch (error) {
        console.error("Error suggesting playlist:", error);
        return { text: "Não foi possível buscar sugestões de playlist.", sources: [] };
    }
};


export const findNearbyVenues = async (lat: number, lon: number) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Liste locais de música e casas de show perto da minha localização atual.`,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: { latitude: lat, longitude: lon }
                    }
                }
            },
        });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text, sources };
    } catch (error) {
        console.error("Error finding nearby venues:", error);
        return { text: "Não foi possível encontrar locais próximos.", sources: [] };
    }
};


export const getDeepDive = async (show: { artist: string; date: string; location: string; }, question: string) => {
    try {
        const prompt = `Sobre o show de ${show.artist} em ${show.location} na data de ${show.date}, por favor, responda a seguinte pergunta complexa: ${question}. Forneça uma análise detalhada, considerando a trajetória da carreira do artista na época, o contexto cultural e a importância do evento.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting deep dive:", error);
        return "Falha ao obter uma análise aprofundada.";
    }
};

export const analyzeVideoFrame = async (base64Image: string, mimeType: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: {
                parts: [
                     {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        },
                    },
                    { text: 'Este é um frame de um vídeo de show. Com base nesta imagem, descreva a energia, o clima e os potenciais momentos-chave da performance em um parágrafo curto.' }
                ]
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing video frame:", error);
        return "Não foi possível analisar o frame do vídeo.";
    }
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart && imagePart.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        throw new Error("Nenhum dado de imagem na resposta");

    } catch (error) {
        console.error("Error editing image:", error);
        return null;
    }
};

export const generatePoster = async (prompt: string, aspectRatio: string) => {
    try {
        // Step 1: Use Gemini Flash with Google Search to create a detailed, visually rich prompt for Imagen.
        const infoResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Com base em informações reais da web, gere um prompt detalhado e visualmente descritivo para um gerador de imagens de IA. O objetivo é criar um pôster de show para o artista/banda: "${prompt}". O prompt deve incluir palavras-chave sobre seu gênero, estilo visual, presença de palco típica e estética. Torne-o específico o suficiente para gerar uma imagem precisa e representativa do artista. Por exemplo, para 'Billie Eilish', um bom prompt poderia ser: "Um pôster de show para Billie Eilish, com uma estética sombria, melancólica e levemente surreal. Destaque suas roupas largas características, detalhes em verde neon e um fundo etéreo e onírico."`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        let detailedPrompt = infoResponse.text.trim();
        console.log(`Generated detailed prompt: "${detailedPrompt}"`); 

        if (!detailedPrompt) {
            console.warn("Detailed prompt generation resulted in an empty string. Using a fallback prompt.");
            detailedPrompt = `Um pôster de show dinâmico e visualmente atraente para o artista/banda: "${prompt}"`;
        }
        
        // --- Attempt 1: Imagen with detailed prompt ---
        try {
            console.log("Attempting image generation with Imagen (detailed prompt)...");
            const imageResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: detailedPrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: aspectRatio },
            });
            const image = imageResponse.generatedImages?.[0]?.image;
            if (image?.imageBytes) {
                console.log("Success with Imagen (detailed prompt).");
                return `data:image/jpeg;base64,${image.imageBytes}`;
            }
        } catch (e) {
            console.warn("Imagen generation with detailed prompt failed:", e);
        }

        // --- Attempt 2: Imagen with simple prompt ---
        const fallbackPrompt = `Um pôster de show para: "${prompt}"`;
        try {
            console.warn("Retrying with Imagen (simple prompt)...");
            const imageResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fallbackPrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: aspectRatio },
            });
            const image = imageResponse.generatedImages?.[0]?.image;
            if (image?.imageBytes) {
                 console.log("Success with Imagen (simple prompt).");
                return `data:image/jpeg;base64,${image.imageBytes}`;
            }
        } catch (e) {
            console.warn("Imagen generation with simple prompt failed:", e);
        }

        // --- Attempt 3: Gemini Flash Image with simple prompt ---
        try {
            console.warn("Retrying with Gemini Flash Image...");
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: fallbackPrompt }] },
              config: { responseModalities: [Modality.IMAGE] },
            });
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart?.inlineData?.data) {
                console.log("Success with Gemini Flash Image.");
                return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            }
        } catch(e) {
            console.warn("Gemini Flash Image generation failed:", e);
        }

        // If all attempts fail, throw an error.
        throw new Error("Falha ao gerar dados de imagem mesmo após o fallback.");

    } catch (error) {
        console.error("Error generating poster:", error);
        return null;
    }
};

export const analyzePhotoDetails = async (base64Image: string, mimeType: string): Promise<{text: string; sources: GroundingChunk[]}> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        },
                    },
                    { text: `Analise esta imagem em detalhes. Primeiro, determine seu contexto (ex: show, evento público, retrato, selfie).
- Se for um show ou evento ao vivo, identifique o artista/banda e o local, se possível. Descreva a atmosfera do evento.
- Se for uma pessoa famosa, identifique-a, forneça uma breve biografia e alguns fatos recentes interessantes.
- Se o contexto ou a pessoa não estiverem claros, descreva o conteúdo e os elementos visuais da imagem.
Use a Pesquisa Google para obter as informações mais atuais. Forneça uma resposta abrangente.` }
                ]
            },
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { text: response.text, sources };
    } catch (error) {
        console.error("Error analyzing photo details:", error);
        return { text: "Não foi possível analisar a foto.", sources: [] };
    }
};

export const transcribeAudio = async (audioFile: File): Promise<string> => {
    try {
        const base64Audio = await fileToBase64(audioFile);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Audio,
                            mimeType: audioFile.type,
                        },
                    },
                    { text: 'Transcreva este arquivo de áudio com precisão.' }
                ]
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return "Não foi possível transcrever o áudio.";
    }
};