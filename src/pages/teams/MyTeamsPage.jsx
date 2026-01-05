import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Trophy, 
  Crown, 
  Calendar,
  ArrowRight,
  Plus,
  UserPlus,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  LoadingScreen, 
  EmptyState,
  ErrorState,
  Input
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { getMyTeams, getMyJoinRequests, cancelJoinRequest, getRequestStatusDisplay } from '../../services/teamService';
import { formatDate, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function MyTeamsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [teams, setTeams] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [teamsResponse, requestsResponse] = await Promise.all([
        getMyTeams(),
        getMyJoinRequests()
      ]);
      setTeams(teamsResponse.teams || []);
      setJoinRequests(requestsResponse.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this join request?')) return;
    
    setCancellingId(requestId);
    try {
      await cancelJoinRequest(requestId);
      setJoinRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancellingId(null);
    }
  };

  // Filter teams by search
  const filteredTeams = teams.filter(team => 
    team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.hackathonId?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pending requests
  const pendingRequests = joinRequests.filter(r => r.status === 'pending');

  if (isLoading) {
    return <LoadingScreen message="Loading your teams..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Failed to load teams" 
        message={error}
        action={fetchData}
        actionLabel="Try Again"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage your hackathon teams and join requests
          </p>
        </div>
        <Button onClick={() => navigate('/hackathons')}>
          <Plus size={18} />
          Join a Hackathon
        </Button>
      </div>

      {/* Pending Join Requests Alert */}
      {pendingRequests.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <Clock size={18} />
              Pending Join Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div 
                key={request._id}
                className="flex items-center justify-between gap-4 p-3 bg-primary rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {request.teamId?.name || 'Team'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {request.teamId?.hackathonId?.title || 'Hackathon'}
                  </p>
                  {request.message && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      "{request.message}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-warning/10 text-warning">
                    <Clock size={12} className="mr-1" />
                    Pending
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelRequest(request._id)}
                    disabled={cancellingId === request._id}
                  >
                    {cancellingId === request._id ? 'Cancelling...' : 'Cancel'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {teams.length > 0 && (
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Teams List */}
      {filteredTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchQuery ? 'No teams found' : 'No teams yet'}
          description={
            searchQuery 
              ? 'Try a different search term'
              : "You haven't joined any teams yet. Browse hackathons to find one!"
          }
          action={!searchQuery ? () => navigate('/hackathons') : undefined}
          actionLabel={!searchQuery ? 'Browse Hackathons' : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <TeamCard key={team._id} team={team} userId={user?._id} />
          ))}
        </div>
      )}

      {/* Past Join Requests */}
      {joinRequests.filter(r => r.status !== 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Past Join Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {joinRequests
                .filter(r => r.status !== 'pending')
                .slice(0, 5)
                .map((request) => {
                  const statusInfo = getRequestStatusDisplay(request.status);
                  return (
                    <div 
                      key={request._id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {request.teamId?.name || 'Team'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                      <Badge className={statusInfo.color}>
                        {request.status === 'approved' && <CheckCircle size={12} className="mr-1" />}
                        {request.status === 'rejected' && <XCircle size={12} className="mr-1" />}
                        {statusInfo.label}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TeamCard({ team, userId }) {
  const isLeader = team.leaderId?._id === userId || team.leaderId === userId;
  const hackathon = team.hackathonId;
  const memberCount = team.members?.length || 0;

  return (
    <Link to={`/teams/${team._id}`}>
      <Card className="h-full hover:shadow-md hover:border-secondary/50 transition-all duration-300 group">
        <CardContent className="p-5">
          {/* Team Name & Role */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                <Users size={24} className="text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors line-clamp-1">
                  {team.name}
                </h3>
                {isLeader && (
                  <Badge className="bg-secondary text-white text-xs mt-1">
                    <Crown size={10} className="mr-1" />
                    Leader
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Hackathon Info */}
          {hackathon && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Trophy size={14} className="text-secondary shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {hackathon.title}
                </span>
              </div>
              {hackathon.startAt && hackathon.endAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Calendar size={12} />
                  <span>
                    {formatDate(hackathon.startAt)} - {formatDate(hackathon.endAt)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Members Count */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={14} />
              <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
            </div>
            <span className="text-sm font-medium text-secondary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              View <ArrowRight size={14} />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default MyTeamsPage;
