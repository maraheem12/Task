import { useState } from "react";
import { UserCheck, Gift, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function UserSelection() {
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
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      // Hide the result after 3 seconds
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

  const selectedUser = users?.find(user => user.id === selectedUserId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <UserCheck className="text-primary mr-2" />
        Select User
      </h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Choose User
          </label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a user..." />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  Loading users...
                </SelectItem>
              ) : (
                users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.totalPoints} pts)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleClaimPoints}
          disabled={!selectedUserId || claimPointsMutation.isPending}
          className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-3 px-4"
        >
          <Gift className="mr-2 h-4 w-4" />
          {claimPointsMutation.isPending ? "Claiming..." : "Claim Random Points"}
        </Button>
        
        {lastClaimedPoints !== null && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
            <div className="flex items-center text-secondary">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>+{lastClaimedPoints} points awarded!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
