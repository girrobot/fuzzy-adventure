"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaEdit, FaTrash, FaExclamationCircle } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';

export default function DocumentList() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        console.log("DocumentList: Fetching documents...");
        setLoading(true);
        setError(null);
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("DocumentList: User error:", userError);
          setError("Failed to authenticate user");
          setLoading(false);
          return;
        }
        
        // Fetch documents for current user
        const { data, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        
        if (docsError) {
          console.error("DocumentList: Error fetching documents:", docsError);
          setError("Failed to load documents");
          setLoading(false);
          return;
        }
        
        console.log(`DocumentList: Fetched ${data?.length || 0} documents`);
        setDocuments(data || []);
      } catch (err) {
        console.error("DocumentList: Unexpected error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
    
    // Set up realtime subscription for document changes
    const subscription = supabase
      .channel('documents_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'documents' 
      }, payload => {
        console.log("DocumentList: Realtime update received", payload);
        fetchDocuments();
      })
      .subscribe();
    
    return () => {
      console.log("DocumentList: Cleaning up subscription");
      subscription.unsubscribe();
    };
  }, []);

  const createNewDocument = async () => {
    try {
      console.log("DocumentList: Creating new document...");
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("DocumentList: User error when creating document:", userError);
        setError("Failed to authenticate user");
        return;
      }
      
      // Create new document
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
      
      if (error) {
        console.error("DocumentList: Error creating document:", error);
        setError("Failed to create new document");
        return;
      }
      
      if (data && data[0]) {
        console.log("DocumentList: Document created, redirecting to editor");
        router.push(`/editor/${data[0].id}`);
      }
    } catch (err) {
      console.error("DocumentList: Unexpected error creating document:", err);
      setError("An unexpected error occurred");
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      console.log(`DocumentList: Deleting document ${id}...`);
      setDeleting(id);
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("DocumentList: Error deleting document:", error);
        setError("Failed to delete document");
        return;
      }
      
      console.log("DocumentList: Document deleted successfully");
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err) {
      console.error("DocumentList: Unexpected error deleting document:", err);
      setError("An unexpected error occurred");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center text-red-600">
          <FaExclamationCircle className="mr-2" />
          <p>{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">My Documents</h2>
        <button
          onClick={createNewDocument}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
        >
          <FaPlus className="mr-2" /> New Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">You don't have any documents yet.</p>
          <button
            onClick={createNewDocument}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center"
          >
            <FaPlus className="mr-2" /> Create Your First Document
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
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
                    <Link href={`/editor/${doc.id}`} className="text-primary hover:text-orange-600">
                      {doc.title || 'Untitled Document'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(doc.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/editor/${doc.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <FaEdit className="inline" /> Edit
                    </Link>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      disabled={deleting === doc.id}
                      className="text-red-600 hover:text-red-900"
                    >
                      {deleting === doc.id ? (
                        <span className="inline-flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-red-600 mr-1"></div> Deleting...
                        </span>
                      ) : (
                        <><FaTrash className="inline" /> Delete</>
                      )}
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