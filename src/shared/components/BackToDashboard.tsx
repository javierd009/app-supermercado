'use client';

import Link from 'next/link';

export function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center bg-blue-600 border border-blue-700 px-4 py-2 font-bold text-white text-sm hover:bg-blue-700 transition-colors"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      ← MENÚ PRINCIPAL
    </Link>
  );
}
