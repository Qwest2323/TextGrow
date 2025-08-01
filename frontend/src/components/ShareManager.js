import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Share2, Link, Copy, Download, Upload, ExternalLink } from 'lucide-react';

const ShareManager = ({ session }) => {
  const [sharedFolders, setSharedFolders] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSharedFolders(),
        fetchFolders()
      ]);
    } catch (error) {
      toast.error('Failed to load sharing data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedFolders = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;
      
      const response = await fetch(`${BACKEND_URL}/api/shared-folders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSharedFolders(data);
      }
    } catch (error) {
      console.error('Error fetching shared folders:', error);
    }
  };

  const fetchFolders = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;
      
      const response = await fetch(`${BACKEND_URL}/api/folders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleShareFolder = async () => {
    if (!selectedFolder) {
      toast.error('Please select a folder to share');
      return;
    }

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;

      const response = await fetch(`${BACKEND_URL}/api/shared-folders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folder_id: selectedFolder
        })
      });

      if (!response.ok) {
        throw new Error('Failed to share folder');
      }

      const data = await response.json();
      setShareLink(`${window.location.origin}/import/${data.share_link}`);
      toast.success('Folder shared successfully!');
      fetchSharedFolders();
    } catch (error) {
      toast.error('Failed to share folder');
      console.error('Share error:', error);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleImportData = async () => {
    if (!importData.trim()) {
      toast.error('Please paste the import data');
      return;
    }

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;

      const response = await fetch(`${BACKEND_URL}/api/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          import_data: importData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to import data');
      }

      const result = await response.json();
      toast.success(`Successfully imported ${result.imported_count} shortcuts!`);
      setImportData('');
      setShowImportDialog(false);
    } catch (error) {
      toast.error('Failed to import data');
      console.error('Import error:', error);
    }
  };

  const handleExportAll = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;

      const response = await fetch(`${BACKEND_URL}/api/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const data = await response.json();
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'textgrow-shortcuts.json';
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('Shortcuts exported successfully!');
    } catch (error) {
      toast.error('Failed to export shortcuts');
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading sharing options...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sharing & Import/Export</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Share Folder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Share2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Share Folder</h3>
              <p className="text-sm text-gray-600">Create a shareable link for a folder</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Folder to Share
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a folder...</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setShowShareDialog(true);
                handleShareFolder();
              }}
              disabled={!selectedFolder}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Share Link
            </button>

            {shareLink && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <p className="text-sm font-medium text-green-800 mb-1">Share Link Generated!</p>
                    <p className="text-xs text-green-600 break-all">{shareLink}</p>
                  </div>
                  <button
                    onClick={handleCopyShareLink}
                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Import/Export */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Upload className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Import & Export</h3>
              <p className="text-sm text-gray-600">Backup or import your shortcuts</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleExportAll}
              className="w-full btn-secondary flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All Shortcuts
            </button>

            <button
              onClick={() => setShowImportDialog(true)}
              className="w-full btn-secondary flex items-center justify-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Shortcuts
            </button>
          </div>
        </div>
      </div>

      {/* Shared Folders List */}
      {sharedFolders.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Shared Folders</h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {sharedFolders.map((sharedFolder) => (
                <div key={sharedFolder.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{sharedFolder.folder_name}</p>
                    <p className="text-sm text-gray-600">
                      Shared on {new Date(sharedFolder.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/import/${sharedFolder.share_link}`);
                        toast.success('Share link copied!');
                      }}
                      className="p-2 text-gray-600 hover:text-gray-800"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`${window.location.origin}/import/${sharedFolder.share_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Shortcuts</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste import data or JSON file content
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste the exported JSON data here..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportData('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportData}
                  className="btn-primary"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareManager;