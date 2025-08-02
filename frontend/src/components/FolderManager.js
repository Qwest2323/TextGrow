import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Folder, Edit3, Trash2, X, Save } from 'lucide-react';

const FolderManager = ({ folders, onRefresh, session }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    if (!session?.user?.id) {
      toast.error('User session not found');
      return;
    }

    try {
      setLoading(true);

      if (editingFolder) {
        // Update existing folder
        const { error } = await supabase
          .from('folders')
          .update({ name: folderName.trim() })
          .eq('id', editingFolder.id);

        if (error) throw error;
        toast.success('Folder updated successfully');
      } else {
        // Create new folder
        const { data, error } = await supabase
          .from('folders')
          .insert([{
            name: folderName.trim(),
            user_id: session.user.id
          }])
          .select();

        if (error) throw error;
        toast.success('Folder created successfully');
      }

      setFolderName('');
      setShowForm(false);
      setEditingFolder(null);
      onRefresh();
    } catch (error) {
      toast.error(`Failed to ${editingFolder ? 'update' : 'create'} folder`);
      console.error('Folder operation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setShowForm(true);
  };

  const handleDelete = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder? This will not delete the shortcuts inside it.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      toast.success('Folder deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete folder');
      console.error('Delete error:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFolder(null);
    setFolderName('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Folders ({folders.length})
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Folder
        </button>
      </div>

      {/* New/Edit Folder Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingFolder ? 'Edit Folder' : 'Create New Folder'}
          </h3>
          <form onSubmit={handleSubmit} className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Folder Name
              </label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingFolder ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Folders List */}
      {folders.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Folder className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No folders yet</h3>
          <p className="text-gray-600 mb-6">
            Create folders to organize your shortcuts by category or purpose.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Folder className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{folder.name}</h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(folder.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(folder)}
                    className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(folder.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderManager;