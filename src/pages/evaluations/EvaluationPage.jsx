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
  ExternalLink,
  Download,
  Image,
  File,
  Video,
  Music,
  FileCode,
  Eye
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
import { getSubmissionById } from '../../services/submissionService';
import { formatDate, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

// Helper to get icon for asset based on category/mimeType
const getAssetIcon = (asset) => {
  const category = asset.category || '';
  const mimeType = asset.mimeType || '';
  
  if (category === 'image' || mimeType.startsWith('image/')) return Image;
  if (category === 'video' || mimeType.startsWith('video/')) return Video;
  if (category === 'audio' || mimeType.startsWith('audio/')) return Music;
  if (category === 'document' || mimeType === 'application/pdf') return FileText;
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return FileCode;
  return File;
};

// Helper to check if asset is previewable
const isPreviewable = (asset) => {
  const mimeType = asset.mimeType || '';
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
};

// Helper to safely get team name from submission
const getTeamName = (submission) => {
  if (!submission) return 'Unknown Team';
  // teamId could be populated object or just an ID
  if (submission.teamId?.name) return submission.teamId.name;
  if (submission.team?.name) return submission.team.name;
  if (typeof submission.teamId === 'string') return `Team ${submission.teamId.slice(-6)}`;
  return 'Unknown Team';
};

// Helper to safely get submission title
const getSubmissionTitle = (submission) => {
  if (!submission) return 'Untitled Submission';
  return submission.title || submission.name || 'Untitled Submission';
};

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
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Function to select and load full submission details
  const selectSubmission = async (submission) => {
    if (!submission) {
      setActiveSubmission(null);
      return;
    }
    
    setIsLoadingSubmission(true);
    try {
      // Fetch full submission details with populated assets
      const submissionId = submission._id || submission.id;
      const result = await getSubmissionById(submissionId);
      const fullSubmission = result.submission || result;
      setActiveSubmission(fullSubmission);
    } catch (err) {
      console.error('Failed to fetch submission details:', err);
      // Fall back to the basic submission data
      setActiveSubmission(submission);
    } finally {
      setIsLoadingSubmission(false);
    }
  };

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
        console.log('Assigned submissions response:', submissionsData);
        
        // API returns { submissions: [{ submission, evaluated, evaluation }], stats }
        // We need to extract the actual submission objects and merge evaluation info
        const subs = (submissionsData.submissions || []).map(item => {
          // Handle nested structure: item.submission contains actual data
          const sub = item.submission || item;
          return {
            ...sub,
            // Include evaluation status from wrapper if available
            _evaluated: item.evaluated,
            _evaluation: item.evaluation
          };
        });
        setSubmissions(subs);
        
        // Also populate evaluations from the response
        const evalMap = {};
        (submissionsData.submissions || []).forEach(item => {
          if (item.evaluation) {
            const subId = item.submission?._id || item._id;
            evalMap[subId] = item.evaluation;
          }
        });
        if (Object.keys(evalMap).length > 0) {
          setEvaluations(prev => ({ ...prev, ...evalMap }));
        }
      } catch (err) {
        console.error('Failed to fetch assigned submissions:', err);
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

  // Show loading when fetching submission details
  if (isLoadingSubmission) {
    return <LoadingScreen message="Loading submission details..." />;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => activeSubmission ? selectSubmission(null) : navigate('/my/evaluations')}
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
              ? `Evaluating: ${getTeamName(activeSubmission)}`
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
                    key={submission._id || submission.id}
                    className="hover:shadow-md hover:border-secondary/50 transition-all cursor-pointer group"
                    onClick={() => selectSubmission(submission)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                            <Users size={24} className="text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">
                              {getTeamName(submission)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {getSubmissionTitle(submission)}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              {submission.submittedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Submitted: {formatDate(submission.submittedAt)}
                                </p>
                              )}
                              {submission.assets && submission.assets.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <File size={12} />
                                  {submission.assets.length} file{submission.assets.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
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
                  <p className="font-medium">{getTeamName(activeSubmission)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium">{getSubmissionTitle(activeSubmission)}</p>
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
                {activeSubmission.videoUrl && (
                  <a 
                    href={activeSubmission.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-secondary hover:underline"
                  >
                    <ExternalLink size={14} />
                    View Video
                  </a>
                )}

                {/* Submission Assets */}
                {activeSubmission.assets && activeSubmission.assets.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">
                      Attached Files ({activeSubmission.assets.length})
                    </p>
                    <div className="space-y-2">
                      {activeSubmission.assets.map((asset, index) => {
                        const AssetIcon = getAssetIcon(asset);
                        const canPreview = isPreviewable(asset);
                        const assetUrl = asset.storageUrl || asset.url || '';
                        const fileName = asset.filename || asset.name || `File ${index + 1}`;
                        const fileSize = asset.sizeFormatted || 
                          (asset.sizeBytes ? `${(asset.sizeBytes / 1024).toFixed(1)} KB` : 'Unknown size');
                        
                        return (
                          <div 
                            key={asset._id || asset.id || index}
                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className={cn(
                              "w-8 h-8 rounded flex items-center justify-center flex-shrink-0",
                              asset.category === 'image' ? 'bg-blue-500/10 text-blue-500' :
                              asset.category === 'video' ? 'bg-purple-500/10 text-purple-500' :
                              asset.category === 'document' ? 'bg-red-500/10 text-red-500' :
                              'bg-gray-500/10 text-gray-500'
                            )}>
                              <AssetIcon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {fileName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {fileSize}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {canPreview && assetUrl && (
                                <a
                                  href={assetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded hover:bg-secondary/10 text-muted-foreground hover:text-secondary transition-colors"
                                  title="View"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye size={14} />
                                </a>
                              )}
                              {assetUrl && (
                                <a
                                  href={assetUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={fileName}
                                  className="p-1.5 rounded hover:bg-secondary/10 text-muted-foreground hover:text-secondary transition-colors"
                                  title="Download"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
              <Alert variant={saveMessage.type === 'error' ? 'error' : 'success'}>
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
