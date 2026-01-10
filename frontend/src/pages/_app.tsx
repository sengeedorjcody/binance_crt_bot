import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import dynamic from 'next/dynamic';

// Dynamically import Inspector to avoid SSR issues
const DynamicInspector = dynamic(
  () => import('react-dev-inspector').then((mod) => mod.Inspector),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  const isDev = process.env.NODE_ENV === 'development';

  const handleClickElement = async (params: any) => {
    console.log('[React Inspector] Click detected:', params);
    
    if (params.codeInfo) {
      const { lineNumber, columnNumber, absolutePath, relativePath } = params.codeInfo;
      
      // Use relativePath if absolutePath is not available
      const fileName = absolutePath || relativePath;
      
      if (!fileName) {
        console.warn('[React Inspector] No file path available');
        return;
      }

      console.log(`[React Inspector] Opening ${fileName}:${lineNumber}:${columnNumber}`);
      
      try {
        const response = await fetch(
          `/api/__open-stack-frame-in-editor?fileName=${encodeURIComponent(
            fileName
          )}&lineNumber=${lineNumber}&colNumber=${columnNumber}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log('[React Inspector] File opened:', data);
        } else {
          const error = await response.json();
          console.error('[React Inspector] Failed to open file:', error);
        }
      } catch (error) {
        console.error('[React Inspector] Error:', error);
      }
    } else {
      console.warn('[React Inspector] No codeInfo available - source maps may not be configured');
    }
  };

  return (
    <div className="noise-overlay">
      {isDev ? (
        <DynamicInspector
          keys={['control', 'shift', 'c']} // Ctrl+Shift+C to toggle inspector
          onClickElement={handleClickElement}
          disableLaunchEditor={true} // We handle it ourselves
        >
          <Component {...pageProps} />
        </DynamicInspector>
      ) : (
        <Component {...pageProps} />
      )}
    </div>
  );
}
