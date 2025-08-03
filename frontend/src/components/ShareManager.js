import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Share2, Download, Upload, FileText, Users } from 'lucide-react';

const ShareManager = ({ session }) => {
  const [shortcuts, setShortcuts] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchShortcuts(),
        fetchFolders()
      ]);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShortcuts = async () => {
    try {
      if (!session?.user?.id) return;
      
      const { data, error } = await supabase
        .from('shortcuts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShortcuts(data || []);
    } catch (error) {
      console.error('Error fetching shortcuts:', error);
    }
  };

  const fetchFolders = async () => {
    try {
      if (!session?.user?.id) return;
      
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleExportAll = async () => {
    try {
      if (shortcuts.length === 0) {
        toast.error('No shortcuts to export');
        return;
      }

      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        user_id: session.user.id,
        shortcuts: shortcuts,
        folders: folders
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `textgrow-shortcuts-${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success(`Exported ${shortcuts.length} shortcuts successfully!`);
    } catch (error) {
      toast.error('Failed to export shortcuts');
      console.error('Export error:', error);
    }
  };

  const handleImportData = async () => {
    if (!importData.trim()) {
      toast.error('Please paste the import data');
      return;
    }

    try {
      const parsedData = JSON.parse(importData);
      
      if (!parsedData.shortcuts || !Array.isArray(parsedData.shortcuts)) {
        throw new Error('Invalid import format - missing shortcuts array');
      }

      let importedCount = 0;
      
      for (const shortcut of parsedData.shortcuts) {
        try {
          const { error } = await supabase
            .from('shortcuts')
            .insert([{
              trigger: shortcut.trigger,
              content: shortcut.content,
              user_id: session.user.id,
              folder_id: shortcut.folder_id || null
            }]);
          
          if (!error) {
            importedCount++;
          }
        } catch (err) {
          console.warn('Failed to import shortcut:', shortcut.trigger, err);
        }
      }

      if (importedCount > 0) {
        toast.success(`Successfully imported ${importedCount} shortcuts!`);
        fetchShortcuts(); // Refresh the list
      } else {
        toast.error('No shortcuts were imported');
      }
      
      setImportData('');
      setShowImportDialog(false);
    } catch (error) {
      toast.error('Failed to import data - please check the format');
      console.error('Import error:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor: '#602E92', borderTopColor: 'transparent'}}></div>
        <p className="text-gray-600">Loading data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Import & Export</h2>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center mr-3" style={{backgroundColor: '#f4f1f8'}}>
              <FileText className="h-5 w-5" style={{color: '#602E92'}} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{shortcuts.length}</p>
              <p className="text-sm text-gray-600">Total Shortcuts</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{folders.length}</p>
              <p className="text-sm text-gray-600">Folders</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Share2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">Ready</p>
              <p className="text-sm text-gray-600">Export Status</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center mr-3" style={{backgroundColor: '#f4f1f8'}}>
              <Download className="h-5 w-5" style={{color: '#602E92'}} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Export Shortcuts</h3>
              <p className="text-sm text-gray-600">Download your shortcuts as JSON file</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{backgroundColor: '#f4f1f8'}}>
              <p className="text-sm" style={{color: '#602E92'}}>
                Export includes all your shortcuts and folders. You can import this file later 
                or share it with others to transfer shortcuts between accounts.
              </p>
            </div>

            <button
              onClick={handleExportAll}
              disabled={shortcuts.length === 0}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All Shortcuts ({shortcuts.length})
            </button>
          </div>
        </div>

        {/* Import */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Upload className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Import Shortcuts</h3>
              <p className="text-sm text-gray-600">Import shortcuts from JSON file</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                Import shortcuts from a previously exported JSON file. Existing shortcuts 
                with the same trigger will not be overwritten.
              </p>
            </div>

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

      {/* Future Features */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Coming Soon</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center text-gray-600">
            <Share2 className="h-5 w-5 mr-3" />
            <span>Share folders with other users</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="h-5 w-5 mr-3" />
            <span>Collaborative shortcut libraries</span>
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Shortcuts</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste exported JSON data
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste the exported JSON data here..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent resize-none"
                  style={{"--tw-ring-color": "#602E92"}}
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