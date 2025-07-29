import { Trophy, BarChart3, TrendingUp } from "lucide-react";
import UserSelection from "@/components/user-selection";
import AddUserForm from "@/components/add-user-form";
import LeaderboardTable from "@/components/leaderboard-table";
import PointsHistory from "@/components/points-history";
import { useQuery } from "@tanstack/react-query";

export default function Leaderboard() {
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
              <Trophy className="text-accent text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Leaderboard System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Real-time Rankings</span>
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
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
                <BarChart3 className="text-accent mr-2" />
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {stats?.totalUsers || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="text-center p-3 bg-secondary/5 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">
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
