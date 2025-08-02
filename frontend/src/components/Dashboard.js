import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  User, 
  LogOut, 
  Folder, 
  Tag,
  Home,
  Settings,
  Share2
} from 'lucide-react';
import ShortcutList from './ShortcutList';
import SimpleShortcutForm from './SimpleShortcutForm';
import FolderManager from './FolderManager';
import TagManager from './TagManager';
import ShareManager from './ShareManager';

const Dashboard = ({ session }) => {
  const [shortcuts, setShortcuts] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [showShortcutForm, setShowShortcutForm] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Session data:', session);
      console.log('Access token:', session?.access_token ? 'Present' : 'Missing');
      
      await Promise.all([
        fetchShortcuts(),
        fetchFolders(), 
        fetchTags()
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
      if (!session?.user?.id) {
        console.error('No user session available');
        return;
      }
      
      // Fetch shortcuts first
      const { data, error } = await supabase
        .from('shortcuts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Now fetch tags for each shortcut using the junction table
      let transformedShortcuts = [];
      
      for (const shortcut of data || []) {
        try {
          // Fetch tags for this shortcut
          const { data: tagData, error: tagError } = await supabase
            .from('shortcut_tags')
            .select(`
              tags(id, name)
            `)
            .eq('shortcut_id', shortcut.id);

          const tags = tagError ? [] : (tagData?.map(st => st.tags).filter(Boolean) || []);
          
          transformedShortcuts.push({
            ...shortcut,
            folders: [], // For now, don't try to fetch folder relationships
            tags: tags
          });
        } catch (err) {
          // If tag fetching fails, just add the shortcut without tags
          transformedShortcuts.push({
            ...shortcut,
            folders: [],
            tags: []
          });
        }
      }

      console.log('Fetched shortcuts:', transformedShortcuts);
      setShortcuts(transformedShortcuts);
    } catch (error) {
      console.error('Error fetching shortcuts:', error);
      // If the join fails, fallback to simple fetch
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('shortcuts')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;
        
        const shortcuts = fallbackData?.map(shortcut => ({
          ...shortcut,
          folders: [],
          tags: []
        })) || [];
        
        setShortcuts(shortcuts);
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  };

  const fetchFolders = async () => {
    try {
      if (!session?.user?.id) {
        console.error('No user session available');
        return;
      }
      
      // Fetch folders from Supabase
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Fetched folders:', data);
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  };

  const fetchTags = async () => {
    try {
      // Fetch all tags from Supabase (tags are global)
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      console.log('Fetched tags:', data);
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const copyExtensionToken = async () => {
    try {
      if (session?.access_token) {
        // Try clipboard API first
        try {
          await navigator.clipboard.writeText(session.access_token);
          toast.success('Extension token copied! Now paste it in your TextGrow extension popup.');
          return;
        } catch (clipboardError) {
          console.warn('Clipboard API failed:', clipboardError);
        }
        
        // Fallback: Create a simple prompt with the token
        const tokenText = session.access_token;
        prompt('Copy this token for your Chrome extension:\n\n(Select all text and copy with Ctrl+C)', tokenText);
        toast.info('Token displayed in popup. Please copy it manually.');
        
      } else {
        toast.error('No authentication token available. Please sign in first.');
      }
    } catch (error) {
      toast.error('Failed to access token');
      console.error('Token access error:', error);
    }
  };

  const syncWithExtension = async () => {
    try {
      if (session?.access_token) {
        // Copy token to clipboard as fallback
        await navigator.clipboard.writeText(session.access_token);
        
        // Show instructions
        toast.success('Token copied! Now go to your TextGrow extension popup and click "Sync" to connect.');
        
        // Try to communicate with extension directly
        if (window.chrome && window.chrome.runtime) {
          window.chrome.runtime.sendMessage('extension-id', {
            type: 'save-user-token',
            token: session.access_token
          }, () => {
            if (!window.chrome.runtime.lastError) {
              toast.success('Extension synced successfully!');
            }
          });
        }
      }
    } catch (error) {
      toast.error('Failed to sync with extension');
      console.error('Sync error:', error);
    }
  };

  const handleSearch = async () => {
    try {
      if (!searchQuery.trim()) {
        // If empty search, fetch all shortcuts
        await fetchShortcuts();
        return;
      }

      if (!session?.user?.id) {
        toast.error('No user session available');
        return;
      }

      setLoading(true);
      
      // Search shortcuts by trigger or content
      const { data, error } = await supabase
        .from('shortcuts')
        .select('*')
        .eq('user_id', session.user.id)
        .or(`trigger.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setShortcuts(data || []);
      console.log(`Search found ${data?.length || 0} shortcuts for "${searchQuery}"`);
      
    } catch (error) {
      console.error('Error searching shortcuts:', error);
      toast.error('Search failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const filteredShortcuts = shortcuts.filter(shortcut => {
    if (selectedFolder && !shortcut.folders.some(f => f.id === selectedFolder)) {
      return false;
    }
    if (selectedTag && !shortcut.tags.some(t => t.id === selectedTag)) {
      return false;
    }
    return true;
  });

  const sidebarItems = [
    { path: '/', icon: Home, label: 'All Shortcuts', count: shortcuts.length },
    { path: '/folders', icon: Folder, label: 'Folders', count: folders.length },
    { path: '/tags', icon: Tag, label: 'Tags', count: tags.length },
    { path: '/shared', icon: Share2, label: 'Shared', count: 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your shortcuts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">TG</span>
                </div>
                <h1 className="text-lg font-semibold text-gray-900">TextGrow</h1>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <Filter className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {item.count}
                    </span>
                  </>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Menu */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.user_metadata?.name || session?.user?.email}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <button
                    onClick={handleSignOut}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="h-3 w-3 mr-1 inline" />
                    Sign out
                  </button>
                  <button
                    onClick={copyExtensionToken}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    📱 Copy Extension Token
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search shortcuts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="btn-primary"
              >
                Search
              </button>
            </div>
            
            <button
              onClick={() => setShowShortcutForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Shortcut
            </button>
          </div>

          {/* Filters */}
          {(selectedFolder || selectedTag) && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-600">Filters:</span>
              {selectedFolder && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  Folder: {folders.find(f => f.id === selectedFolder)?.name}
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedTag && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  Tag: {tags.find(t => t.id === selectedTag)?.name}
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          <Routes>
            <Route 
              path="/" 
              element={
                <ShortcutList 
                  shortcuts={filteredShortcuts}
                  onEdit={(shortcut) => {
                    setEditingShortcut(shortcut);
                    setShowShortcutForm(true);
                  }}
                  onRefresh={fetchShortcuts}
                  session={session}
                />
              } 
            />
            <Route 
              path="/folders" 
              element={
                <FolderManager 
                  folders={folders}
                  onRefresh={fetchFolders}
                  session={session}
                />
              } 
            />
            <Route 
              path="/tags" 
              element={
                <TagManager 
                  tags={tags}
                  onRefresh={fetchTags}
                  session={session}
                />
              } 
            />
            <Route 
              path="/shared" 
              element={
                <ShareManager 
                  session={session}
                />
              } 
            />
          </Routes>
        </div>
      </div>

      {/* Shortcut Form Modal */}
      {showShortcutForm && (
        <SimpleShortcutForm
          editingShortcut={editingShortcut}
          onClose={() => {
            setShowShortcutForm(false);
            setEditingShortcut(null);
          }}
          onSave={() => {
            fetchShortcuts();
            setShowShortcutForm(false);
            setEditingShortcut(null);
          }}
          session={session}
        />
      )}
    </div>
  );
};

export default Dashboard;