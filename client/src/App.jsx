import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";

// Create a new query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey.join("/"));
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        return res.json();
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// API helper function
async function apiRequest(method, url, data) {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
  
  return res;
}

// Toast context for notifications
const ToastContext = React.createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now().toString();
    const newToast = { id, ...toast };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm ${
              toast.variant === 'destructive' 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.description && (
              <div className="text-sm opacity-90">{toast.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return { toast: context.addToast };
}

// User Selection Component
function UserSelection() {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [lastClaimedPoints, setLastClaimedPoints] = useState(null);
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const claimPointsMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await apiRequest("POST", `/api/users/${userId}/claim`);
      return response.json();
    },
    onSuccess: (data) => {
      setLastClaimedPoints(data.pointsAwarded);
      toast({
        title: "Points Claimed!",
        description: `+${data.pointsAwarded} points awarded successfully!`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      setTimeout(() => setLastClaimedPoints(null), 3000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to claim points. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClaimPoints = () => {
    if (!selectedUserId) {
      toast({
        title: "No User Selected",
        description: "Please select a user before claiming points.",
        variant: "destructive",
      });
      return;
    }
    claimPointsMutation.mutate(selectedUserId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        👤 Select User
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose User
          </label>
          <select 
            value={selectedUserId} 
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a user...</option>
            {isLoading ? (
              <option disabled>Loading users...</option>
            ) : (
              users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.totalPoints} pts)
                </option>
              ))
            )}
          </select>
        </div>
        
        <button 
          onClick={handleClaimPoints}
          disabled={!selectedUserId || claimPointsMutation.isPending}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          🎁 {claimPointsMutation.isPending ? "Claiming..." : "Claim Random Points"}
        </button>
        
        {lastClaimedPoints !== null && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center text-green-700">
              ✅ <span className="ml-2">+{lastClaimedPoints} points awarded!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add User Form Component
function AddUserForm() {
  const [newUserName, setNewUserName] = useState("");
  const { toast } = useToast();

  const addUserMutation = useMutation({
    mutationFn: async (name) => {
      const response = await apiRequest("POST", "/api/users", { name });
      return response.json();
    },
    onSuccess: () => {
      setNewUserName("");
      toast({
        title: "User Added!",
        description: "New user has been added successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddUser = () => {
    if (!newUserName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a user name.",
        variant: "destructive",
      });
      return;
    }
    addUserMutation.mutate(newUserName.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddUser();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        ➕ Add New User
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User Name
          </label>
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter user name..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        <button 
          onClick={handleAddUser}
          disabled={addUserMutation.isPending}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          {addUserMutation.isPending ? "Adding..." : "Add User"}
        </button>
      </div>
    </div>
  );
}

// Leaderboard Table Component
function LeaderboardTable() {
  const { data: users, isLoading, isRefetching } = useQuery({
    queryKey: ["/api/users"],
    refetchInterval: 5000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  };

  const formatLastClaim = (lastClaimAt) => {
    if (!lastClaimAt) return "Never";
    
    const now = new Date();
    const diff = now.getTime() - new Date(lastClaimAt).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} mins ago`;
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return "bg-yellow-500 text-white";
    if (rank === 2) return "bg-gray-500 text-white";
    if (rank === 3) return "bg-orange-500 text-white";
    return "bg-gray-400 text-white";
  };

  const getPointsBadgeColor = (rank) => {
    if (rank === 1) return "bg-blue-100 text-blue-600";
    if (rank === 2) return "bg-green-100 text-green-600";
    if (rank === 3) return "bg-orange-100 text-orange-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            🏆 Leaderboard
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isRefetching}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            🔄 {isRefetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Claim
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : users && users.length > 0 ? (
              users.slice(0, 5).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${getRankBadgeColor(user.rank)}`}>
                        {user.rank}
                      </span>
                      {user.rank === 1 && <span className="ml-2">👑</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPointsBadgeColor(user.rank)}`}>
                      {user.totalPoints} pts
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLastClaim(user.lastClaimAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing top 5 users</span>
          <span className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer">
            View All
          </span>
        </div>
      </div>
    </div>
  );
}

// Points History Component
function PointsHistory() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["/api/history"],
    refetchInterval: 5000,
  });

  const formatTimeAgo = (claimedAt) => {
    const now = new Date();
    const diff = now.getTime() - new Date(claimedAt).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500", 
      "bg-orange-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-yellow-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getPointsBadgeColor = (points) => {
    if (points >= 8) return "bg-green-100 text-green-600";
    if (points >= 5) return "bg-purple-100 text-purple-600";
    return "bg-blue-100 text-blue-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          📊 Recent Claims History
        </h2>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">
              Loading history...
            </div>
          ) : history && history.length > 0 ? (
            history.slice(0, 10).map((claim) => (
              <div key={claim.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-10 h-10 ${getAvatarColor(claim.userName)} rounded-full flex items-center justify-center text-white font-semibold`}>
                    {getInitials(claim.userName)}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{claim.userName}</div>
                    <div className="text-xs text-gray-500">{formatTimeAgo(claim.claimedAt)}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPointsBadgeColor(claim.pointsAwarded)}`}>
                    +{claim.pointsAwarded} pts
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No claims history found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Leaderboard Component
function Leaderboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏆</span>
              <h1 className="text-xl font-semibold text-gray-900">Leaderboard System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Real-time Rankings</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: User Actions */}
          <div className="lg:col-span-1 space-y-6">
            <UserSelection />
            <AddUserForm />

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                📈 Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.totalUsers || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.totalClaims || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Claims</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Leaderboard and History */}
          <div className="lg:col-span-2 space-y-6">
            <LeaderboardTable />
            <PointsHistory />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Leaderboard />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;