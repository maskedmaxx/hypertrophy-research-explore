'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { studiesApi, Study } from '@/lib/api';
import { Search, FileText, ExternalLink, Shield } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useQuery(
    ['studies', page, searchTerm],
    () => studiesApi.list({ 
      skip: (page - 1) * pageSize, 
      limit: pageSize, 
      search: searchTerm || undefined 
    }),
    { keepPreviousData: true }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Hypertrophy Research Explorer
              </h1>
              <p className="text-gray-600 mt-2">
                Explore {data?.total || 232} scientific studies on exercise, muscle growth, and strength training
              </p>
            </div>
            <Link 
              href="/validate" 
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 shadow-lg flex items-center gap-2 transition-all"
            >
              <Shield className="w-5 h-5" />
              Validate Claims
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search studies by title, keywords, authors..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button 
              type="submit" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading studies...</p>
          </div>
        )}

        {data && (
          <div>
            <div className="space-y-4">
              {data.studies.map((study) => (
                <div key={study.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <Link href={`/studies/${study.id}`}>
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                      {study.title}
                    </h3>
                  </Link>
                  {study.authors && <p className="text-sm text-gray-600 mt-1">{study.authors}</p>}
                  {study.journal && study.publication_year && (
                    <p className="text-sm text-gray-500 mt-1">
                      {study.journal} ({study.publication_year})
                    </p>
                  )}
                  {study.abstract && (
                    <p className="text-gray-700 mt-3 line-clamp-3">{study.abstract}</p>
                  )}
                  <div className="flex gap-3 mt-4">
                    <Link 
                      href={`/studies/${study.id}`} 
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}