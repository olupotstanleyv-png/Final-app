import React, { useState } from 'react';
import { Camera, Film, MapPin, Search, Sparkles, Wand2, Upload } from 'lucide-react';
import { generateMarketingImage, generateFoodVideo, editFoodImage, searchFoodTrends, findNearbySuppliers, analyzeFoodImage } from '../services/gemini';
import LiveAudioVisualizer from '../components/LiveAudioVisualizer';

const AILab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visuals' | 'voice' | 'intel'>('visuals');

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="bg-stone-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Sparkles className="text-yellow-400" /> GourmetAI Lab
          </h1>
          <p className="text-stone-400 max-w-2xl">
            Experience the future of dining technology. Use our advanced AI tools to generate marketing content, 
            analyze ingredients, create videos, and converse with our drive-thru assistant.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="flex gap-4 mb-8 border-b border-stone-200 pb-1">
          <button 
            onClick={() => setActiveTab('visuals')}
            className={`pb-3 px-2 font-medium transition ${activeTab === 'visuals' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Creative Studio
          </button>
          <button 
            onClick={() => setActiveTab('voice')}
            className={`pb-3 px-2 font-medium transition ${activeTab === 'voice' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Voice Assistant
          </button>
          <button 
            onClick={() => setActiveTab('intel')}
            className={`pb-3 px-2 font-medium transition ${activeTab === 'intel' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Market Intelligence
          </button>
        </div>

        {activeTab === 'visuals' && <VisualsStudio />}
        {activeTab === 'voice' && <VoiceStudio />}
        {activeTab === 'intel' && <IntelligenceStudio />}
      </div>
    </div>
  );
};

// --- Sub-components for cleaner code ---

const VisualsStudio: React.FC = () => {
  // Image Gen State
  const [imgPrompt, setImgPrompt] = useState('');
  const [imgSize, setImgSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);

  // Video Gen State
  const [vidPrompt, setVidPrompt] = useState('');
  const [vidAspect, setVidAspect] = useState<'16:9' | '9:16'>('16:9');
  const [generatedVid, setGeneratedVid] = useState<string | null>(null);
  const [vidLoading, setVidLoading] = useState(false);
  const [vidBaseImg, setVidBaseImg] = useState<{data: string, mime: string} | null>(null);

  // Edit Image State
  const [editBaseImg, setEditBaseImg] = useState<{data: string, mime: string} | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editedImg, setEditedImg] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const checkKey = async () => {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
    return true; // Assume success per instructions
  };

  const handleGenerateImage = async () => {
    try {
      setImgLoading(true);
      await checkKey(); // Paid feature
      const res = await generateMarketingImage(imgPrompt, imgSize, aspectRatio);
      if (res) setGeneratedImg(res);
    } catch (e) {
      console.error(e);
      alert("Failed to generate image. Ensure you selected a paid project.");
    } finally {
      setImgLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    try {
      setVidLoading(true);
      await checkKey(); // Paid feature
      const res = await generateFoodVideo(vidPrompt, vidAspect, vidBaseImg?.data, vidBaseImg?.mime);
      if (res) setGeneratedVid(res);
    } catch (e) {
      console.error(e);
      alert("Video generation failed.");
    } finally {
      setVidLoading(false);
    }
  };

  const handleEditImage = async () => {
    if (!editBaseImg) return;
    try {
      setEditLoading(true);
      const res = await editFoodImage(editBaseImg.data, editBaseImg.mime, editPrompt);
      if (res) setEditedImg(res);
    } catch (e) {
      console.error(e);
      alert("Edit failed");
    } finally {
      setEditLoading(false);
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: any) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            setter({ data: base64String, mime: file.type });
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Image Generation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Camera size={20} /></div>
          <h3 className="font-bold">Marketing Photo Generator</h3>
        </div>
        <p className="text-xs text-stone-500 mb-4">Model: gemini-3-pro-image-preview</p>
        
        <div className="space-y-3">
          <textarea 
            className="w-full p-3 border rounded-lg text-sm" 
            placeholder="E.g. A rustic italian pizza on a wooden table, 4k..."
            value={imgPrompt}
            onChange={e => setImgPrompt(e.target.value)}
          />
          <div className="flex gap-2">
             <select value={imgSize} onChange={(e:any) => setImgSize(e.target.value)} className="p-2 border rounded text-sm flex-1">
                <option value="1K">1K</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
             </select>
             <select value={aspectRatio} onChange={(e:any) => setAspectRatio(e.target.value)} className="p-2 border rounded text-sm flex-1">
                <option value="1:1">1:1</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="4:3">4:3</option>
             </select>
          </div>
          <button 
            onClick={handleGenerateImage}
            disabled={imgLoading}
            className="w-full bg-stone-800 text-white py-2 rounded-lg hover:bg-stone-700 disabled:opacity-50"
          >
            {imgLoading ? "Generating..." : "Generate"}
          </button>
        </div>
        
        {generatedImg && (
            <div className="mt-4">
                <img src={generatedImg} alt="Generated" className="w-full rounded-lg shadow-md" />
            </div>
        )}
      </div>

      {/* Video Generation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Film size={20} /></div>
            <h3 className="font-bold">Video Studio (Veo)</h3>
        </div>
        <p className="text-xs text-stone-500 mb-4">Model: veo-3.1-fast-generate-preview</p>

        <div className="space-y-3">
             <div className="border-dashed border-2 border-stone-200 rounded-lg p-4 text-center">
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, setVidBaseImg)} className="hidden" id="veo-upload" />
                <label htmlFor="veo-upload" className="cursor-pointer text-sm text-stone-500 flex flex-col items-center">
                   <Upload size={16} className="mb-1"/>
                   {vidBaseImg ? "Image selected" : "Upload Image (Optional)"}
                </label>
             </div>

            <textarea 
                className="w-full p-3 border rounded-lg text-sm" 
                placeholder="E.g. Cinematic slow motion of cheese dripping..."
                value={vidPrompt}
                onChange={e => setVidPrompt(e.target.value)}
            />
            <select value={vidAspect} onChange={(e:any) => setVidAspect(e.target.value)} className="w-full p-2 border rounded text-sm">
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
            </select>
            <button 
                onClick={handleGenerateVideo}
                disabled={vidLoading}
                className="w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
                {vidLoading ? "Generating (Wait ~1 min)..." : "Create Video"}
            </button>
        </div>

        {generatedVid && (
            <div className="mt-4">
                <video src={generatedVid} controls className="w-full rounded-lg shadow-md" />
            </div>
        )}
      </div>

      {/* Image Editing */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
        <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Wand2 size={20} /></div>
            <h3 className="font-bold">Magic Image Editor</h3>
        </div>
        <p className="text-xs text-stone-500 mb-4">Model: gemini-2.5-flash-image</p>

        <div className="space-y-3">
             <div className="border-dashed border-2 border-stone-200 rounded-lg p-4 text-center">
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, setEditBaseImg)} className="hidden" id="edit-upload" />
                <label htmlFor="edit-upload" className="cursor-pointer text-sm text-stone-500 flex flex-col items-center">
                   <Upload size={16} className="mb-1"/>
                   {editBaseImg ? "Image selected" : "Upload Image to Edit"}
                </label>
             </div>

             {editBaseImg && (
                <img src={`data:${editBaseImg.mime};base64,${editBaseImg.data}`} className="h-20 w-full object-cover rounded" alt="preview" />
             )}

            <input 
                type="text"
                className="w-full p-3 border rounded-lg text-sm" 
                placeholder="E.g. Add a retro filter, Remove background..."
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
            />
            <button 
                onClick={handleEditImage}
                disabled={editLoading || !editBaseImg}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 disabled:opacity-50"
            >
                {editLoading ? "Editing..." : "Apply Edit"}
            </button>
        </div>

        {editedImg && (
            <div className="mt-4">
                <img src={editedImg} alt="Edited" className="w-full rounded-lg shadow-md" />
            </div>
        )}
      </div>
    </div>
  );
};

const VoiceStudio: React.FC = () => {
  return (
    <div className="flex justify-center py-10">
      <LiveAudioVisualizer />
    </div>
  );
};

const IntelligenceStudio: React.FC = () => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<string>('');
    const [sources, setSources] = useState<string[]>([]);
    const [mode, setMode] = useState<'search' | 'maps' | 'analyze'>('search');
    const [loading, setLoading] = useState(false);
    const [analyzeImg, setAnalyzeImg] = useState<{data: string, mime: string} | null>(null);

    const handleRun = async () => {
        setLoading(true);
        setResult('');
        setSources([]);
        try {
            if (mode === 'search') {
                const res = await searchFoodTrends(query);
                setResult(res.text || "No results");
                setSources(res.sources);
            } else if (mode === 'maps') {
                // Mock LatLng for SF
                const res = await findNearbySuppliers(query, 37.7749, -122.4194);
                setResult(res || "No locations found");
            } else if (mode === 'analyze' && analyzeImg) {
                const res = await analyzeFoodImage(analyzeImg.data, analyzeImg.mime, query || "Describe this dish and list ingredients.");
                setResult(res || "Could not analyze");
            }
        } catch (e) {
            setResult("Error processing request.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setAnalyzeImg({ data: base64String, mime: file.type });
            };
            reader.readAsDataURL(file);
        }
      };

    return (
        <div className="bg-white rounded-xl shadow p-8 max-w-4xl mx-auto">
            <div className="flex gap-4 mb-6">
                <button onClick={() => setMode('search')} className={`flex items-center gap-2 px-4 py-2 rounded-full ${mode === 'search' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}><Search size={16}/> Trends (Search)</button>
                <button onClick={() => setMode('maps')} className={`flex items-center gap-2 px-4 py-2 rounded-full ${mode === 'maps' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}><MapPin size={16}/> Suppliers (Maps)</button>
                <button onClick={() => setMode('analyze')} className={`flex items-center gap-2 px-4 py-2 rounded-full ${mode === 'analyze' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}><Camera size={16}/> Food Analyzer</button>
            </div>

            <div className="space-y-4">
                {mode === 'analyze' && (
                    <div className="border-dashed border-2 p-4 text-center rounded-lg">
                        <input type="file" onChange={handleFileSelect} className="hidden" id="analyze-up" />
                        <label htmlFor="analyze-up" className="cursor-pointer block">
                            {analyzeImg ? "Image Selected" : "Upload Photo to Analyze"}
                        </label>
                    </div>
                )}
                
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={mode === 'search' ? "What are the latest dessert trends?" : mode === 'maps' ? "Italian food suppliers near me" : "Ask about the image..."}
                        className="flex-1 p-3 border rounded-lg"
                    />
                    <button onClick={handleRun} disabled={loading} className="bg-stone-900 text-white px-6 rounded-lg hover:bg-stone-700">
                        {loading ? "Running..." : "Go"}
                    </button>
                </div>

                {(result || sources.length > 0) && (
                    <div className="bg-stone-50 p-6 rounded-lg mt-4 border">
                        <div className="prose prose-sm max-w-none">
                            <p className="whitespace-pre-wrap text-stone-800">{result}</p>
                        </div>
                        {sources.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                                <h4 className="font-semibold text-xs uppercase text-stone-500 mb-2">Sources:</h4>
                                <ul className="list-disc pl-4 text-xs text-blue-600">
                                    {sources.map((src, i) => (
                                        <li key={i}><a href={src} target="_blank" rel="noreferrer" className="hover:underline">{src}</a></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AILab;