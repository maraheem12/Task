import { History, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function PointsHistory() {
  const { data: history, isLoading } = useQuery({
    queryKey: ["/api/history"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
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
      "bg-primary",
      "bg-secondary", 
      "bg-orange-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-green-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-blue-500"
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getPointsBadgeColor = (points) => {
    if (points >= 8) return "bg-secondary/10 text-secondary";
    if (points >= 5) return "bg-accent/10 text-accent";
    return "bg-primary/10 text-primary";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <History className="text-gray-600 mr-3" />
          Recent Claims History
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
        
        {history && history.length > 10 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              Load More History
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
