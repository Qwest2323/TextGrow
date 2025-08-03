import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Plus, Tag, Edit3, Trash2, X, Save } from 'lucide-react';

const TagManager = ({ tags, onRefresh, session }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    try {
      setLoading(true);

      if (editingTag) {
        // Update existing tag
        const { error } = await supabase
          .from('tags')
          .update({ name: tagName.trim() })
          .eq('id', editingTag.id);

        if (error) throw error;
        toast.success('Tag updated successfully');
      } else {
        // Create new tag
        const { data, error } = await supabase
          .from('tags')
          .insert([{ name: tagName.trim() }])
          .select();

        if (error) throw error;
        toast.success('Tag created successfully');
      }

      setTagName('');
      setShowForm(false);
      setEditingTag(null);
      onRefresh();
    } catch (error) {
      toast.error(`Failed to ${editingTag ? 'update' : 'create'} tag`);
      console.error('Tag operation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setShowForm(true);
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag? This will remove it from all shortcuts that use it.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast.success('Tag deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete tag');
      console.error('Delete error:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTag(null);
    setTagName('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Tags ({tags.length})
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Tag
        </button>
      </div>

      {/* New/Edit Tag Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingTag ? 'Edit Tag' : 'Create New Tag'}
          </h3>
          <form onSubmit={handleSubmit} className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag Name
              </label>
              <input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Enter tag name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{"--tw-ring-color": "#602E92"}}
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
                {editingTag ? 'Update' : 'Create'}
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

      {/* Tags List */}
      {tags.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Tag className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tags yet</h3>
          <p className="text-gray-600 mb-6">
            Create tags to categorize and organize your shortcuts for better discovery.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center mr-3" style={{backgroundColor: '#f4f1f8'}}>
                    <Tag className="h-4 w-4" style={{color: '#602E92'}} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{tag.name}</h3>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Created {new Date(tag.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagManager;