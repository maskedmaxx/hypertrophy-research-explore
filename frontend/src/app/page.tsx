'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { studiesApi, Study } from '@/lib/api';
import { Search, FileText, ExternalLink } from 'lucide-react';
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
          <h1 className="text-3xl font-bold text-gray-900">
            Hypertrophy Research Explorer
          </h1>
          <p className="text-gray-600 mt-2">
            Explore scientific studies on exercise, muscle growth, and strength training
          </p>
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
                placeholder="Search studies..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>
            <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg">
              Search
            </button>
          </div>
        </form>

        {isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        )}


        {data && (
          <div>
            <div className="space-y-4">
              {data.studies.map((study) => (
                <div key={study.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <Link href={`/studies/${study.id}`}>
                    <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
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
                    <Link href={`/studies/${study.id}`} className="text-blue-600 text-sm">
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
                  className="px-4 py-2 border rounded-lg"
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg"
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