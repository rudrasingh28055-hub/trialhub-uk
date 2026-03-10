"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase/client";

export function DebugPanel() {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    setResults(null);

    try {
      const supabase = createClient();
      const debugResults: any = {};

      // Test 1: Get session
      try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        debugResults.session = {
          success: !sessionError,
          data: session?.session ? {
            hasUser: !!session.session.user,
            userEmail: session.session.user?.email,
            userId: session.session.user?.id,
            expiresAt: session.session.expires_at
          } : null,
          error: sessionError?.message
        };
      } catch (err) {
        debugResults.session = { success: false, error: err instanceof Error ? err.message : String(err) };
      }

      // Test 2: List buckets
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        debugResults.buckets = {
          success: !bucketsError,
          data: buckets?.map((b: any) => ({ name: b.name, public: b.public })),
          error: bucketsError?.message
        };
      } catch (err) {
        debugResults.buckets = { success: false, error: err instanceof Error ? err.message : String(err) };
      }

      // Test 3: Test upload to post-media bucket
      try {
        const testPath = `debug/test-${Date.now()}.txt`;
        const testContent = new Blob(['debug test'], { type: 'text/plain' });
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(testPath, testContent);
        
        if (!uploadError) {
          // Test signed URL
          const { data: signedUrlData, error: signedError } = await supabase.storage
            .from('post-media')
            .createSignedUrl(testPath, 600);
          
          // Clean up
          await supabase.storage.from('post-media').remove([testPath]);
          
          debugResults.uploadTest = {
            success: true,
            signedUrlGenerated: !signedError,
            signedUrlSample: signedUrlData?.signedUrl?.substring(0, 100) + '...'
          };
        } else {
          debugResults.uploadTest = {
            success: false,
            error: uploadError.message
          };
        }
      } catch (err) {
        debugResults.uploadTest = { success: false, error: err instanceof Error ? err.message : String(err) };
      }

      setResults(debugResults);
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-lg p-4 max-w-md z-50">
      <h3 className="text-white font-bold mb-2">Debug Panel</h3>
      
      <button
        onClick={runDebug}
        disabled={isLoading}
        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Running...' : 'Run Diagnostics'}
      </button>

      {results && (
        <div className="mt-3 text-xs text-slate-300">
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
