import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  ExternalLink,
  Link as LinkIcon,
  FileText,
  CheckCircle,
  Clock,
  Image,
  Download
} from 'lucide-react';
import {
  Button,
  Badge,
  LoadingScreen,
  ErrorState,
  UserProfileLink
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { getSubmissionById, getSubmissionStatus } from '../../services/submissionService';
import { formatDate, formatDateTime, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function SubmissionDetailPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      setIsLoading(true);
      try {
        const data = await getSubmissionById(submissionId);
        setSubmission(data.submission);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load submission');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  if (isLoading) {
    return <LoadingScreen message="Loading submission..." />;
  }

  if (error || !submission) {
    return (
      <ErrorState
        title="Submission not found"
        description={error || "The submission you're looking for doesn't exist."}
        onRetry={() => navigate('/my/submissions')}
      />
    );
  }

  const statusConfig = getSubmissionStatus(submission);
  const hackathon = submission.hackathonId || submission.teamId?.hackathonId;
  const team = submission.teamId;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="gap-2"
      >
        <ArrowLeft size={18} />
        Back
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{submission.title}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground">
            {hackathon && (
              <span className="flex items-center gap-1">
                <Trophy size={14} className="text-secondary" />
                {hackathon.title || 'Hackathon'}
              </span>
            )}
            {team && (
              <span className="flex items-center gap-1">
                <Users size={14} />
                {team.name}
              </span>
            )}
          </div>
        </div>
        <Badge className={cn(statusConfig.color, 'text-sm')}>
          {statusConfig.icon} {statusConfig.label}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                {submission.description || 'No description provided.'}
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          {(submission.repoUrl || submission.demoUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Project Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submission.repoUrl && (
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-secondary hover:bg-secondary/5 transition-colors group"
                  >
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-secondary/10">
                      <LinkIcon size={18} className="text-muted-foreground group-hover:text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">Repository</p>
                      <p className="text-sm text-muted-foreground truncate">{submission.repoUrl}</p>
                    </div>
                    <ExternalLink size={16} className="text-muted-foreground group-hover:text-secondary" />
                  </a>
                )}
                {submission.demoUrl && (
                  <a
                    href={submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-secondary hover:bg-secondary/5 transition-colors group"
                  >
                    <div className="p-2 bg-muted rounded-lg group-hover:bg-secondary/10">
                      <ExternalLink size={18} className="text-muted-foreground group-hover:text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">Live Demo</p>
                      <p className="text-sm text-muted-foreground truncate">{submission.demoUrl}</p>
                    </div>
                    <ExternalLink size={16} className="text-muted-foreground group-hover:text-secondary" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assets */}
          {submission.assets && submission.assets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments ({submission.assets.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {submission.assets.map((asset) => (
                    <a
                      key={asset._id}
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-secondary hover:bg-secondary/5 transition-colors group"
                    >
                      <div className="p-2 bg-muted rounded-lg group-hover:bg-secondary/10">
                        {asset.mimeType?.startsWith('image') ? (
                          <Image size={18} className="text-muted-foreground group-hover:text-secondary" />
                        ) : (
                          <FileText size={18} className="text-muted-foreground group-hover:text-secondary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {asset.filename || asset.originalName || 'File'}
                        </p>
                        {asset.size && (
                          <p className="text-xs text-muted-foreground">
                            {(asset.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      <Download size={14} className="text-muted-foreground group-hover:text-secondary" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Info */}
          {team && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Users size={18} className="text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {team.members?.length || 0} members
                    </p>
                  </div>
                </div>

                {/* Team Members */}
                {team.members && team.members.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Members</p>
                    <div className="space-y-2">
                      {team.members.map((member) => (
                        <div key={member._id || member} className="flex items-center gap-2">
                          <UserProfileLink
                            userId={member.userId?._id || member.userId}
                            name={member.userId?.name || member.name}
                            avatar={member.userId?.avatar || member.avatar}
                            size="sm"
                          />
                          {member.role === 'leader' && (
                            <Badge variant="outline" className="text-[10px] h-4">Leader</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate(`/teams/${team._id}`)}
                >
                  View Team
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Submission Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                <Badge className={cn(statusConfig.color, 'mt-1')}>
                  {statusConfig.icon} {statusConfig.label}
                </Badge>
              </div>

              {submission.submittedAt && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Submitted</p>
                  <p className="text-sm text-foreground mt-1">
                    {formatDateTime(submission.submittedAt)}
                  </p>
                </div>
              )}

              {submission.updatedAt && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</p>
                  <p className="text-sm text-foreground mt-1">
                    {formatDateTime(submission.updatedAt)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hackathon Info */}
          {hackathon && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hackathon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Trophy size={18} className="text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{hackathon.title}</p>
                  </div>
                </div>

                {hackathon.endAt && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar size={14} />
                    Ended: {formatDate(hackathon.endAt)}
                  </p>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate(`/hackathons/${hackathon._id}`)}
                >
                  View Hackathon
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmissionDetailPage;
