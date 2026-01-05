import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Trophy,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  Eye,
  Download,
  BarChart3
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  Input,
  LoadingScreen, 
  ErrorState,
  EmptyState
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { getHackathonSubmissions, getSubmissionStatus } from '../../services/submissionService';
import { getHackathonById } from '../../services/hackathonService';
import { formatDate, formatDateTime, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function HackathonSubmissionsPage() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [hackathon, setHackathon] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, final, draft

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch hackathon
      const hackathonData = await getHackathonById(hackathonId);
      setHackathon(hackathonData.hackathon);
      
      // Fetch submissions
      const params = {};
      if (statusFilter === 'final') params.isFinal = true;
      
      const submissionsData = await getHackathonSubmissions(hackathonId, params);
      setSubmissions(submissionsData.submissions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = !searchQuery || 
      submission.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.teamId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'final' && submission.isFinal) ||
      (statusFilter === 'draft' && !submission.isFinal);
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalSubmissions = submissions.length;
  const finalSubmissions = submissions.filter(s => s.isFinal).length;
  const draftSubmissions = totalSubmissions - finalSubmissions;

  if (isLoading) {
    return <LoadingScreen message="Loading submissions..." />;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submissions</h1>
          <p className="text-muted-foreground mt-1">
            {hackathon?.title || 'Hackathon'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/hackathons/${hackathonId}/assignments`)}
        >
          <BarChart3 size={18} />
          Manage Assignments
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <FileText size={20} className="text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalSubmissions}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle size={20} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{finalSubmissions}</p>
              <p className="text-xs text-muted-foreground">Final</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock size={20} className="text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{draftSubmissions}</p>
              <p className="text-xs text-muted-foreground">Draft</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or team name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'final', 'draft'].map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(filter)}
            >
              {filter === 'all' ? 'All' : filter === 'final' ? 'Final' : 'Draft'}
            </Button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No submissions found"
          description={searchQuery ? 'Try adjusting your search' : 'No submissions have been made yet'}
        />
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => {
            const statusConfig = getSubmissionStatus(submission);
            const team = submission.teamId;
            
            return (
              <Card 
                key={submission._id}
                className="hover:shadow-md hover:border-secondary/50 transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Users size={24} className="text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {submission.title || 'Untitled Submission'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          by {team?.name || 'Unknown Team'}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {submission.description}
                        </p>
                        
                        {/* Links */}
                        <div className="flex items-center gap-3 mt-2">
                          {submission.repoUrl && (
                            <a
                              href={submission.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-secondary hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={12} />
                              Repo
                            </a>
                          )}
                          {submission.demoUrl && (
                            <a
                              href={submission.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-secondary hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={12} />
                              Demo
                            </a>
                          )}
                          {submission.submittedAt && (
                            <span className="text-xs text-muted-foreground">
                              Submitted: {formatDate(submission.submittedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3 lg:ml-auto">
                      <Badge className={statusConfig.color}>
                        {statusConfig.icon} {statusConfig.label}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/submissions/${submission._id}`)}
                      >
                        <Eye size={16} />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HackathonSubmissionsPage;
