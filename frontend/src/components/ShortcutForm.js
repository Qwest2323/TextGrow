import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Save, Folder, Tag as TagIcon } from 'lucide-react';

const ShortcutForm = ({ shortcut, folders, tags, onClose, onSave, session }) => {
  const [formData, setFormData] = useState({
    trigger: '',
    content: '',
    selectedFolders: [],
    selectedTags: []
  });
  const [loading, setLoading] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    if (shortcut) {
      setFormData({
        trigger: shortcut.trigger,
        content: shortcut.content,
        selectedFolders: shortcut.folders?.map(f => f.id) || [],
        selectedTags: shortcut.tags?.map(t => t.id) || []
      });
    }
  }, [shortcut]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFolderToggle = (folderId) => {
    setFormData({
      ...formData,
      selectedFolders: formData.selectedFolders.includes(folderId)
        ? formData.selectedFolders.filter(id => id !== folderId)
        : [...formData.selectedFolders, folderId]
    });
  };

  const handleTagToggle = (tagId) => {
    setFormData({
      ...formData,
      selectedTags: formData.selectedTags.includes(tagId)
        ? formData.selectedTags.filter(id => id !== tagId)
        : [...formData.selectedTags, tagId]
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;

      const response = await fetch(`${BACKEND_URL}/api/folders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newFolderName })
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      const newFolder = await response.json();
      setFormData({
        ...formData,
        selectedFolders: [...formData.selectedFolders, newFolder.id]
      });
      setNewFolderName('');
      setShowNewFolderInput(false);
      toast.success('Folder created successfully');
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

      const response = await fetch(`${BACKEND_URL}/api/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newTagName })
      });

      if (!response.ok) {
        throw new Error('Failed to create tag');
      }

      const newTag = await response.json();
      setFormData({
        ...formData,
        selectedTags: [...formData.selectedTags, newTag.id]
      });
      setNewTagName('');
      setShowNewTagInput(false);
      toast.success('Tag created successfully');
    } catch (error) {
      toast.error('Failed to create tag');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.trigger.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;

      const method = shortcut ? 'PUT' : 'POST';
      const url = shortcut 
        ? `${BACKEND_URL}/api/shortcuts/${shortcut.id}`
        : `${BACKEND_URL}/api/shortcuts`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trigger: formData.trigger,
          content: formData.content
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${shortcut ? 'update' : 'create'} shortcut`);
      }

      toast.success(`Shortcut ${shortcut ? 'updated' : 'created'} successfully`);
      onSave();
    } catch (error) {
      toast.error(`Failed to ${shortcut ? 'update' : 'create'} shortcut`);
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {shortcut ? 'Edit Shortcut' : 'Create New Shortcut'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Trigger */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trigger Text *
            </label>
            <input
              type="text"
              name="trigger"
              value={formData.trigger}
              onChange={handleInputChange}
              placeholder="e.g., @email, :signature, /address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              This is what you'll type to trigger the expansion
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Enter the text that will replace your trigger..."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              This text will replace your trigger when expanded
            </p>
          </div>

          {/* Folders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Folders
              </label>
              <button
                type="button"
                onClick={() => setShowNewFolderInput(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + New Folder
              </button>
            </div>

            {showNewFolderInput && (
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFolderInput(false);
                    setNewFolderName('');
                  }}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {folders.map((folder) => (
                <label
                  key={folder.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedFolders.includes(folder.id)}
                    onChange={() => handleFolderToggle(folder.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Folder className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-700">{folder.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Tags
              </label>
              <button
                type="button"
                onClick={() => setShowNewTagInput(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + New Tag
              </button>
            </div>

            {showNewTagInput && (
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTagInput(false);
                    setNewTagName('');
                  }}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedTags.includes(tag.id)}
                    onChange={() => handleTagToggle(tag.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <TagIcon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700">{tag.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
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
              {shortcut ? 'Update Shortcut' : 'Create Shortcut'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShortcutForm;