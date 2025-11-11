import React, { useState, useRef } from 'react';
import { Show, GroundingChunk } from '../types';
import * as geminiService from '../services/geminiService';
import { CloseIcon, PosterIcon, DeepDiveIcon, EditIcon, AnalyzerIcon, TranscribeIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface AIToolsProps {
  shows: Show[];
}

const AITools: React.FC<AIToolsProps> = ({ shows }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<'poster' | 'dive' | 'edit' | 'analyzer' | 'transcribe' | null>(null);

  // States for Poster Generator
  const [posterPrompt, setPosterPrompt] = useState('Bring Me The Horizon');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);

  // States for Deep Dive
  const [selectedShow, setSelectedShow] = useState<Show | null>(shows.length > 0 ? shows[0] : null);
  const [diveQuestion, setDiveQuestion] = useState('Qual foi o impacto cultural deste show na cena local?');
  const [diveResult, setDiveResult] = useState('');

  // States for Image Editor
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('Adicione um filtro de filme granulado e retrô');
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<{base64: string, mimeType: string} | null>(null);

  // States for Photo Analyzer
  const [photoToAnalyze, setPhotoToAnalyze] = useState<{url: string, base64: string, mimeType: string} | null>(null);
  const [photoAnalysisResult, setPhotoAnalysisResult] = useState<{text: string; sources: GroundingChunk[]} | null>(null);
  
  // States for Audio Transcription
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Carousel State
  const [currentIndex, setCurrentIndex] = useState(0);

  const closeModal = () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    }
    setActiveTool(null);
    // Reset all tool states
    setGeneratedPoster(null);
    setDiveResult('');
    setSelectedMedia(null);
    setEditedImage(null);
    setOriginalImage(null);
    setPhotoToAnalyze(null);
    setPhotoAnalysisResult(null);
    setIsRecording(false);
    setTranscribedText(null);
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  };

  const handleGeneratePoster = async () => {
    setIsLoading(true);
    setGeneratedPoster(null);
    const result = await geminiService.generatePoster(posterPrompt, aspectRatio);
    setGeneratedPoster(result);
    setIsLoading(false);
  };

  const handleDeepDive = async () => {
    if (!selectedShow) return;
    setIsLoading(true);
    setDiveResult('');
    const result = await geminiService.getDeepDive(selectedShow, diveQuestion);
    setDiveResult(result);
    setIsLoading(false);
  };
  
  const handleSelectImageForEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const base64 = await geminiService.fileToBase64(file);
        setOriginalImage({ base64, mimeType: file.type });
        setSelectedMedia(URL.createObjectURL(file));
        setEditedImage(null);
    }
  }

  const handleEditImage = async () => {
    if (!originalImage || !editPrompt) return;
    setIsLoading(true);
    setEditedImage(null);
    const result = await geminiService.editImage(originalImage.base64, originalImage.mimeType, editPrompt);
    setEditedImage(result);
    setIsLoading(false);
  };

  const handleSelectPhotoForAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoAnalysisResult(null);
      try {
        const base64 = await geminiService.fileToBase64(file);
        setPhotoToAnalyze({
            url: URL.createObjectURL(file),
            base64,
            mimeType: file.type
        });
      } catch (error) {
        console.error("Error processing file for analysis:", error);
      }
    }
  }

  const handleAnalyzePhoto = async () => {
    if (!photoToAnalyze) return;
    setIsLoading(true);
    setPhotoAnalysisResult(null);
    const result = await geminiService.analyzePhotoDetails(photoToAnalyze.base64, photoToAnalyze.mimeType);
    setPhotoAnalysisResult(result);
    setIsLoading(false);
  };

  const handleStartRecording = async () => {
    setTranscribedText(null);
    audioChunksRef.current = [];
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
            setIsLoading(true);
            const result = await geminiService.transcribeAudio(audioFile);
            setTranscribedText(result);
            setIsLoading(false);
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error accessing microphone:", err);
        setTranscribedText("Não foi possível acessar o microfone. Verifique as permissões do seu navegador.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const tools = [
    { id: 'poster', title: 'Gerador de Pôster', description: 'Crie um pôster único para um show real ou imaginário.', icon: <PosterIcon /> },
    { id: 'dive', title: 'Análise Profunda', description: 'Faça perguntas complexas sobre um de seus shows salvos.', icon: <DeepDiveIcon /> },
    { id: 'edit', title: 'Editor de Mídia', description: 'Edite suas fotos de shows usando prompts de texto.', icon: <EditIcon /> },
    { id: 'analyzer', title: 'Analisador de Mídia', description: 'Envie qualquer foto e receba uma análise detalhada.', icon: <AnalyzerIcon /> },
    { id: 'transcribe', title: 'Transcrição de Áudio', description: 'Grave um áudio e a IA irá transcrevê-lo para você.', icon: <TranscribeIcon /> },
  ];

  const nextTool = () => setCurrentIndex(prev => (prev + 1) % tools.length);
  const prevTool = () => setCurrentIndex(prev => (prev - 1 + tools.length) % tools.length);

  const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 p-4">
      <div className="bg-gray-900 border border-purple-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-purple-400">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <CloseIcon />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-center text-orange-400">Ferramentas Criativas de IA</h2>
      <div className="relative w-full max-w-md mx-auto h-96">
        <div className="relative h-full overflow-hidden">
            {tools.map((tool, index) => (
                <div 
                    key={tool.id}
                    className="absolute w-full h-full transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(${(index - currentIndex) * 100}%)` }}
                >
                    <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center">
                        <div className="p-6 bg-gray-800/50 rounded-2xl border-2 border-purple-800/30 w-64 h-80 flex flex-col justify-between items-center shadow-lg shadow-purple-900/20">
                            <div className="space-y-3">
                                {tool.icon}
                                <h3 className="font-bold text-xl text-purple-400">{tool.title}</h3>
                                <p className="text-sm text-gray-400 h-12">{tool.description}</p>
                            </div>
                            <button
                                onClick={() => setActiveTool(tool.id as any)}
                                className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-orange-500 rounded-md disabled:opacity-50 font-semibold"
                            >
                                Usar Ferramenta
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <button onClick={prevTool} className="absolute top-1/2 -translate-y-1/2 left-0 z-10 bg-gray-800/50 p-2 rounded-full hover:bg-purple-500/50">
            <ChevronLeftIcon />
        </button>
        <button onClick={nextTool} className="absolute top-1/2 -translate-y-1/2 right-0 z-10 bg-gray-800/50 p-2 rounded-full hover:bg-purple-500/50">
            <ChevronRightIcon />
        </button>
      </div>
      
      {activeTool === 'poster' && (
        <Modal title="Gerador de Pôster de Show" onClose={closeModal}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400">Artista / Banda</label>
                    <textarea value={posterPrompt} onChange={e => setPosterPrompt(e.target.value)} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md p-2" rows={3}></textarea>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400">Proporção da Tela</label>
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md p-2">
                        <option value="1:1">Quadrado (1:1)</option>
                        <option value="16:9">Paisagem (16:9)</option>
                        <option value="9:16">Retrato (9:16)</option>
                        <option value="4:3">Padrão (4:3)</option>
                        <option value="3:4">Vertical (3:4)</option>
                    </select>
                </div>
                <button onClick={handleGeneratePoster} disabled={isLoading} className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-orange-500 rounded-md disabled:opacity-50">
                    {isLoading ? 'Gerando...' : 'Gerar'}
                </button>
                {isLoading && !generatedPoster && <div className="text-center">Criando seu pôster... isso pode levar um momento.</div>}
                {generatedPoster && <img src={generatedPoster} alt="generated poster" className="w-full rounded-lg mt-4" />}
            </div>
        </Modal>
      )}

      {activeTool === 'dive' && (
         <Modal title="Análise Profunda da Memória" onClose={closeModal}>
            {shows.length > 0 ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Selecionar Show</label>
                        <select onChange={e => setSelectedShow(shows.find(s => s.id === e.target.value) || null)} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md p-2">
                            {shows.map(s => <option key={s.id} value={s.id}>{s.artist} em {s.location}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Sua Pergunta</label>
                        <textarea value={diveQuestion} onChange={e => setDiveQuestion(e.target.value)} className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md p-2" rows={3}></textarea>
                    </div>
                    <button onClick={handleDeepDive} disabled={isLoading} className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-orange-500 rounded-md disabled:opacity-50">
                        {isLoading ? 'Pensando...' : 'Obter Análise'}
                    </button>
                    {isLoading && !diveResult && <div className="text-center">Realizando análise profunda... por favor, aguarde.</div>}
                    {diveResult && <div className="mt-4 p-4 bg-gray-800 rounded-md whitespace-pre-wrap">{diveResult}</div>}
                </div>
            ) : (
                <p className="text-center text-gray-400">Você precisa adicionar um show primeiro para usar esta ferramenta.</p>
            )}
        </Modal>
      )}
      
       {activeTool === 'edit' && (
         <Modal title="Editor de Mídia com IA" onClose={closeModal}>
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-400">Enviar Mídia para Edição</label>
                    <input type="file" accept="image/*" onChange={handleSelectImageForEdit} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"/>
                </div>
                {selectedMedia && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-center text-gray-400 text-sm mb-1">Original</h4>
                                <img src={selectedMedia} alt="Original para edição" className="w-full rounded-lg" />
                            </div>
                            <div>
                                <h4 className="text-center text-gray-400 text-sm mb-1">Editada</h4>
                                <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
                                {isLoading ? <span>Editando...</span> : editedImage ? <img src={editedImage} alt="Imagem editada" className="w-full rounded-lg" /> : <span className="text-gray-500">O resultado aparecerá aqui</span>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400">Instrução de Edição</label>
                            <input type="text" value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="ex: Deixe em preto e branco" className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md p-2" />
                        </div>
                        <button onClick={handleEditImage} disabled={isLoading || !originalImage} className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-orange-500 rounded-md disabled:opacity-50">
                            {isLoading ? 'Aplicando Edição...' : 'Aplicar Edição com IA'}
                        </button>
                    </>
                )}
            </div>
        </Modal>
      )}

      {activeTool === 'analyzer' && (
         <Modal title="Analisador de Mídia com IA" onClose={closeModal}>
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-400">Enviar Mídia para Análise</label>
                    <input type="file" accept="image/*" onChange={handleSelectPhotoForAnalysis} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"/>
                </div>
                {photoToAnalyze && (
                    <div className="mt-4">
                        <img src={photoToAnalyze.url} alt="Foto para analisar" className="w-full max-w-sm mx-auto rounded-lg" />
                        <button onClick={handleAnalyzePhoto} disabled={isLoading} className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-purple-600 to-orange-500 rounded-md disabled:opacity-50">
                            {isLoading ? 'Analisando...' : 'Analisar Mídia'}
                        </button>
                    </div>
                )}
                {isLoading && !photoAnalysisResult && <div className="text-center p-4">Analisando a mídia com IA...</div>}
                {photoAnalysisResult && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-md">
                        <p className="whitespace-pre-wrap">{photoAnalysisResult.text}</p>
                        {photoAnalysisResult.sources.length > 0 && (
                            <>
                                <p className="text-xs text-gray-400 mt-4 font-semibold">Fontes (Google Search):</p>
                                <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                                    {photoAnalysisResult.sources.map((source, idx) => (
                                        source.web && <li key={idx}><a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{source.web.title}</a></li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Modal>
      )}

      {activeTool === 'transcribe' && (
        <Modal title="Transcrição de Áudio" onClose={closeModal}>
            <div className="space-y-4 flex flex-col items-center">
                <p className="text-gray-400 text-center">Grave uma nota de voz, uma ideia de letra ou um trecho de show e a IA irá transcrevê-la para você.</p>
                <div className="flex items-center justify-center space-x-4">
                    {!isRecording ? (
                        <button onClick={handleStartRecording} className="px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors">Iniciar Gravação</button>
                    ) : (
                        <button onClick={handleStopRecording} className="px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors">Parar Gravação</button>
                    )}
                </div>
                {isRecording && (
                    <div className="flex items-center text-red-500 animate-pulse">
                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                        Gravando...
                    </div>
                )}
                {isLoading && !transcribedText && <div className="text-center p-4">Transcrevendo áudio...</div>}
                {transcribedText && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-md w-full">
                        <h4 className="font-bold text-lg text-purple-400 mb-2">Texto Transcrito:</h4>
                        <p className="whitespace-pre-wrap text-gray-200">{transcribedText}</p>
                    </div>
                )}
            </div>
        </Modal>
      )}
    </div>
  );
};

export default AITools;