import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Trophy, 
  ArrowLeft,
  UserCheck,
  UserPlus,
  Shuffle,
  BarChart3,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Settings
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  LoadingScreen, 
  ErrorState,
  EmptyState,
  Alert,
  Input,
  Select
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { 
  getAssignments, 
  assignJudge,
  autoAssignJudges,
  updateJudgeTeams,
  removeJudgeAssignment,
  getWorkloadSummary,
  calculateAssignmentStats,
  getRoleDisplay
} from '../../services/assignmentService';
import { getHackathonById, getHackathonTeams } from '../../services/hackathonService';
import { cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function AssignmentManagementPage() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [hackathon, setHackathon] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedJudge, setSelectedJudge] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Permissions
  const isOrganizer = hackathon?.organizerId?.id === user?._id || hackathon?.organizerId === user?._id;
  const isAdmin = user?.role === 'admin';
  const canManage = isOrganizer || isAdmin;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hackathonData, assignmentsData, teamsData, workloadData] = await Promise.all([
        getHackathonById(hackathonId),
        getAssignments(hackathonId).catch(() => ({ assignments: [] })),
        getHackathonTeams(hackathonId).catch(() => ({ teams: [] })),
        getWorkloadSummary(hackathonId).catch(() => null)
      ]);
      
      setHackathon(hackathonData.hackathon);
      setAssignments(assignmentsData.assignments || []);
      setTeams(teamsData.teams || []);
      setWorkload(workloadData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignment data');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAutoAssign = async (judgesPerTeam = 2) => {
    if (!window.confirm(`Auto-assign judges with ${judgesPerTeam} judge(s) per team? This will reassign all judges.`)) {
      return;
    }
    
    setActionLoading('auto-assign');
    try {
      await autoAssignJudges(hackathonId, judgesPerTeam);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to auto-assign judges');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAssignment = async (judgeId, judgeName) => {
    if (!window.confirm(`Remove all assignments for ${judgeName}?`)) return;
    
    setActionLoading(`remove-${judgeId}`);
    try {
      await removeJudgeAssignment(hackathonId, judgeId);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove assignment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateTeams = async (judgeId, teamIds, action) => {
    setActionLoading(`update-${judgeId}`);
    try {
      await updateJudgeTeams(hackathonId, judgeId, teamIds, action);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update assignment');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading assignment data..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Failed to load assignments" 
        message={error}
        action={fetchData}
        actionLabel="Try Again"
      />
    );
  }

  if (!hackathon) {
    return (
      <ErrorState 
        title="Hackathon not found" 
        message="The hackathon you're looking for doesn't exist."
        action={() => navigate('/my/hackathons')}
        actionLabel="Back to My Hackathons"
      />
    );
  }

  if (!canManage) {
    return (
      <ErrorState 
        title="Access Denied" 
        message="You don't have permission to manage assignments for this hackathon."
        action={() => navigate(`/hackathons/${hackathonId}`)}
        actionLabel="View Hackathon"
      />
    );
  }

  const judges = hackathon.judges || [];
  const stats = calculateAssignmentStats(assignments, teams, judges);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'judges', label: 'By Judge', icon: UserCheck, count: judges.length },
    { id: 'teams', label: 'By Team', icon: Users, count: teams.length },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/hackathons/${hackathonId}`)}
        className="gap-2"
      >
        <ArrowLeft size={18} />
        Back to Hackathon
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Judge Assignments</h1>
          <p className="text-muted-foreground mt-1">
            Manage judge assignments for <span className="text-secondary">{hackathon.title}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw size={16} />
            Refresh
          </Button>
          <Link to={`/hackathons/${hackathonId}/judges`}>
            <Button variant="outline">
              <Users size={16} />
              Manage Judges
            </Button>
          </Link>
          <Button 
            onClick={() => setShowAssignModal(true)}
            disabled={judges.length === 0}
          >
            <UserPlus size={16} />
            Assign Judge
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {judges.length === 0 && (
        <Alert variant="warning">
          <AlertTriangle size={16} />
          <div className="flex items-center justify-between flex-1 flex-wrap gap-2">
            <span>No judges assigned to this hackathon yet.</span>
            <Link to={`/hackathons/${hackathonId}/judges`}>
              <Button size="sm" variant="outline">
                <UserPlus size={14} />
                Add Judges
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {teams.length === 0 && (
        <Alert variant="warning">
          <AlertTriangle size={16} />
          <span>No teams registered for this hackathon yet.</span>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Judges" 
          value={stats.totalJudges} 
          icon={UserCheck}
        />
        <StatCard 
          label="Total Teams" 
          value={stats.totalTeams} 
          icon={Users}
        />
        <StatCard 
          label="Teams Assigned" 
          value={stats.teamsAssigned}
          subtext={stats.teamsUnassigned > 0 ? `${stats.teamsUnassigned} unassigned` : 'All assigned'}
          variant={stats.teamsUnassigned > 0 ? 'warning' : 'success'}
          icon={CheckCircle}
        />
        <StatCard 
          label="Avg. Workload" 
          value={`${stats.avgWorkload} teams/judge`}
          icon={BarChart3}
        />
      </div>

      {/* Quick Actions */}
      {judges.length > 0 && teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shuffle size={18} className="text-secondary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="outline"
                onClick={() => handleAutoAssign(1)}
                disabled={actionLoading === 'auto-assign'}
              >
                {actionLoading === 'auto-assign' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shuffle size={16} />
                )}
                Auto-Assign (1 per team)
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleAutoAssign(2)}
                disabled={actionLoading === 'auto-assign'}
              >
                {actionLoading === 'auto-assign' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shuffle size={16} />
                )}
                Auto-Assign (2 per team)
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleAutoAssign(3)}
                disabled={actionLoading === 'auto-assign'}
              >
                {actionLoading === 'auto-assign' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Shuffle size={16} />
                )}
                Auto-Assign (3 per team)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  activeTab === tab.id ? 'bg-secondary text-white' : 'bg-muted'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          stats={stats}
          workload={workload}
          judges={judges}
          teams={teams}
        />
      )}

      {activeTab === 'judges' && (
        <JudgesTab 
          assignments={assignments}
          judges={judges}
          teams={teams}
          hackathonId={hackathonId}
          onRemove={handleRemoveAssignment}
          onUpdateTeams={handleUpdateTeams}
          actionLoading={actionLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {activeTab === 'teams' && (
        <TeamsTab 
          assignments={assignments}
          teams={teams}
          judges={judges}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {/* Assign Judge Modal */}
      {showAssignModal && (
        <AssignJudgeModal
          hackathonId={hackathonId}
          judges={judges}
          teams={teams}
          assignments={assignments}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ========== Sub Components ==========

function StatCard({ label, value, subtext, icon: Icon, variant }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {subtext && (
              <p className={cn(
                'text-xs mt-1',
                variant === 'warning' ? 'text-warning' : variant === 'success' ? 'text-success' : 'text-muted-foreground'
              )}>
                {subtext}
              </p>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-lg',
            variant === 'warning' ? 'bg-warning/10' : variant === 'success' ? 'bg-success/10' : 'bg-secondary/10'
          )}>
            <Icon size={20} className={cn(
              variant === 'warning' ? 'text-warning' : variant === 'success' ? 'text-success' : 'text-secondary'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewTab({ stats, workload, judges, teams }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Workload Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.judgeWorkload.length > 0 ? (
            <div className="space-y-3">
              {stats.judgeWorkload.map((item, index) => {
                const judge = item.judge;
                const percentage = stats.totalTeams > 0 ? (item.teamCount / stats.totalTeams) * 100 : 0;
                return (
                  <div key={judge?._id || index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{judge?.name || 'Unknown Judge'}</span>
                      <span className="text-muted-foreground">{item.teamCount} teams</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No assignments yet</p>
          )}
        </CardContent>
      </Card>

      {/* Unassigned Teams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Unassigned Teams</span>
            {stats.teamsUnassigned > 0 && (
              <Badge variant="outline" className="text-warning border-warning">
                {stats.teamsUnassigned}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.teamsUnassigned > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teams
                .filter(team => {
                  // Check if team has any assignment
                  const isAssigned = stats.judgeWorkload.some(jw => 
                    jw.teams.some(t => (t._id || t) === team._id)
                  );
                  return !isAssigned;
                })
                .map(team => (
                  <div 
                    key={team._id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                      <Users size={14} className="text-warning" />
                    </div>
                    <span className="text-sm font-medium">{team.name}</span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle size={32} className="mx-auto text-success mb-2" />
              <p className="text-success font-medium">All teams assigned!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function JudgesTab({ assignments, judges, teams, hackathonId, onRemove, onUpdateTeams, actionLoading, searchQuery, setSearchQuery }) {
  const [expandedJudge, setExpandedJudge] = useState(null);

  // Build assignment map by judge
  const judgeAssignments = {};
  assignments.forEach(a => {
    const judgeId = a.judgeId?._id || a.judgeId;
    if (!judgeAssignments[judgeId]) {
      judgeAssignments[judgeId] = {
        judge: a.judgeId,
        teams: [],
        role: a.role
      };
    }
    judgeAssignments[judgeId].teams.push(...(a.teamIds || []));
  });

  // Filter judges by search
  const filteredJudges = judges.filter(judge =>
    judge.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    judge.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search judges..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Judge List */}
      {filteredJudges.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No judges found"
          description={searchQuery ? "Try a different search term" : "No judges assigned to this hackathon yet"}
        />
      ) : (
        <div className="space-y-3">
          {filteredJudges.map(judge => {
            const assignment = judgeAssignments[judge._id];
            const assignedTeams = assignment?.teams || [];
            const isExpanded = expandedJudge === judge._id;

            return (
              <Card key={judge._id}>
                <CardContent className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedJudge(isExpanded ? null : judge._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                        <UserCheck size={18} className="text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{judge.name}</p>
                        <p className="text-sm text-muted-foreground">{judge.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {assignedTeams.length} team{assignedTeams.length !== 1 ? 's' : ''}
                      </Badge>
                      {assignment?.role && (
                        <Badge className={getRoleDisplay(assignment.role).color}>
                          {getRoleDisplay(assignment.role).label}
                        </Badge>
                      )}
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground">Assigned Teams</p>
                        {assignedTeams.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(judge._id, judge.name)}
                            disabled={actionLoading === `remove-${judge._id}`}
                            className="text-error hover:text-error"
                          >
                            <Trash2 size={14} />
                            Remove All
                          </Button>
                        )}
                      </div>
                      {assignedTeams.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {assignedTeams.map(team => {
                            const teamData = typeof team === 'object' ? team : teams.find(t => t._id === team);
                            return (
                              <div 
                                key={teamData?._id || team}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                              >
                                <div className="flex items-center gap-2">
                                  <Users size={14} className="text-muted-foreground" />
                                  <span className="text-sm">{teamData?.name || 'Unknown Team'}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onUpdateTeams(judge._id, [teamData?._id || team], 'remove')}
                                  disabled={actionLoading === `update-${judge._id}`}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-error"
                                >
                                  <Minus size={14} />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No teams assigned
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamsTab({ assignments, teams, judges, searchQuery, setSearchQuery }) {
  // Build assignment map by team
  const teamAssignments = {};
  assignments.forEach(a => {
    (a.teamIds || []).forEach(team => {
      const teamId = team._id || team;
      if (!teamAssignments[teamId]) {
        teamAssignments[teamId] = [];
      }
      teamAssignments[teamId].push({
        judge: a.judgeId,
        role: a.role
      });
    });
  });

  // Filter teams by search
  const filteredTeams = teams.filter(team =>
    team.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
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

      {/* Team List */}
      {filteredTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams found"
          description={searchQuery ? "Try a different search term" : "No teams registered for this hackathon yet"}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredTeams.map(team => {
            const assignedJudges = teamAssignments[team._id] || [];
            const hasAssignment = assignedJudges.length > 0;

            return (
              <Card key={team._id} className={cn(!hasAssignment && 'border-warning/50')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        hasAssignment ? 'bg-success/10' : 'bg-warning/10'
                      )}>
                        <Users size={18} className={hasAssignment ? 'text-success' : 'text-warning'} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{team.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {hasAssignment ? (
                      <Badge className="bg-success/10 text-success">
                        <CheckCircle size={12} className="mr-1" />
                        Assigned
                      </Badge>
                    ) : (
                      <Badge className="bg-warning/10 text-warning">
                        <AlertCircle size={12} className="mr-1" />
                        Unassigned
                      </Badge>
                    )}
                  </div>

                  {hasAssignment && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Assigned Judges:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignedJudges.map((aj, idx) => (
                          <Badge key={idx} variant="outline" className="gap-1">
                            <UserCheck size={12} />
                            {aj.judge?.name || 'Unknown'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssignJudgeModal({ hackathonId, judges, teams, assignments, onClose, onSuccess }) {
  const [selectedJudge, setSelectedJudge] = useState('');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [role, setRole] = useState('primary');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get already assigned teams for selected judge
  const getAssignedTeamsForJudge = (judgeId) => {
    const assigned = new Set();
    assignments.forEach(a => {
      if ((a.judgeId?._id || a.judgeId) === judgeId) {
        (a.teamIds || []).forEach(t => assigned.add(t._id || t));
      }
    });
    return assigned;
  };

  const assignedTeams = selectedJudge ? getAssignedTeamsForJudge(selectedJudge) : new Set();
  const availableTeams = teams.filter(t => !assignedTeams.has(t._id));

  const handleSubmit = async () => {
    if (!selectedJudge || selectedTeams.length === 0) {
      setError('Please select a judge and at least one team');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await assignJudge(hackathonId, {
        judgeId: selectedJudge,
        teamIds: selectedTeams,
        role
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign judge');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTeam = (teamId) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus size={20} className="text-secondary" />
            Assign Judge to Teams
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {error && (
            <Alert variant="error">
              <AlertCircle size={16} />
              {error}
            </Alert>
          )}

          {/* Select Judge */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Judge</label>
            <Select
              value={selectedJudge}
              onChange={(e) => {
                setSelectedJudge(e.target.value);
                setSelectedTeams([]);
              }}
            >
              <option value="">Choose a judge...</option>
              {judges.map(judge => (
                <option key={judge._id} value={judge._id}>
                  {judge.name} ({judge.email})
                </option>
              ))}
            </Select>
          </div>

          {/* Select Role */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Assignment Role</label>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="primary">Primary Judge</option>
              <option value="secondary">Secondary Judge</option>
              <option value="backup">Backup Judge</option>
            </Select>
          </div>

          {/* Select Teams */}
          {selectedJudge && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select Teams</label>
                <span className="text-xs text-muted-foreground">
                  {selectedTeams.length} selected
                </span>
              </div>
              {availableTeams.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                  {availableTeams.map(team => (
                    <button
                      key={team._id}
                      onClick={() => toggleTeam(team._id)}
                      className={cn(
                        'w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors',
                        selectedTeams.includes(team._id)
                          ? 'bg-secondary/10 border border-secondary'
                          : 'hover:bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-muted-foreground" />
                        <span className="text-sm">{team.name}</span>
                      </div>
                      {selectedTeams.includes(team._id) && (
                        <CheckCircle size={16} className="text-secondary" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All teams are already assigned to this judge
                </p>
              )}
            </div>
          )}
        </CardContent>

        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || !selectedJudge || selectedTeams.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Assign
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default AssignmentManagementPage;
