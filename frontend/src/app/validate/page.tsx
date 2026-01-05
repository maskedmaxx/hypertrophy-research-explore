'use client';

import { useState } from 'react';
import { useMutation } from 'react-query';
import { Shield, AlertCircle, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface ValidationResult {
  verdict: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED' | 'INSUFFICIENT_EVIDENCE';
  confidence: 'high' | 'moderate' | 'low';
  summary: string;
  evidence: {
    supporting: number;
    mixed: number;
    refuting: number;
  };
  key_studies: Array<{
    id: number;
    title: string;
    finding: string;
  }>;
  bottom_line: string;
}

export default function ClaimValidator() {
  const [claim, setClaim] = useState('');

  const validateMutation = useMutation(
    async (claimText: string) => {
      const response = await axios.post<ValidationResult>(
        'http://localhost:8000/api/claims/validate',
        { claim: claimText }
      );
      return response.data;
    }
  );

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (claim.trim()) {
      validateMutation.mutate(claim);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'SUPPORTED':
        return 'text-green-700 bg-green-50 border-green-300';
      case 'PARTIALLY_SUPPORTED':
        return 'text-yellow-700 bg-yellow-50 border-yellow-300';
      case 'NOT_SUPPORTED':
        return 'text-red-700 bg-red-50 border-red-300';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-300';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'SUPPORTED':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'PARTIALLY_SUPPORTED':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      case 'NOT_SUPPORTED':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Shield className="w-8 h-8 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-600" />
                Claim Validator
              </h1>
              <p className="text-gray-600 mt-1">
                Verify fitness claims against scientific evidence
              </p>
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Back to Studies
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
          <form onSubmit={handleValidate}>
            <label htmlFor="claim" className="block text-sm font-semibold text-gray-700 mb-2">
              Enter a fitness or training claim to validate:
            </label>
            <textarea
              id="claim"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder='Example: "You need to train to failure for maximum muscle growth"'
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              disabled={validateMutation.isLoading}
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                We'll analyze this claim against {232} peer-reviewed studies
              </p>
              <button
                type="submit"
                disabled={!claim.trim() || validateMutation.isLoading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                {validateMutation.isLoading ? 'Analyzing...' : 'Validate Claim'}
              </button>
            </div>
          </form>
        </div>

        {validateMutation.isLoading && (
          <div className="bg-purple-50 rounded-lg p-8 border-2 border-purple-200">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">Analyzing claim against research...</p>
                <p className="text-sm text-gray-600 mt-1">This may take 30-60 seconds</p>
              </div>
            </div>
          </div>
        )}

        {validateMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-700">
              Failed to validate claim. Please make sure the backend is running and try again.
            </p>
          </div>
        )}

        {validateMutation.data && (
          <div className="space-y-6">
            <div className={`rounded-lg border-2 p-6 ${getVerdictColor(validateMutation.data.verdict)}`}>
              <div className="flex items-start gap-4">
                {getVerdictIcon(validateMutation.data.verdict)}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">
                    {validateMutation.data.verdict.replace(/_/g, ' ')}
                  </h2>
                  <p className="text-sm font-medium opacity-75">
                    Confidence: {validateMutation.data.confidence.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Summary</h3>
              <p className="text-gray-800 leading-relaxed">{validateMutation.data.summary}</p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Evidence Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-3xl font-bold text-green-700">
                    {validateMutation.data.evidence.supporting}
                  </div>
                  <div className="text-sm text-green-600 mt-1">Supporting</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-3xl font-bold text-yellow-700">
                    {validateMutation.data.evidence.mixed}
                  </div>
                  <div className="text-sm text-yellow-600 mt-1">Mixed</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-3xl font-bold text-red-700">
                    {validateMutation.data.evidence.refuting}
                  </div>
                  <div className="text-sm text-red-600 mt-1">Refuting</div>
                </div>
              </div>
            </div>

            {validateMutation.data.key_studies.length > 0 && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Key Studies</h3>
                <div className="space-y-3">
                  {validateMutation.data.key_studies.map((study) => (
                    <Link
                      key={study.id}
                      href={`/studies/${study.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1">{study.title}</h4>
                      <p className="text-sm text-gray-700">{study.finding}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Bottom Line
              </h3>
              <p className="text-gray-800 leading-relaxed">{validateMutation.data.bottom_line}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Disclaimer:</strong> This analysis is AI-generated based on available research 
                and should not be considered medical or professional advice. Always consult with qualified 
                professionals for personalized guidance.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Try these example claims:</h3>
          <div className="space-y-2">
            {[
              "You need to train to failure for maximum muscle growth",
              "Cardio kills gains",
              "You need 1 gram of protein per pound of bodyweight",
              "Morning workouts are better than evening workouts",
              "You can't build muscle in a calorie deficit"
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setClaim(example)}
                className="block w-full text-left px-4 py-2 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors text-sm text-gray-700"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}