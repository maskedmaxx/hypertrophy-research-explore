'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useParams } from 'next/navigation';
import { studiesApi, summariesApi } from '@/lib/api';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

// helper func to parse sections and subsections
function parseSummary(text: string) {
  const mainSections = text.split(/\n## /).filter(Boolean);
  
  return mainSections.map(section => {
    const lines = section.split('\n');
    const title = lines[0].replace('## ', '').trim();
    const content = lines.slice(1).join('\n').trim();
    
    // Parse subsections 
    const subsections = content.split(/\n### /).filter(Boolean);
    
    if (subsections.length > 1) {
      return {
        title,
        subsections: subsections.map(sub => {
          const subLines = sub.split('\n');
          return {
            title: subLines[0].trim(),
            content: subLines.slice(1).join('\n').trim()
          };
        })
      };
    }
    
    return {
      title,
      content
    };
  });
}

// Helper to render formatted content
function renderContent(text: string) {
  return text.split('\n\n').map((paragraph, pIdx) => {
    // Handle bullet lists
    if (paragraph.includes('\n- ')) {
      const items = paragraph.split('\n- ').filter(Boolean);
      return (
        <ul key={pIdx} className="list-disc list-inside space-y-2 text-gray-800 mb-4 ml-2">
          {items.map((item, iIdx) => (
            <li key={iIdx} className="leading-relaxed">
              {item.replace(/^- /, '').split(/(\*\*.*?\*\*)/).map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
                }
                return <span key={i}>{part}</span>;
              })}
            </li>
          ))}
        </ul>
      );
    }
    
    // Regular paragraphs with bold text
    const parts = paragraph.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={pIdx} className="text-gray-800 leading-relaxed mb-4">
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  });
}

export default function StudyDetail() {
  const params = useParams();
  const studyId = parseInt(params.id as string);
  const [showSummary, setShowSummary] = useState(false);

  const { data: study, isLoading } = useQuery(['study', studyId], () =>
    studiesApi.get(studyId)
  );

  const { data: summary, isLoading: summaryLoading } = useQuery(
    ['summary', studyId],
    () => summariesApi.get(studyId),
    { enabled: showSummary, retry: false }
  );

  const generateMutation = useMutation(() => summariesApi.create(studyId), {
    onSuccess: () => setShowSummary(true),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Study not found</h2>
          <Link href="/" className="text-blue-600 mt-4 inline-block">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 flex items-center gap-2 hover:text-blue-700">
            <ArrowLeft className="w-4 h-4" />
            Back to Studies
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">{study.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {study.authors && (
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Authors</h3>
                <p className="text-gray-900">{study.authors}</p>
              </div>
            )}
            {study.journal && (
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Journal</h3>
                <p className="text-gray-900">
                  {study.journal} {study.publication_year && `(${study.publication_year})`}
                </p>
              </div>
            )}
          </div>

          {study.abstract && (
            <div className="mb-8 pb-6 border-b">
              <h2 className="text-xl font-bold mb-3 text-gray-900">Abstract</h2>
              <p className="text-gray-700 leading-relaxed">{study.abstract}</p>
            </div>
          )}

          <div className="mb-6">
            <button
              onClick={() => {
                if (!summary) generateMutation.mutate();
                setShowSummary(true);
              }}
              disabled={generateMutation.isLoading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg flex items-center gap-3 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all transform hover:scale-105"
            >
              <Sparkles className="w-6 h-6" />
              <span className="font-semibold">
                {generateMutation.isLoading ? 'Generating Analysis...' : 'Generate In-Depth AI Analysis'}
              </span>
            </button>
            {generateMutation.isLoading && (
              <p className="text-sm text-gray-500 mt-2 ml-1">This may take 30-60 seconds for comprehensive analysis...</p>
            )}
          </div>

          {showSummary && summary && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  <Sparkles className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">In-Depth AI Analysis</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {parseSummary(summary.summary_text).map((section, idx) => (
                  <div key={idx} className="bg-white rounded-lg border border-purple-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-5 py-3 border-b border-purple-200">
                      <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                    </div>
                    <div className="p-5">
                      {section.subsections ? (
                        <div className="space-y-5">
                          {section.subsections.map((sub, subIdx) => (
                            <div key={subIdx}>
                              <h4 className="text-base font-semibold text-purple-900 mb-3">{sub.title}</h4>
                              <div className="pl-2">{renderContent(sub.content)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        renderContent(section.content)
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {summary.model_used && (
                <div className="px-6 py-4 bg-white border-t border-purple-200">
                  <p className="text-xs text-gray-500">
                    Generated by {summary.model_used} • Claude AI Analysis
                  </p>
                </div>
              )}
            </div>
          )}

          {showSummary && summaryLoading && (
            <div className="bg-purple-50 rounded-lg p-8 border-2 border-purple-200">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Generating comprehensive analysis...</p>
                  <p className="text-sm text-gray-600 mt-1">This may take 30-60 seconds</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}