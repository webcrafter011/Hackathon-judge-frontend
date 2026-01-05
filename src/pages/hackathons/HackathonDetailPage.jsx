import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Trophy, 
  Clock,
  ArrowLeft,
  Share2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Gift,
  FileText,
  UserPlus,
  Edit,
  Settings,
  ChevronRight,
  Mail,
  Send,
  Loader2,
  BarChart3,
  Trash2
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  LoadingScreen,
  ErrorState,
  Alert,
  Textarea
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { getHackathonById, getStatusConfig, getHackathonTeams, deleteHackathon } from '../../services/hackathonService';
import { requestToJoinTeam, isTeamMember } from '../../services/teamService';
import { formatDate, formatDateTime, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function HackathonDetailPage() {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleting, setIsDeleting] = useState(false);

  // Get user ID - auth returns 'id' not '_id'
  const userId = user?.id || user?._id;
  
  // Check if current user is the organizer of this hackathon
  // Try multiple ways to extract organizer ID since backend may populate differently
  const getOrgId = () => {
    const org = hackathon?.organizerId || hackathon?.organizer;
    if (!org) return null;
    if (typeof org === 'string') return org;
    return org.id || org._id;
  };
  const organizerId = getOrgId();
  
  // Compare as strings to handle ObjectId inconsistencies
  const isHackathonOwner = !!(organizerId && userId && String(organizerId) === String(userId));
  const isAdmin = user?.role === 'admin';
  const isOrganizerRole = user?.role === 'organizer';
  
  // Organizer can edit their OWN hackathons, admin can edit ANY hackathon
  const canEdit = isOrganizerRole || isHackathonOwner || isAdmin;
    
  const isJudge = hackathon?.judges?.some(j => {
    const judgeId = typeof j === 'string' ? j : (j.id || j._id);
    return String(judgeId) === String(userId);
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getHackathonById(idOrSlug);
        setHackathon(data.hackathon);
        
        // Fetch teams
        if (data.hackathon?._id) {
          try {
            const teamsData = await getHackathonTeams(data.hackathon._id);
            setTeams(teamsData.teams || []);
          } catch (e) {
            // Teams might not be accessible
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load hackathon');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [idOrSlug]);

  if (isLoading) {
    return <LoadingScreen message="Loading hackathon details..." />;
  }

  if (error || !hackathon) {
    return (
      <ErrorState 
        title="Hackathon not found"
        description={error || "The hackathon you're looking for doesn't exist or has been removed."}
        onRetry={() => navigate('/hackathons')}
      />
    );
  }

  const statusConfig = getStatusConfig(hackathon.status);

  const formatDateRange = (start, end) => {
    const startDate = formatDate(start, { month: 'long', day: 'numeric', year: 'numeric' });
    const endDate = formatDate(end, { month: 'long', day: 'numeric', year: 'numeric' });
    return `${startDate} - ${endDate}`;
  };

  const getTimeStatus = () => {
    const now = new Date();
    const start = new Date(hackathon.startAt);
    const end = new Date(hackathon.endAt);
    const deadline = hackathon.submissionDeadline ? new Date(hackathon.submissionDeadline) : end;

    if (hackathon.status === 'draft') {
      return { text: 'Not yet published', color: 'text-muted-foreground' };
    }
    if (now < start) {
      const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      return { text: `Starts in ${diff} days`, color: 'text-info' };
    }
    if (now >= start && now <= end) {
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return { text: `${diff} days remaining`, color: 'text-success' };
    }
    return { text: 'Event ended', color: 'text-muted-foreground' };
  };

  const timeStatus = getTimeStatus();

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'rules', label: 'Rules' },
    { id: 'prizes', label: 'Prizes' },
    { id: 'teams', label: `Teams (${teams.length})` },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/hackathons')}
        className="gap-2"
      >
        <ArrowLeft size={18} />
        Back to Hackathons
      </Button>

      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden">
        {/* Banner */}
        <div className="h-48 sm:h-64 bg-gradient-to-br from-secondary to-secondary/70">
          {hackathon.bannerUrl && (
            <img 
              src={hackathon.bannerUrl} 
              alt={hackathon.title}
              className="w-full h-full object-cover opacity-50"
            />
          )}
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full p-4 sm:p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={cn(statusConfig.color, 'text-sm')}>
                {statusConfig.icon} {statusConfig.label}
              </Badge>
              {hackathon.visibility && (
                <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                  {hackathon.visibility}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
              {hackathon.title}
            </h1>
            <p className={cn('text-lg font-medium', timeStatus.color)}>
              <Clock size={18} className="inline mr-1" />
              {timeStatus.text}
            </p>
          </div>
        </div>

        {/* Edit Button */}
        {canEdit && (
          <div className="absolute top-4 right-4">
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/hackathons/${hackathon._id}/edit`)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
            >
              <Edit size={16} />
              Edit
            </Button>
          </div>
        )}
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InfoCard
          icon={Calendar}
          label="Duration"
          value={formatDateRange(hackathon.startAt, hackathon.endAt)}
        />
        <InfoCard
          icon={Users}
          label="Teams"
          value={`${teams.length} registered`}
        />
        <InfoCard
          icon={Trophy}
          label="Prize Pool"
          value={hackathon.prizes?.[0]?.value || 'TBA'}
        />
        <InfoCard
          icon={UserPlus}
          label="Team Size"
          value={hackathon.teamConstraints 
            ? `${hackathon.teamConstraints.minSize}-${hackathon.teamConstraints.maxSize} members`
            : 'Any size'
          }
        />
      </div>

      {/* Action Buttons */}
      {isAuthenticated && hackathon.status === 'open' && (
        <Card className="p-4 bg-secondary/5 border-secondary/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Ready to participate?</h3>
              <p className="text-sm text-muted-foreground">Join or create a team to get started</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('teams')}
              >
                <Users size={18} />
                Browse Teams
              </Button>
              <Button onClick={() => navigate(`/teams/create?hackathon=${hackathon._id}`)}>
                <UserPlus size={18} />
                Create Team
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Organizer/Admin Actions */}
      {canEdit && (
        <Card className="p-4 bg-muted/50 border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Organizer Tools</h3>
              <p className="text-sm text-muted-foreground">Manage this hackathon</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate(`/hackathons/${hackathon._id}/judges`)}
              >
                <Users size={18} />
                Manage Judges
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(`/hackathons/${hackathon._id}/criteria`)}
              >
                <Settings size={18} />
                Set Criteria
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(`/hackathons/${hackathon._id}/submissions`)}
              >
                <FileText size={18} />
                View Submissions
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(`/hackathons/${hackathon._id}/assignments`)}
              >
                <BarChart3 size={18} />
                Manage Assignments
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate(`/hackathons/${hackathon._id}/edit`)}
              >
                <Edit size={18} />
                Edit Hackathon
              </Button>
              <Button 
                variant="outline"
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete "${hackathon.title}"? This action cannot be undone.`)) {
                    setIsDeleting(true);
                    try {
                      await deleteHackathon(hackathon._id);
                      navigate('/my/hackathons', { replace: true });
                    } catch (err) {
                      alert(err.response?.data?.message || 'Failed to delete hackathon');
                      setIsDeleting(false);
                    }
                  }
                }}
                disabled={isDeleting}
                className="text-error hover:text-error hover:bg-error/10 border-error/30"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Judge Quick Access */}
      {isJudge && !canEdit && (
        <Card className="p-4 bg-info/5 border-info/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">You're a judge for this hackathon</h3>
              <p className="text-sm text-muted-foreground">View your assigned teams and evaluations</p>
            </div>
            <Button 
              onClick={() => navigate('/my/evaluations')}
            >
              <BarChart3 size={18} />
              My Evaluations
            </Button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <Card>
              <CardHeader>
                <CardTitle>About this Hackathon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  {hackathon.description || 'No description provided.'}
                </div>
                
                {/* Tags */}
                {hackathon.tags && hackathon.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="text-sm font-medium text-foreground mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {hackathon.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'rules' && (
            <Card>
              <CardHeader>
                <CardTitle>Rules & Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                {hackathon.rules ? (
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {hackathon.rules}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No rules have been specified yet.</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'prizes' && (
            <Card>
              <CardHeader>
                <CardTitle>Prizes</CardTitle>
              </CardHeader>
              <CardContent>
                {hackathon.prizes && hackathon.prizes.length > 0 ? (
                  <div className="space-y-4">
                    {hackathon.prizes.map((prize, index) => (
                      <div 
                        key={index}
                        className={cn(
                          'p-4 rounded-lg border',
                          index === 0 && 'border-yellow-400 bg-yellow-50',
                          index === 1 && 'border-gray-400 bg-gray-50',
                          index === 2 && 'border-amber-600 bg-amber-50',
                          index > 2 && 'border-border'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                              index === 0 && 'bg-yellow-400 text-yellow-900',
                              index === 1 && 'bg-gray-400 text-gray-900',
                              index === 2 && 'bg-amber-600 text-amber-100',
                              index > 2 && 'bg-muted text-muted-foreground'
                            )}>
                              {prize.rank || index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{prize.title}</h4>
                              {prize.description && (
                                <p className="text-sm text-muted-foreground">{prize.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-xl font-bold text-secondary">
                            {prize.value}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Prize details coming soon.</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'teams' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Participating Teams</CardTitle>
                {hackathon.status === 'open' && (
                  <Button size="sm" onClick={() => navigate(`/teams/create?hackathon=${hackathon._id}`)}>
                    <UserPlus size={16} />
                    Create Team
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {teams.length > 0 ? (
                  <div className="space-y-3">
                    {teams.map((team) => (
                      <TeamCard key={team._id} team={team} hackathonId={hackathon._id} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No teams registered yet.</p>
                    {hackathon.status === 'open' && (
                      <Button 
                        variant="outline" 
                        className="mt-3"
                        onClick={() => navigate(`/teams/create?hackathon=${hackathon._id}`)}
                      >
                        Be the first to create a team
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DateItem
                label="Start Date"
                date={hackathon.startAt}
                icon={Calendar}
              />
              <DateItem
                label="End Date"
                date={hackathon.endAt}
                icon={Calendar}
              />
              {hackathon.submissionDeadline && (
                <DateItem
                  label="Submission Deadline"
                  date={hackathon.submissionDeadline}
                  icon={FileText}
                  highlight
                />
              )}
            </CardContent>
          </Card>

          {/* Organizer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Users size={18} className="text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {hackathon.organizerId?.name || 'Unknown'}
                  </p>
                  {hackathon.contactEmail && (
                    <a 
                      href={`mailto:${hackathon.contactEmail}`}
                      className="text-sm text-secondary hover:underline flex items-center gap-1"
                    >
                      <Mail size={12} />
                      Contact
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Share</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  // Could add toast notification here
                }}
              >
                <Share2 size={16} />
                Copy Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InfoCard({ icon: Icon, label, value }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-secondary/10 rounded-lg">
          <Icon size={18} className="text-secondary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-medium text-foreground truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function DateItem({ label, date, icon: Icon, highlight }) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg',
      highlight ? 'bg-secondary/10' : 'bg-muted/50'
    )}>
      <Icon size={18} className={highlight ? 'text-secondary' : 'text-muted-foreground'} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('font-medium', highlight ? 'text-secondary' : 'text-foreground')}>
          {formatDateTime(date)}
        </p>
      </div>
    </div>
  );
}

function TeamCard({ team, hackathonId }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState(null); // 'success', 'error', or null

  const isMember = user && isTeamMember(team, user._id);
  const memberCount = team.members?.length || 0;
  const maxSize = team.hackathonId?.teamConstraints?.maxSize;
  const isFull = maxSize && memberCount >= maxSize;

  const handleJoinRequest = async () => {
    setIsJoining(true);
    try {
      await requestToJoinTeam(team._id, joinMessage);
      setJoinStatus('success');
      setShowJoinModal(false);
      setJoinMessage('');
    } catch (err) {
      setJoinStatus('error');
      alert(err.response?.data?.message || 'Failed to send join request');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-secondary/50 hover:bg-muted/50 transition-colors">
        <Link 
          to={`/teams/${team._id}`}
          className="flex items-center gap-3 flex-1"
        >
          <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
            <Users size={18} className="text-secondary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{team.name}</h4>
            <p className="text-sm text-muted-foreground">
              {memberCount} member{memberCount !== 1 ? 's' : ''}
              {maxSize && ` / ${maxSize}`}
            </p>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          {isMember ? (
            <Badge className="bg-success/10 text-success">
              <CheckCircle size={12} className="mr-1" />
              Joined
            </Badge>
          ) : joinStatus === 'success' ? (
            <Badge className="bg-info/10 text-info">
              <Clock size={12} className="mr-1" />
              Requested
            </Badge>
          ) : isFull ? (
            <Badge variant="outline" className="text-muted-foreground">Full</Badge>
          ) : isAuthenticated && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                setShowJoinModal(true);
              }}
            >
              <UserPlus size={14} />
              Join
            </Button>
          )}
          <Link to={`/teams/${team._id}`}>
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Join Request Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowJoinModal(false)} />
          <Card className="relative z-10 w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus size={18} className="text-secondary" />
                Request to Join {team.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send a message to the team leader explaining why you'd like to join.
              </p>
              <Textarea
                placeholder="Hi! I'd love to join your team because..."
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowJoinModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleJoinRequest} disabled={isJoining}>
                  {isJoining ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Request
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default HackathonDetailPage;
