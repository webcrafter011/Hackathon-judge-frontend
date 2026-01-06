import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  Search,
  CheckCircle,
  XCircle,
  Mail,
  Shield,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  Input,
  LoadingScreen, 
  ErrorState,
  EmptyState,
  Alert
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { getHackathonById, assignJudges } from '../../services/hackathonService';
import { getUsers, getRoleDisplay } from '../../services/userService';
import { cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function JudgeManagementPage() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [hackathon, setHackathon] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  
  // Selected judges (IDs)
  const [selectedJudges, setSelectedJudges] = useState([]);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, judge, organizer, participant

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hackathonData, usersData] = await Promise.all([
        getHackathonById(hackathonId),
        getUsers({ limit: 100 })
      ]);
      
      setHackathon(hackathonData.hackathon);
      setAllUsers(usersData.users || []);
      
      // Initialize selected judges from hackathon data
      const currentJudges = hackathonData.hackathon.judges || [];
      setSelectedJudges(currentJudges.map(j => j._id || j));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Permissions - handle multiple ID formats
  const userId = user?.id || user?._id;
  const getOrgId = () => {
    const org = hackathon?.organizerId || hackathon?.organizer;
    if (!org) return null;
    if (typeof org === 'string') return org;
    return org.id || org._id;
  };
  const organizerId = getOrgId();
  const isOrganizer = !!(organizerId && userId && String(organizerId) === String(userId));
  const isAdmin = user?.role === 'admin';
  const canManage = isOrganizer || isAdmin;

  // Filter users
  const filteredUsers = allUsers.filter(u => {
    // Don't show the organizer themselves
    if (u._id === (hackathon?.organizerId?._id || hackathon?.organizerId)) return false;
    
    // Search filter
    const matchesSearch = !searchQuery || 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Role filter
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Toggle judge selection
  const toggleJudge = (userId) => {
    setSelectedJudges(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Save judges
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      await assignJudges(hackathonId, selectedJudges);
      setSaveMessage({ type: 'success', text: 'Judges updated successfully!' });
      
      // Refresh hackathon data
      const hackathonData = await getHackathonById(hackathonId);
      setHackathon(hackathonData.hackathon);
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update judges' });
    } finally {
      setIsSaving(false);
    }
  };

  // Get current judges (full user objects)
  const currentJudges = allUsers.filter(u => selectedJudges.includes(u._id));
  const availableUsers = filteredUsers.filter(u => !selectedJudges.includes(u._id));

  if (isLoading) {
    return <LoadingScreen message="Loading judge management..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Failed to load" 
        description={error}
        onRetry={fetchData}
      />
    );
  }

  if (!canManage) {
    return (
      <ErrorState 
        title="Access Denied" 
        description="You don't have permission to manage judges for this hackathon."
        onRetry={() => navigate(`/hackathons/${hackathonId}`)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/hackathons/${hackathonId}/assignments`)}
        className="gap-2"
      >
        <ArrowLeft size={18} />
        Back to Assignments
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Judges</h1>
          <p className="text-muted-foreground mt-1">
            {hackathon?.title || 'Hackathon'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-secondary/10 text-secondary">
            <Users size={14} className="mr-1" />
            {selectedJudges.length} judges selected
          </Badge>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {saveMessage && (
        <Alert variant={saveMessage.type === 'error' ? 'error' : 'success'}>
          <span>{saveMessage.text}</span>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current Judges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Judges ({currentJudges.length})</span>
              {currentJudges.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedJudges([])}
                  className="text-error hover:text-error"
                >
                  Remove All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentJudges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p>No judges assigned yet</p>
                <p className="text-sm">Select users from the right panel</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {currentJudges.map((judge) => {
                  const roleConfig = getRoleDisplay(judge.role);
                  return (
                    <div
                      key={judge._id}
                      className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg border border-secondary/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                          <span className="font-medium text-secondary">
                            {judge.name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{judge.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail size={12} />
                            {judge.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleConfig.color} variant="outline">
                          {roleConfig.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleJudge(judge._id)}
                          className="text-error hover:text-error hover:bg-error/10"
                        >
                          <UserMinus size={18} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Users */}
        <Card>
          <CardHeader>
            <CardTitle>Add Judges</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 mt-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-primary text-foreground text-sm"
              >
                <option value="all">All Roles</option>
                <option value="judge">Judges Only</option>
                <option value="organizer">Organizers</option>
                <option value="participant">Participants</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {availableUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p>No users found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {availableUsers.map((u) => {
                  const roleConfig = getRoleDisplay(u.role);
                  return (
                    <div
                      key={u._id}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg border border-border transition-colors cursor-pointer"
                      onClick={() => toggleJudge(u._id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="font-medium text-muted-foreground">
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail size={12} />
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleConfig.color} variant="outline">
                          {roleConfig.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-success hover:text-success hover:bg-success/10"
                        >
                          <UserPlus size={18} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Alert>
        <Shield size={16} />
        <div>
          <p className="font-medium">About Judge Assignment</p>
          <p className="text-sm text-muted-foreground mt-1">
            Judges assigned here will have access to evaluate submissions for this hackathon. 
            After adding judges, you can assign them to specific teams in the Assignment Management page.
          </p>
        </div>
      </Alert>
    </div>
  );
}

export default JudgeManagementPage;
