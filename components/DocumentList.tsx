"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import { FaPlus, FaEdit, FaTrash, FaFileAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface Document {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to view documents");
        return;
      }
      
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createNewDocument() {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in to create a document");
        return;
      }
      
      const { data, error } = await supabase
        .from('documents')
        .insert([
          { 
            title: 'Untitled Document', 
            content: '',
            user_id: user.id
          }
        ])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        router.push(`/editor/${data[0].id}`);
      }
    } catch (error: any) {
      setError(error.message);
    }
  }

  async function deleteDocument(id: string) {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setDocuments(documents.filter(doc => doc.id !== id));
      } catch (error: any) {
        setError(error.message);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Documents</h2>
        <button
          onClick={createNewDocument}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600 transition-colors"
        >
          <FaPlus /> New Document
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-8">
          <FaFileAlt className="mx-auto text-gray-300 text-5xl mb-4" />
          <p className="text-gray-500">You don't have any documents yet.</p>
          <button
            onClick={createNewDocument}
            className="mt-4 text-primary hover:underline"
          >
            Create your first document
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/editor/${doc.id}`} className="text-primary hover:underline">
                      {doc.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.updated_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/editor/${doc.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      <FaEdit className="inline" /> Edit
                    </Link>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash className="inline" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 