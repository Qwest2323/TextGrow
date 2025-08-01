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
import ShortcutForm from './ShortcutForm';
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
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;
      
      if (!token) {
        console.error('No access token available');
        return;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/shortcuts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch shortcuts: ${response.status}`);
      }

      const data = await response.json();
      setShortcuts(data);
    } catch (error) {
      console.error('Error fetching shortcuts:', error);
      throw error;
    }
  };

  const fetchFolders = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;
      
      if (!token) {
        console.error('No access token available');
        return;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/folders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.status}`);
      }

      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  };

  const fetchTags = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${BACKEND_URL}/api/tags`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tags: ${response.status}`);
      }

      const data = await response.json();
      setTags(data);
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchShortcuts();
      return;
    }

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const token = session?.access_token;
      
      if (!token) {
        console.error('No access token available');
        return;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setShortcuts(data);
    } catch (error) {
      toast.error('Search failed');
      console.error('Search error:', error);
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
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-xs text-gray-500 hover:text-gray-700 mt-1"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Sign out
                </button>
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
        <ShortcutForm
          shortcut={editingShortcut}
          folders={folders}
          tags={tags}
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