import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { X, Save } from 'lucide-react';

const SimpleShortcutForm = ({ onClose, onSave, session }) => {
  const [formData, setFormData] = useState({
    trigger: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
        user_id: session.user.id
      };

      console.log('Creating shortcut:', shortcutData);

      const { data, error } = await supabase
        .from('shortcuts')
        .insert([shortcutData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Shortcut created successfully:', data);
      toast.success('Shortcut created successfully!');
      
      // Trigger extension sync automatically
      try {
        if (window.chrome && window.chrome.runtime) {
          window.chrome.runtime.sendMessage(window.chrome.runtime.id, {
            type: 'sync-now'
          }, (response) => {
            if (!window.chrome.runtime.lastError) {
              console.log('Extension auto-synced after shortcut creation');
            }
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
          <h2 className="text-lg font-semibold text-gray-900">Create New Shortcut</h2>
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
              {loading ? 'Creating...' : 'Create Shortcut'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleShortcutForm;