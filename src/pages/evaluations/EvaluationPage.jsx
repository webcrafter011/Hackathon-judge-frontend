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
  Star,
  ChevronRight,
  Save,
  Send,
  MessageSquare,
  ExternalLink
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
import { 
  getCriteria, 
  getAssignedSubmissions, 
  getMyHackathonEvaluations,
  saveEvaluation,
  submitEvaluation,
  getEvaluationStatus,
  calculateTotalScore
} from '../../services/evaluationService';
import { getHackathonById } from '../../services/hackathonService';
import { formatDate, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function EvaluationPage() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [hackathon, setHackathon] = useState(null);
  const [criteria, setCriteria] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Active submission for evaluation
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch hackathon details
      const hackathonData = await getHackathonById(hackathonId);
      setHackathon(hackathonData.hackathon);
      
      // Fetch criteria
      try {
        const criteriaData = await getCriteria(hackathonId);
        setCriteria(criteriaData.criteria);
      } catch (err) {
        // Criteria might not be set yet
        setCriteria(null);
      }
      
      // Fetch assigned submissions
      try {
        const submissionsData = await getAssignedSubmissions(hackathonId);
        setSubmissions(submissionsData.submissions || []);
      } catch (err) {
        setSubmissions([]);
      }
      
      // Fetch my evaluations
      try {
        const evaluationsData = await getMyHackathonEvaluations(hackathonId);
        // Convert to lookup by submissionId
        const evalMap = {};
        (evaluationsData.evaluations || []).forEach(ev => {
          evalMap[ev.submissionId?._id || ev.submissionId] = ev;
        });
        setEvaluations(evalMap);
      } catch (err) {
        setEvaluations({});
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load evaluation data');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize scores when selecting a submission
  useEffect(() => {
    if (activeSubmission && criteria?.items) {
      const existingEval = evaluations[activeSubmission._id];
      const newScores = {};
      const newComments = {};
      
      criteria.items.forEach(item => {
        const existingScore = existingEval?.scores?.find(s => s.key === item.key);
        newScores[item.key] = existingScore?.score ?? '';
        newComments[item.key] = existingScore?.comment ?? '';
      });
      
      setScores(newScores);
      setComments(newComments);
    }
  }, [activeSubmission, criteria, evaluations]);

  const handleScoreChange = (key, value) => {
    const maxScore = criteria?.items?.find(i => i.key === key)?.maxScore || 10;
    const numValue = Math.min(Math.max(0, parseInt(value) || 0), maxScore);
    setScores(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSave = async (status = 'draft') => {
    if (!activeSubmission || !criteria) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const scoreData = criteria.items.map(item => ({
        key: item.key,
        score: scores[item.key] || 0,
        comment: comments[item.key] || ''
      }));
      
      const result = await saveEvaluation({
        submissionId: activeSubmission._id,
        scores: scoreData,
        status
      });
      
      // Update local evaluations
      setEvaluations(prev => ({
        ...prev,
        [activeSubmission._id]: result.evaluation
      }));
      
      setSaveMessage({ type: 'success', text: status === 'submitted' ? 'Evaluation submitted!' : 'Evaluation saved as draft' });
      
      // If submitted, go back to list
      if (status === 'submitted') {
        setTimeout(() => setActiveSubmission(null), 1500);
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save evaluation' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading evaluation data..." />;
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

  // Calculate stats
  const totalSubmissions = submissions.length;
  const evaluatedCount = submissions.filter(s => evaluations[s._id]?.status === 'submitted').length;
  const draftCount = submissions.filter(s => evaluations[s._id]?.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => activeSubmission ? setActiveSubmission(null) : navigate('/my/evaluations')}
        className="gap-2"
      >
        <ArrowLeft size={18} />
        {activeSubmission ? 'Back to Submissions' : 'Back to My Evaluations'}
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {hackathon?.title || 'Hackathon'} - Evaluation
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeSubmission 
              ? `Evaluating: ${activeSubmission.teamId?.name || 'Team Submission'}`
              : 'Review and score assigned submissions'
            }
          </p>
        </div>
        {!activeSubmission && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              <CheckCircle size={14} className="inline mr-1 text-success" />
              {evaluatedCount} / {totalSubmissions} evaluated
            </span>
            {draftCount > 0 && (
              <span className="text-muted-foreground">
                <Clock size={14} className="inline mr-1 text-warning" />
                {draftCount} drafts
              </span>
            )}
          </div>
        )}
      </div>

      {/* No Criteria Warning */}
      {!criteria && (
        <Alert variant="warning">
          <AlertCircle size={16} />
          <span>No evaluation criteria has been set for this hackathon yet. Please contact the organizer.</span>
        </Alert>
      )}

      {/* Main Content */}
      {!activeSubmission ? (
        // Submissions List
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Submissions Assigned</h3>
              <p className="text-muted-foreground">
                You don't have any submissions assigned for evaluation yet.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {submissions.map(submission => {
                const evaluation = evaluations[submission._id];
                const statusConfig = getEvaluationStatus(evaluation);
                const score = evaluation ? calculateTotalScore(evaluation.scores, criteria) : null;
                
                return (
                  <Card 
                    key={submission._id}
                    className="hover:shadow-md hover:border-secondary/50 transition-all cursor-pointer group"
                    onClick={() => setActiveSubmission(submission)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                            <Users size={24} className="text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">
                              {submission.teamId?.name || 'Unknown Team'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {submission.title || 'Submission'}
                            </p>
                            {submission.submittedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Submitted: {formatDate(submission.submittedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {score !== null && (
                            <div className="text-right hidden sm:block">
                              <p className="text-2xl font-bold text-foreground">{score.toFixed(0)}</p>
                              <p className="text-xs text-muted-foreground">score</p>
                            </div>
                          )}
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                          <ChevronRight size={20} className="text-muted-foreground group-hover:text-secondary transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // Evaluation Form
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Submission Details */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Team</p>
                  <p className="font-medium">{activeSubmission.teamId?.name || 'Unknown Team'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{activeSubmission.title || 'Untitled'}</p>
                </div>
                {activeSubmission.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{activeSubmission.description}</p>
                  </div>
                )}
                {activeSubmission.demoUrl && (
                  <a 
                    href={activeSubmission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-secondary hover:underline"
                  >
                    <ExternalLink size={14} />
                    View Demo
                  </a>
                )}
                {activeSubmission.repoUrl && (
                  <a 
                    href={activeSubmission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-secondary hover:underline"
                  >
                    <ExternalLink size={14} />
                    View Repository
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Current Score */}
            {criteria && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Current Score</p>
                    <p className="text-4xl font-bold text-secondary">
                      {calculateTotalScore(
                        criteria.items.map(item => ({ key: item.key, score: scores[item.key] || 0 })),
                        criteria
                      ).toFixed(0)}
                    </p>
                    <p className="text-sm text-muted-foreground">/ 100</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Scoring Form */}
          <div className="lg:col-span-2 space-y-4">
            {saveMessage && (
              <Alert variant={saveMessage.type === 'error' ? 'destructive' : 'default'}>
                {saveMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                <span>{saveMessage.text}</span>
              </Alert>
            )}

            {criteria?.items?.map(item => (
              <Card key={item.key}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Weight: {item.weight}x • Max: {item.maxScore}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max={item.maxScore}
                        value={scores[item.key] ?? ''}
                        onChange={(e) => handleScoreChange(item.key, e.target.value)}
                        className="w-20 h-10 text-center text-lg font-bold border border-border rounded-lg bg-primary focus:ring-2 focus:ring-secondary focus:border-secondary outline-none"
                        placeholder="0"
                      />
                      <span className="text-muted-foreground">/ {item.maxScore}</span>
                    </div>
                  </div>
                  
                  {/* Score Slider */}
                  <div className="mb-4">
                    <input
                      type="range"
                      min="0"
                      max={item.maxScore}
                      value={scores[item.key] || 0}
                      onChange={(e) => handleScoreChange(item.key, e.target.value)}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-secondary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span>{item.maxScore}</span>
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                      <MessageSquare size={14} />
                      Comment (optional)
                    </label>
                    <Textarea
                      value={comments[item.key] || ''}
                      onChange={(e) => setComments(prev => ({ ...prev, [item.key]: e.target.value }))}
                      placeholder={`Add feedback for ${item.label.toLowerCase()}...`}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSave('draft')}
                disabled={isSaving || !criteria}
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleSave('submitted')}
                disabled={isSaving || !criteria}
              >
                <Send size={18} />
                {isSaving ? 'Submitting...' : 'Submit Evaluation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluationPage;
