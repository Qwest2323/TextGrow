import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { 
  Copy, 
  Edit3, 
  Trash2, 
  Folder, 
  Tag as TagIcon,
  ChevronDown,
  ChevronUp,
  Plus,
  X
} from 'lucide-react';

const ShortcutCard = ({ shortcut, onEdit, onDelete, onCopy, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [updatingTags, setUpdatingTags] = useState(false);

  useEffect(() => {
    if (showTagSelector) {
      fetchAvailableTags();
    }
  }, [showTagSelector]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTagSelector && !event.target.closest('.tag-selector-container')) {
        setShowTagSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTagSelector]);

  const fetchAvailableTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortcut.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1000);
      onCopy();
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleAddTag = async (tagId) => {
    try {
      setUpdatingTags(true);
      
      console.log('Adding tag:', { shortcut_id: shortcut.id, tag_id: tagId });
      
      // Check if tag is already added
      if (shortcut.tags && shortcut.tags.some(tag => tag.id === tagId)) {
        toast.error('Tag already added to this shortcut');
        return;
      }

      // Check if the relationship already exists
      const { data: existing, error: checkError } = await supabase
        .from('shortcut_tags')
        .select('*')
        .eq('shortcut_id', shortcut.id)
        .eq('tag_id', tagId);

      if (checkError) {
        console.error('Error checking existing tag relationship:', checkError);
        throw checkError;
      }

      if (existing && existing.length > 0) {
        toast.error('Tag already added to this shortcut');
        return;
      }

      const { data, error } = await supabase
        .from('shortcut_tags')
        .insert([{
          shortcut_id: shortcut.id,
          tag_id: tagId
        }])
        .select();

      if (error) {
        console.error('Error inserting tag relationship:', error);
        throw error;
      }

      console.log('Tag relationship created:', data);
      toast.success('Tag added successfully');
      setShowTagSelector(false);
      onRefresh();
    } catch (error) {
      toast.error(`Failed to add tag: ${error.message}`);
      console.error('Error adding tag:', error);
    } finally {
      setUpdatingTags(false);
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      setUpdatingTags(true);

      const { error } = await supabase
        .from('shortcut_tags')
        .delete()
        .eq('shortcut_id', shortcut.id)
        .eq('tag_id', tagId);

      if (error) throw error;

      toast.success('Tag removed successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to remove tag');
      console.error('Error removing tag:', error);
    } finally {
      setUpdatingTags(false);
    }
  };

  const truncatedContent = shortcut.content.length > 300 
    ? shortcut.content.substring(0, 300) + '...' 
    : shortcut.content;

  return (
    <div className="shortcut-card card-hover fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-2">
            {shortcut.trigger}
          </h3>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {shortcut.tags && shortcut.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 group"
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  disabled={updatingTags}
                  className="ml-1 text-primary-600 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            
            {/* Add Tag Button */}
            <div className="relative tag-selector-container">
              <button
                onClick={() => setShowTagSelector(!showTagSelector)}
                disabled={updatingTags}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Tag
              </button>
              
              {/* Tag Selector Dropdown */}
              {showTagSelector && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-700 mb-2">Select a tag to add:</div>
                    <div className="max-h-32 overflow-y-auto">
                      {availableTags.filter(tag => !shortcut.tags.some(st => st.id === tag.id)).map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => handleAddTag(tag.id)}
                          disabled={updatingTags}
                          className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded transition-colors duration-200 disabled:opacity-50"
                        >
                          {tag.name}
                        </button>
                      ))}
                      {availableTags.filter(tag => !shortcut.tags.some(st => st.id === tag.id)).length === 0 && (
                        <div className="text-xs text-gray-500 px-2 py-1">All tags are already added</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Folders */}
          {shortcut.folders && shortcut.folders.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {shortcut.folders.map((folder) => (
                <span
                  key={folder.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  <Folder className="h-3 w-3 mr-1" />
                  {folder.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleCopy}
            className={`p-2 rounded-lg transition-all duration-200 ${
              copySuccess 
                ? 'bg-accent-500 text-gray-900' 
                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
            }`}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(shortcut)}
            className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(shortcut.id)}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
          {expanded ? shortcut.content : truncatedContent}
        </pre>
        
        {shortcut.content.length > 300 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center text-primary-600 hover:text-primary-700 text-sm"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show More
              </>
            )}
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Created: {new Date(shortcut.created_at).toLocaleDateString()}
        </span>
        <span>
          Modified: {new Date(shortcut.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

const ShortcutList = ({ shortcuts, onEdit, onRefresh, session }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (shortcutId) => {
    if (!window.confirm('Are you sure you want to delete this shortcut?')) {
      return;
    }

    try {
      setDeletingId(shortcutId);

      // First delete associated tag relationships (CASCADE should handle this, but let's be explicit)
      const { error: tagError } = await supabase
        .from('shortcut_tags')
        .delete()
        .eq('shortcut_id', shortcutId);

      if (tagError) {
        console.warn('Error deleting tag associations:', tagError);
        // Don't fail the operation for tag deletion errors since CASCADE should handle it
      }

      // Then delete the shortcut
      const { error } = await supabase
        .from('shortcuts')
        .delete()
        .eq('id', shortcutId);

      if (error) throw error;

      toast.success('Shortcut deleted successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to delete shortcut');
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = () => {
    // Track copy for analytics if needed
  };

  if (shortcuts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Copy className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No shortcuts yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first text shortcut to get started with TextGrow.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Your Shortcuts ({shortcuts.length}/500)
        </h2>
        <div className="text-sm text-gray-500">
          {shortcuts.length === 500 && (
            <span className="text-orange-600 font-medium">
              You've reached the maximum limit of 500 shortcuts
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((shortcut) => (
          <ShortcutCard
            key={shortcut.id}
            shortcut={shortcut}
            onEdit={onEdit}
            onDelete={handleDelete}
            onCopy={handleCopy}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
};

export default ShortcutList;