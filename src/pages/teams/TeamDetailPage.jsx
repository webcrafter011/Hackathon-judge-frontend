import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Trophy, 
  Crown, 
  Mail, 
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  UserMinus,
  UserPlus,
  LogOut,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  LoadingScreen, 
  ErrorState,
  Alert,
  Input,
  Textarea
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { 
  getTeamById, 
  updateTeam,
  deleteTeam,
  leaveTeam, 
  removeMember, 
  transferLeadership,
  getTeamJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  isTeamLeader,
  isTeamMember,
  getMemberRoleDisplay,
  getRequestStatusDisplay
} from '../../services/teamService';
import { formatDate, formatDateTime, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function TeamDetailPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [team, setTeam] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('members');
  
  // Action states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', contactEmail: '' });
  const [actionLoading, setActionLoading] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const isLeader = isTeamLeader(team, user?._id);
  const isMember = isTeamMember(team, user?._id);
  const isAdmin = user?.role === 'admin';
  const canManage = isLeader || isAdmin;

  const fetchTeam = useCallback(async () => {
    try {
      const data = await getTeamById(teamId);
      setTeam(data.team);
      setEditForm({
        name: data.team.name || '',
        contactEmail: data.team.contactEmail || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load team');
    }
  }, [teamId]);

  const fetchJoinRequests = useCallback(async () => {
    if (!canManage) return;
    try {
      const data = await getTeamJoinRequests(teamId, 'pending');
      setJoinRequests(data.requests || []);
    } catch (err) {
      // Silently fail - user might not have permission
    }
  }, [teamId, canManage]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchTeam();
      setIsLoading(false);
    };
    loadData();
  }, [fetchTeam]);

  useEffect(() => {
    if (team && canManage) {
      fetchJoinRequests();
    }
  }, [team, canManage, fetchJoinRequests]);

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    setActionLoading('update');
    try {
      const data = await updateTeam(teamId, editForm);
      setTeam(data.team);
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update team');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }
    setActionLoading('delete');
    try {
      await deleteTeam(teamId);
      navigate('/my/teams', { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete team');
      setActionLoading(null);
    }
  };

  const handleLeaveTeam = async () => {
    const message = isLeader 
      ? 'As the leader, leaving will transfer leadership to another member or delete the team if you are the only member. Continue?'
      : 'Are you sure you want to leave this team?';
    
    if (!window.confirm(message)) return;
    
    setActionLoading('leave');
    try {
      await leaveTeam(teamId);
      navigate('/my/teams', { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave team');
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the team?`)) return;
    
    setActionLoading(`remove-${memberId}`);
    try {
      await removeMember(teamId, memberId);
      await fetchTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferLeadership = async (newLeaderId) => {
    setActionLoading('transfer');
    try {
      await transferLeadership(teamId, newLeaderId);
      await fetchTeam();
      setShowTransferModal(false);
      setSelectedMember(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to transfer leadership');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveRequest = async (requestId) => {
    setActionLoading(`approve-${requestId}`);
    try {
      await approveJoinRequest(teamId, requestId);
      setJoinRequests(prev => prev.filter(r => r._id !== requestId));
      await fetchTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setActionLoading(`reject-${requestId}`);
    try {
      await rejectJoinRequest(teamId, requestId);
      setJoinRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading team details..." />;
  }

  if (error || !team) {
    return (
      <ErrorState 
        title="Team not found" 
        message={error || "The team you're looking for doesn't exist."}
        action={() => navigate('/my/teams')}
        actionLabel="Back to My Teams"
      />
    );
  }

  const hackathon = team.hackathonId;
  const members = team.members || [];
  const leaderId = team.leaderId?._id || team.leaderId;

  const tabs = [
    { id: 'members', label: 'Members', count: members.length },
    ...(canManage ? [{ id: 'requests', label: 'Join Requests', count: joinRequests.length }] : []),
    ...(canManage ? [{ id: 'settings', label: 'Settings' }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/my/teams')}
        className="gap-2"
      >
        <ArrowLeft size={18} />
        Back to My Teams
      </Button>

      {/* Team Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                <Users size={32} className="text-secondary" />
              </div>
              <div>
                {isEditing ? (
                  <form onSubmit={handleUpdateTeam} className="space-y-3">
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Team name"
                      required
                      className="font-semibold text-xl"
                    />
                    <Input
                      type="email"
                      value={editForm.contactEmail}
                      onChange={(e) => setEditForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      placeholder="Contact email"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={actionLoading === 'update'}>
                        {actionLoading === 'update' ? 'Saving...' : 'Save'}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
                    {team.contactEmail && (
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Mail size={14} />
                        <a href={`mailto:${team.contactEmail}`} className="hover:text-secondary">
                          {team.contactEmail}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-secondary/10 text-secondary">
                        <Users size={12} className="mr-1" />
                        {members.length} member{members.length !== 1 ? 's' : ''}
                      </Badge>
                      {isLeader && (
                        <Badge className="bg-secondary text-white">
                          <Crown size={12} className="mr-1" />
                          You're the Leader
                        </Badge>
                      )}
                      {isMember && !isLeader && (
                        <Badge variant="outline">Team Member</Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isEditing && (
              <div className="flex flex-wrap gap-2">
                {canManage && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit size={16} />
                    Edit
                  </Button>
                )}
                {isMember && (
                  <Button 
                    variant="outline" 
                    onClick={handleLeaveTeam}
                    disabled={actionLoading === 'leave'}
                  >
                    <LogOut size={16} />
                    {actionLoading === 'leave' ? 'Leaving...' : 'Leave Team'}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Hackathon Info */}
          {hackathon && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <Link 
                to={`/hackathons/${hackathon._id}`}
                className="flex items-center gap-3 hover:text-secondary transition-colors"
              >
                <Trophy size={20} className="text-secondary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{hackathon.title}</p>
                  {hackathon.startAt && hackathon.endAt && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar size={12} />
                      {formatDate(hackathon.startAt)} - {formatDate(hackathon.endAt)}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'ml-2 px-2 py-0.5 rounded-full text-xs',
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
      {activeTab === 'members' && (
        <MembersTab 
          members={members}
          leaderId={leaderId}
          currentUserId={user?._id}
          canManage={canManage}
          onRemoveMember={handleRemoveMember}
          onTransferLeadership={() => setShowTransferModal(true)}
          actionLoading={actionLoading}
        />
      )}

      {activeTab === 'requests' && canManage && (
        <JoinRequestsTab 
          requests={joinRequests}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          actionLoading={actionLoading}
          teamConstraints={hackathon?.teamConstraints}
          currentMemberCount={members.length}
        />
      )}

      {activeTab === 'settings' && canManage && (
        <SettingsTab 
          team={team}
          onDelete={handleDeleteTeam}
          actionLoading={actionLoading}
          isLeader={isLeader}
          isAdmin={isAdmin}
        />
      )}

      {/* Transfer Leadership Modal */}
      {showTransferModal && (
        <TransferLeadershipModal
          members={members}
          leaderId={leaderId}
          onTransfer={handleTransferLeadership}
          onClose={() => setShowTransferModal(false)}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}

function MembersTab({ members, leaderId, currentUserId, canManage, onRemoveMember, onTransferLeadership, actionLoading }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team Members</CardTitle>
        {canManage && members.length > 1 && (
          <Button variant="outline" size="sm" onClick={onTransferLeadership}>
            <Crown size={14} />
            Transfer Leadership
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => {
            const memberUser = member.userId || member;
            const memberId = memberUser._id || memberUser;
            const memberIsLeader = memberId === leaderId;
            const isCurrentUser = memberId === currentUserId;

            return (
              <div 
                key={memberId}
                className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    {memberIsLeader ? (
                      <Crown size={18} className="text-secondary" />
                    ) : (
                      <Users size={18} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {memberUser.name || 'Unknown'}
                      {isCurrentUser && <span className="text-muted-foreground ml-2">(You)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{memberUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {memberIsLeader ? (
                    <Badge className="bg-secondary text-white">
                      <Crown size={10} className="mr-1" />
                      Leader
                    </Badge>
                  ) : (
                    <Badge variant="outline">Member</Badge>
                  )}
                  {canManage && !memberIsLeader && !isCurrentUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveMember(memberId, memberUser.name)}
                      disabled={actionLoading === `remove-${memberId}`}
                      className="text-error hover:text-error"
                    >
                      <UserMinus size={16} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function JoinRequestsTab({ requests, onApprove, onReject, actionLoading, teamConstraints, currentMemberCount }) {
  const maxSize = teamConstraints?.maxSize;
  const isFull = maxSize && currentMemberCount >= maxSize;

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <UserPlus size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No pending join requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isFull && (
        <Alert variant="warning">
          <AlertTriangle size={16} />
          <span>Team is full ({currentMemberCount}/{maxSize} members). You cannot approve more requests.</span>
        </Alert>
      )}
      
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {requests.map((request) => {
              const requestUser = request.userId;
              return (
                <div key={request._id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                        <Users size={18} className="text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{requestUser?.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{requestUser?.email}</p>
                        {request.message && (
                          <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                            "{request.message}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock size={12} />
                          Requested {formatDateTime(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => onApprove(request._id)}
                        disabled={actionLoading === `approve-${request._id}` || isFull}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle size={14} />
                        {actionLoading === `approve-${request._id}` ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReject(request._id)}
                        disabled={actionLoading === `reject-${request._id}`}
                        className="text-error hover:text-error"
                      >
                        <XCircle size={14} />
                        {actionLoading === `reject-${request._id}` ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab({ team, onDelete, actionLoading, isLeader, isAdmin }) {
  return (
    <div className="space-y-6">
      {/* Danger Zone */}
      <Card className="border-error/50">
        <CardHeader>
          <CardTitle className="text-error flex items-center gap-2">
            <AlertTriangle size={18} />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-error/5 border border-error/20">
            <div>
              <p className="font-medium text-foreground">Delete Team</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this team. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onDelete}
              disabled={actionLoading === 'delete'}
              className="text-error border-error hover:bg-error hover:text-white shrink-0"
            >
              <Trash2 size={16} />
              {actionLoading === 'delete' ? 'Deleting...' : 'Delete Team'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TransferLeadershipModal({ members, leaderId, onTransfer, onClose, actionLoading }) {
  const [selected, setSelected] = useState(null);
  
  const eligibleMembers = members.filter(m => {
    const memberId = m.userId?._id || m.userId;
    return memberId !== leaderId;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown size={18} className="text-secondary" />
            Transfer Leadership
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a team member to become the new leader. You will become a regular member.
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {eligibleMembers.map((member) => {
              const memberUser = member.userId || member;
              const memberId = memberUser._id || memberUser;
              return (
                <button
                  key={memberId}
                  onClick={() => setSelected(memberId)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                    selected === memberId
                      ? 'border-secondary bg-secondary/5'
                      : 'border-border hover:border-secondary/50'
                  )}
                >
                  <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Users size={14} className="text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{memberUser.name}</p>
                    <p className="text-xs text-muted-foreground">{memberUser.email}</p>
                  </div>
                  {selected === memberId && (
                    <CheckCircle size={16} className="text-secondary ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => selected && onTransfer(selected)}
              disabled={!selected || actionLoading === 'transfer'}
            >
              {actionLoading === 'transfer' ? 'Transferring...' : 'Transfer Leadership'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TeamDetailPage;
