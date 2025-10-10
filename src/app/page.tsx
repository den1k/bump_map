'use client';

import { TextureProvider } from '@/contexts/TextureContext';
import TextureEditor from '@/components/editor/TextureEditor';
import DrawingTools from '@/components/editor/DrawingTools';
import ImportExport from '@/components/editor/ImportExport';
import Scene3D from '@/components/viewer/Scene3D';
import ModelSelector from '@/components/viewer/ModelSelector';
import ControlPanel from '@/components/viewer/ControlPanel';
import Link from 'next/link';

export default function Home() {
  return (
    <TextureProvider>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-gray-800 text-white p-4 shadow-md flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Bump Map Texture Editor</h1>
            <p className="text-sm text-gray-300">Create displacement textures and preview them in 3D</p>
          </div>
          <Link href="/docs" className="text-sm hover:underline">Docs</Link>
        </header>

        {/* Main Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - 2D Editor */}
          <div className="w-1/2 flex flex-col border-r border-gray-300">
            <DrawingTools />
            <div className="flex-1 overflow-hidden">
              <TextureEditor />
            </div>
            <ImportExport />
          </div>

          {/* Right Panel - 3D Viewer */}
          <div className="w-1/2 flex flex-col">
            <ModelSelector />
            <div className="flex-1 overflow-hidden">
              <Scene3D />
            </div>
            <ControlPanel />
          </div>
        </div>
      </div>
    </TextureProvider>
  );
}
