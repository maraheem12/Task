import { Medal, RefreshCw, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function LeaderboardTable() {
  const { data: users, isLoading, isRefetching } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  };

  const formatLastClaim = (lastClaimAt: Date | null) => {
    if (!lastClaimAt) return "Never";
    
    const now = new Date();
    const diff = now.getTime() - new Date(lastClaimAt).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} mins ago`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="text-yellow-500 ml-2 h-4 w-4" />;
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-accent text-white";
    if (rank === 2) return "bg-gray-500 text-white";
    if (rank === 3) return "bg-orange-500 text-white";
    return "bg-gray-400 text-white";
  };

  const getPointsBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-primary/10 text-primary";
    if (rank === 2) return "bg-secondary/10 text-secondary";
    if (rank === 3) return "bg-orange-100 text-orange-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Medal className="text-accent mr-3" />
            Leaderboard
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
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
                      {getRankIcon(user.rank)}
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
          <span className="text-primary hover:text-blue-600 font-medium cursor-pointer">
            View All
          </span>
        </div>
      </div>
    </div>
  );
}
