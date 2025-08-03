import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { X, Save, Folder, Tag } from 'lucide-react';

const SimpleShortcutForm = ({ onClose, onSave, session, editingShortcut = null }) => {
  const [formData, setFormData] = useState({
    trigger: '',
    content: '',
    folder_id: '',
    selectedTags: []
  });
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFoldersAndTags();
  }, []);

  useEffect(() => {
    if (editingShortcut) {
      setFormData({
        trigger: editingShortcut.trigger || '',
        content: editingShortcut.content || '',
        folder_id: editingShortcut.folder_id || '',
        selectedTags: editingShortcut.tags?.map(tag => tag.id) || []
      });
    }
  }, [editingShortcut]);

  const fetchFoldersAndTags = async () => {
    try {
      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true });

      if (foldersError) throw foldersError;
      setFolders(foldersData || []);

      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (tagsError) throw tagsError;
      setTags(tagsData || []);
    } catch (error) {
      console.error('Error fetching folders and tags:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.trigger.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!session?.user?.id) {
      toast.error('User session not found');
      return;
    }

    try {
      setLoading(true);

      const shortcutData = {
        trigger: formData.trigger.trim(),
        content: formData.content.trim(),
        user_id: session.user.id,
        folder_id: formData.folder_id || null
      };

      let shortcutId;
      let data;

      if (editingShortcut) {
        // Update existing shortcut
        console.log('Updating shortcut:', shortcutData);
        
        const { data: updateData, error } = await supabase
          .from('shortcuts')
          .update(shortcutData)
          .eq('id', editingShortcut.id)
          .select();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        data = updateData;
        shortcutId = editingShortcut.id;

        // Delete existing tag associations
        await supabase
          .from('shortcut_tags')
          .delete()
          .eq('shortcut_id', shortcutId);

      } else {
        // Create new shortcut
        console.log('Creating shortcut:', shortcutData);

        const { data: createData, error } = await supabase
          .from('shortcuts')
          .insert([shortcutData])
          .select();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        data = createData;
        shortcutId = data[0].id;
      }

      // Create tag associations if any tags are selected
      if (formData.selectedTags.length > 0) {
        const tagAssociations = formData.selectedTags.map(tagId => ({
          shortcut_id: shortcutId,
          tag_id: tagId
        }));

        console.log('Creating tag associations:', tagAssociations);

        try {
          const { data: tagData, error: tagError } = await supabase
            .from('shortcut_tags')
            .insert(tagAssociations)
            .select();

          if (tagError) {
            console.error('Error creating tag associations:', tagError);
            toast.error(`Warning: Could not associate tags - ${tagError.message}`);
          } else {
            console.log('Tag associations created successfully:', tagData);
          }
        } catch (tagError) {
          console.error('Exception creating tag associations:', tagError);
          toast.error('Warning: Could not associate tags');
        }
      }

      console.log('Shortcut saved successfully:', data);
      toast.success(editingShortcut ? 'Shortcut updated successfully!' : 'Shortcut created successfully!');
      
      // Trigger extension sync automatically
      try {
        if (window.chrome && window.chrome.runtime) {
          // Clear extension cache first, then sync
          window.chrome.runtime.sendMessage({
            type: 'clear-cache'
          }, () => {
            // Then trigger sync
            window.chrome.runtime.sendMessage({
              type: 'sync-now'
            }, (response) => {
              if (window.chrome.runtime.lastError) {
                console.log('Extension sync failed:', window.chrome.runtime.lastError.message);
              } else {
                console.log('Extension auto-synced after shortcut operation');
              }
            });
          });
        }
      } catch (error) {
        console.log('Could not auto-sync extension:', error);
      }
      
      if (onSave) {
        onSave(data[0]);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating shortcut:', error);
      toast.error(`Failed to create shortcut: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingShortcut ? 'Edit Shortcut' : 'Create New Shortcut'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trigger
            </label>
            <input
              type="text"
              name="trigger"
              value={formData.trigger}
              onChange={handleInputChange}
              placeholder="e.g., @email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              What you'll type to trigger this shortcut
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="e.g., john.doe@example.com"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The text that will replace your trigger
            </p>
          </div>

          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Folder className="h-4 w-4 inline mr-1" />
              Folder (Optional)
            </label>
            <select
              name="folder_id"
              value={formData.folder_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tag Selection */}
          {tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Tags (Optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                      formData.selectedTags.includes(tag.id)
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
              {formData.selectedTags.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.selectedTags.length} tag(s) selected
                </p>
              )}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {loading 
                ? (editingShortcut ? 'Updating...' : 'Creating...') 
                : (editingShortcut ? 'Update Shortcut' : 'Create Shortcut')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleShortcutForm;