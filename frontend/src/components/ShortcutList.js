import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Copy, 
  Edit3, 
  Trash2, 
  Folder, 
  Tag as TagIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ShortcutCard = ({ shortcut, onEdit, onDelete, onCopy }) => {
  const [expanded, setExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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
          {shortcut.tags && shortcut.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {shortcut.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="tag"
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}

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
                ? 'bg-green-500 text-white' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
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
            className="mt-2 flex items-center text-blue-600 hover:text-blue-700 text-sm"
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
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;

      const response = await fetch(`${BACKEND_URL}/api/shortcuts/${shortcutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete shortcut');
      }

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
          />
        ))}
      </div>
    </div>
  );
};

export default ShortcutList;