'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

export default function DocsPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/docs/USAGE.md')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load docs');
        return res.text();
      })
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen bg-white">Loading docs...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500 bg-white">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">&larr; Back to Editor</Link>
        </div>
        <article className="prose prose-slate prose-lg max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
