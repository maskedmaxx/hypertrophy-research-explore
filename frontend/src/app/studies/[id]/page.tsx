'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useParams } from 'next/navigation';
import { studiesApi, summariesApi } from '@/lib/api';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Helper function to parse sections
function parseSummary(text: string) {
  const sections = text.split(/\n## /).filter(Boolean);
  return sections.map(section => {
    const [title, ...content] = section.split('\n');
    return {
      title: title.replace('## ', '').trim(),
      content: content.join('\n').trim()
    };
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
          <Link href="/" className="text-blue-600 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold mb-6">{study.title}</h1>
          {study.authors && (
            <div className="mb-4">
              <h3 className="text-sm font-bold uppercase text-gray-600">Authors</h3>
              <p>{study.authors}</p>
            </div>
          )}
          {study.journal && (
            <div className="mb-4">
              <h3 className="text-sm font-bold uppercase text-gray-600">Journal</h3>
              <p>
                {study.journal} {study.publication_year && `(${study.publication_year})`}
              </p>
            </div>
          )}
          {study.abstract && (
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2">Abstract</h2>
              <p className="text-gray-700">{study.abstract}</p>
            </div>
          )}
          <div className="border-t pt-6">
            <button
              onClick={() => {
                if (!summary) generateMutation.mutate();
                setShowSummary(true);
              }}
              disabled={generateMutation.isLoading}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              {generateMutation.isLoading ? 'Generating...' : 'Generate In-Depth AI Analysis'}
            </button>
          </div>
          {showSummary && summary && (
            <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">In-Depth AI Analysis</h2>
              </div>
              <div className="space-y-4">
                {parseSummary(summary.summary_text).map((section, idx) => (
                  <details key={idx} className="group bg-white rounded-lg border border-purple-200 overflow-hidden" open={idx === 0}>
                    <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-900 hover:bg-purple-50 flex items-center justify-between">
                      <span>{section.title}</span>
                      <span className="text-purple-600 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-4 py-3 border-t border-purple-100">
                      {section.content.split('\n\n').map((paragraph, pIdx) => {
                        if (paragraph.startsWith('- ')) {
                          const items = paragraph.split('\n- ').filter(Boolean);
                          return (
                            <ul key={pIdx} className="list-disc list-inside space-y-1 text-gray-800 mb-3">
                              {items.map((item, iIdx) => (
                                <li key={iIdx}>{item.replace('- ', '')}</li>
                              ))}
                            </ul>
                          );
                        }
                        const parts = paragraph.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={pIdx} className="text-gray-800 leading-relaxed mb-3">
                            {parts.map((part, i) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                  <strong key={i} className="font-semibold text-gray-900">
                                    {part.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return <span key={i}>{part}</span>;
                            })}
                          </p>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
              {summary.model_used && (
                <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-purple-200">
                  Generated by {summary.model_used}
                </p>
              )}
            </div>
          )}
          {showSummary && summaryLoading && (
            <div className="mt-6 p-6 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                <p>Generating in-depth AI analysis...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}