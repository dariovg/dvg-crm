// app/marketing/pending/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import SocialPostCard from '@/components/marketing/SocialPostCard';
import ApprovalButtons from '@/components/marketing/ApprovalButtons';

interface SocialPost {
  id: string;
  title: string;
  content: string;
  platform: 'TWITTER' | 'LINKEDIN' | 'INSTAGRAM' | 'FACEBOOK';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  campaign?: {
    name: string;
  };
  approvals?: Array<{
    id: string;
    approvedBy: {
      name: string;
    };
    status: string;
  }>;
}

export default function PendingPostsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketing/posts?status=PENDING');
      
      if (!response.ok) {
        throw new Error('Error fetching pending posts');
      }

      const data = await response.json();
      setPosts(data.posts);
      setTotalCount(data.total);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar posts pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      const response = await fetch(`/api/marketing/posts/${postId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        setTotalCount(prev => Math.max(0, prev - 1));
      } else {
        setError('Error al aprobar post');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al aprobar post');
    }
  };

  const handleReject = async (postId: string, reason: string) => {
    try {
      const response = await fetch(`/api/marketing/posts/${postId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        setTotalCount(prev => Math.max(0, prev - 1));
      } else {
        setError('Error al rechazar post');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al rechazar post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">📝 Posts Pendientes</h1>
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-500">Cargando...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">📝 Posts Pendientes de Aprobación</h1>
          <div className="bg-white px-4 py-2 rounded-lg shadow">
            <span className="text-gray-600">Total:</span>
            <span className="ml-2 text-2xl font-bold text-blue-600">{totalCount}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Sin posts pendientes</h2>
            <p className="text-gray-600">¡Todos los posts han sido revisados!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <SocialPostCard post={post} />
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <ApprovalButtons
                    postId={post.id}
                    onApprove={() => handleApprove(post.id)}
                    onReject={(reason) => handleReject(post.id, reason)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
