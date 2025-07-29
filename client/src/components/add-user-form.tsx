import { useState } from "react";
import { UserPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AddUserForm() {
  const [newUserName, setNewUserName] = useState("");
  const { toast } = useToast();

  const addUserMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/users", { name });
      return response.json();
    },
    onSuccess: () => {
      setNewUserName("");
      toast({
        title: "User Added!",
        description: "New user has been added successfully.",
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: any) => {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddUser();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <UserPlus className="text-secondary mr-2" />
        Add New User
      </h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="newUserName" className="block text-sm font-medium text-gray-700 mb-2">
            User Name
          </Label>
          <Input
            id="newUserName"
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter user name..."
            className="w-full"
          />
        </div>
        
        <Button 
          onClick={handleAddUser}
          disabled={addUserMutation.isPending}
          className="w-full bg-secondary hover:bg-emerald-600 text-white font-medium py-2.5 px-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          {addUserMutation.isPending ? "Adding..." : "Add User"}
        </Button>
      </div>
    </div>
  );
}
