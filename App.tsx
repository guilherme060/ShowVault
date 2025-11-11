
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import NavBar from './components/NavBar';
import Timeline from './components/Timeline';
import RandomMemory from './components/RandomMemory';
import ShowForm from './components/ShowForm';
import CollaborativeAlbum from './components/CollaborativeAlbum';
import AITools from './components/AITools';
import { Show, Media } from './types';
import { fileToBase64 } from './services/geminiService';

type View = 'timeline' | 'random' | 'add' | 'album' | 'ai';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('timeline');
  
  const [shows, setShows] = useState<Show[]>(() => {
    try {
      const savedShows = localStorage.getItem('showVaultShows');
      if (savedShows) {
        return JSON.parse(savedShows);
      }
    } catch (error) {
      console.error("Failed to load shows from localStorage", error);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('showVaultShows', JSON.stringify(shows));
    } catch (error) {
      console.error("Failed to save shows to localStorage", error);
      alert("Could not save shows. Storage might be full.");
    }
  }, [shows]);

  const addShow = async (newShowData: Omit<Show, 'id'>) => {
    const processedMedia: Media[] = await Promise.all(
      newShowData.media.map(async (mediaItem) => {
        if (!mediaItem.file) return mediaItem;

        try {
          const base64 = await fileToBase64(mediaItem.file);
          const newMediaItem: Media = {
            id: mediaItem.id,
            type: mediaItem.type,
            url: `data:${mediaItem.file.type};base64,${base64}`,
          };
          return newMediaItem;
        } catch (error) {
          console.error("Error converting file to base64:", error);
          return mediaItem;
        }
      })
    );

    const newShow: Show = {
      ...newShowData,
      media: processedMedia,
      id: crypto.randomUUID(),
    };
    setShows(prevShows => [...prevShows, newShow]);
  };
  
  const renderContent = () => {
    switch (currentView) {
      case 'timeline':
        return <Timeline shows={shows} />;
      case 'random':
        return <RandomMemory shows={shows} />;
      case 'add':
        return <ShowForm addShow={addShow} setCurrentView={setCurrentView} />;
      case 'album':
        return <CollaborativeAlbum shows={shows}/>;
      case 'ai':
        return <AITools shows={shows} />;
      default:
        return <Timeline shows={shows} />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-3xl mx-auto pb-24">
        <Header />
        <main className="mt-4">
          {renderContent()}
        </main>
      </div>
      <NavBar currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};

export default App;