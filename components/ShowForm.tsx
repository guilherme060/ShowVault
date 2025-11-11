import React, { useState, useCallback } from 'react';
import { Show, Vibe, Media } from '../types';
import * as geminiService from '../services/geminiService';
import { LocationMarkerIcon, CloseIcon } from './icons';

interface ShowFormProps {
  addShow: (show: Omit<Show, 'id'>) => void;
  setCurrentView: (view: 'timeline' | 'random' | 'add' | 'album' | 'ai') => void;
}

const ShowForm: React.FC<ShowFormProps> = ({ addShow, setCurrentView }) => {
  const [artist, setArtist] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [vibe, setVibe] = useState<Vibe>(Vibe.ENERGETIC);
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<{text: string, sources: any[]}|null>(null);
  const [playlistSuggestion, setPlaylistSuggestion] = useState<{text: string, sources: any[]}|null>(null);
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsLoading(true);
      setAiSuggestion('Analisando mídia...');
      const files = Array.from(e.target.files);
      // FIX: Explicitly type `file` as `File` to resolve type errors where it was being inferred as `unknown`.
      const newMedia: Media[] = files.map((file: File) => ({
        id: crypto.randomUUID(),
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: URL.createObjectURL(file),
        file,
      }));
      setMediaFiles(prev => [...prev, ...newMedia]);

      // Analyze first image for artist
      const firstImage = newMedia.find(m => m.type === 'image');
      if (firstImage) {
        try {
          const base64 = await geminiService.fileToBase64(firstImage.file);
          const detectedArtist = await geminiService.analyzeImageForArtist(base64, firstImage.file.type);
          if (detectedArtist && !detectedArtist.toLowerCase().includes("could not")) {
            setArtist(detectedArtist);
            setAiSuggestion(`Artista detectado: ${detectedArtist}`);
          } else {
             setAiSuggestion('Não foi possível detectar o artista na imagem.');
          }
        } catch (error) {
           setAiSuggestion('Erro ao analisar a imagem.');
        }
      } else {
        setAiSuggestion('');
      }
      setIsLoading(false);
    }
  };

  const handleRemoveMedia = (idToRemove: string) => {
    setMediaFiles(prev => prev.filter(media => media.id !== idToRemove));
  };
  
  const handleGetLocation = () => {
    if (navigator.geolocation) {
        setIsLoading(true);
        setLocationSuggestions({text: 'Buscando locais próximos...', sources: []});
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const venues = await geminiService.findNearbyVenues(latitude, longitude);
            setLocationSuggestions(venues);
            setIsLoading(false);
        }, (error) => {
            console.error("Geolocation error:", error);
            setLocationSuggestions({text: 'Não foi possível obter a localização. Por favor, ative as permissões.', sources: []});
            setIsLoading(false);
        });
    } else {
        setLocationSuggestions({text: "Geolocalização não é suportada neste navegador.", sources: []});
    }
  }
  
  const handleSuggestPlaylist = async () => {
      if(!artist) return;
      setIsLoading(true);
      setPlaylistSuggestion({text: "Encontrando uma playlist...", sources: []});
      const suggestion = await geminiService.suggestPlaylist(artist);
      setPlaylistSuggestion(suggestion);
      setIsLoading(false);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist || !date || !location || mediaFiles.length === 0) {
      alert('Por favor, preencha todos os campos e envie pelo menos um arquivo.');
      return;
    }
    addShow({ artist, date, location, vibe, media: mediaFiles });
    setCurrentView('timeline');
  };

  return (
    <div className="p-4 space-y-6 text-gray-200">
       {previewMedia && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div className="relative bg-gray-900 p-2 border border-purple-700 rounded-xl max-w-3xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewMedia(null)} 
              className="absolute -top-4 -right-4 bg-white text-black rounded-full p-1 z-10 shadow-lg"
            >
              <CloseIcon />
            </button>
            {previewMedia.type === 'image' ? (
              <img src={previewMedia.url} alt="Prévia de mídia em tamanho real" className="max-w-full max-h-[85vh] rounded-lg mx-auto" />
            ) : (
              <video src={previewMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg mx-auto" />
            )}
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold text-center text-purple-400">Adicionar Nova Memória</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label htmlFor="media" className="block text-sm font-medium text-gray-400 mb-2">Fotos & Vídeos</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-600 rounded-md hover:border-purple-500 transition-colors">
            <div className="space-y-1 text-center">
               <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="flex text-sm text-gray-500">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-purple-500">
                  <span>Enviar arquivos</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*,video/*" onChange={handleFileChange} />
                </label>
                <p className="pl-1">ou arraste e solte</p>
              </div>
              <p className="text-xs text-gray-600">PNG, JPG, GIF, MP4, MOV até 50MB</p>
            </div>
          </div>
          {mediaFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {mediaFiles.map(media => (
                <div key={media.id} className="relative group aspect-square">
                  <button type="button" onClick={() => setPreviewMedia(media)} className="w-full h-full rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {media.type === 'image' ? (
                      <img src={media.url} alt="Prévia de mídia" className="object-cover h-full w-full" />
                    ) : (
                       <div className="relative w-full h-full">
                          <video src={media.url} className="object-cover h-full w-full" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                          </div>
                      </div>
                    )}
                  </button>
                  <button type="button" onClick={() => handleRemoveMedia(media.id)} className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <CloseIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="artist" className="block text-sm font-medium text-gray-400">Artista</label>
          <input type="text" id="artist" value={artist} onChange={e => setArtist(e.target.value)} required className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2" />
          {aiSuggestion && <p className="text-xs text-blue-400 mt-1">{aiSuggestion}</p>}
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-400">Data</label>
          <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2" />
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-400">Local / Casa de Show</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} required className="block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2" />
            <button type="button" onClick={handleGetLocation} className="p-2 bg-purple-600 rounded-md hover:bg-purple-700"><LocationMarkerIcon /></button>
          </div>
           {locationSuggestions && (
            <div className="mt-2 p-2 bg-gray-800 rounded-md text-sm">
                <p className="whitespace-pre-wrap">{locationSuggestions.text}</p>
                {locationSuggestions.sources.length > 0 && <p className="text-xs text-gray-400 mt-2">Fontes:</p>}
                <ul className="list-disc list-inside text-xs">
                    {locationSuggestions.sources.map((source, idx) => (
                        <li key={idx}><a href={source.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{source.maps?.title}</a></li>
                    ))}
                </ul>
            </div>
           )}
        </div>

        <div>
          <label htmlFor="vibe" className="block text-sm font-medium text-gray-400">Vibe da Noite</label>
          <select id="vibe" value={vibe} onChange={e => setVibe(e.target.value as Vibe)} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm p-2">
            {Object.values(Vibe).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        
        {artist && (
            <div className="p-4 border border-dashed border-gray-700 rounded-lg">
                <button type="button" onClick={handleSuggestPlaylist} disabled={isLoading} className="text-sm text-blue-400 hover:underline disabled:opacity-50">
                    {isLoading ? 'Buscando...' : `Sugestão de playlist para ${artist}`}
                </button>
                {playlistSuggestion && (
                    <div className="mt-2 p-2 bg-gray-800 rounded-md text-sm">
                       <p className="whitespace-pre-wrap">{playlistSuggestion.text}</p>
                        {playlistSuggestion.sources.length > 0 && <p className="text-xs text-gray-400 mt-2">Fontes:</p>}
                        <ul className="list-disc list-inside text-xs">
                            {playlistSuggestion.sources.map((source, idx) => (
                                <li key={idx}><a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{source.web?.title}</a></li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}

        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-50">
          {isLoading ? 'Processando...' : 'Adicionar ao Cofre'}
        </button>
      </form>
    </div>
  );
};

export default ShowForm;