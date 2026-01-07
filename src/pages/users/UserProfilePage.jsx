import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    User,
    Mail,
    Code,
    Github,
    Linkedin,
    Twitter,
    Globe,
    Shield,
    ArrowLeft,
    Edit,
    ExternalLink,
    Loader2
} from 'lucide-react';
import {
    Button,
    Badge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '../../components/ui';
import { getUserById, getRoleDisplay } from '../../services/userService';
import { cn, getErrorMessage } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function UserProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();

    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getUserById(userId);
                setUser(data.user || data);
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError(getErrorMessage(err));
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchUser();
        }
    }, [userId]);

    const isOwnProfile = currentUser?._id === userId || currentUser?.id === userId;
    const isAdminOrOrganizer = currentUser?.role === 'admin' || currentUser?.role === 'organizer';
    const showPrivateInfo = isOwnProfile || isAdminOrOrganizer;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 text-secondary animate-spin mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading profile...</p>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="max-w-4xl mx-auto py-12">
                <Card className="border-error/20 bg-error/5">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mb-4">
                            <User className="text-error" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Profile Not Found</h2>
                        <p className="text-muted-foreground mb-6">
                            {error || "We couldn't find the user profile you're looking for."}
                        </p>
                        <Button onClick={() => navigate(-1)} variant="outline">
                            <ArrowLeft size={18} className="mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const roleInfo = getRoleDisplay(user.role);
    const socialLinks = user.profile?.socialLinks || {};
    const skills = user.profile?.skills || [];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Navigation & Actions */}
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="hover:bg-transparent -ml-2"
                >
                    <ArrowLeft size={18} className="mr-2" />
                    Back
                </Button>

                {isOwnProfile && (
                    <Link to="/profile">
                        <Button size="sm">
                            <Edit size={16} className="mr-2" />
                            Edit Profile
                        </Button>
                    </Link>
                )}
            </div>

            {/* Header Profile Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardContent className="pt-8">
                        <div className="flex flex-col items-center">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/10 shadow-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 bg-secondary/10 rounded-full flex items-center justify-center border-4 border-primary/10 shadow-inner">
                                    <User size={64} className="text-secondary" />
                                </div>
                            )}

                            <div className="mt-6 text-center">
                                <h1 className="text-2xl font-bold text-foreground line-clamp-1">{user.name}</h1>
                                <Badge className={cn("mt-2 border-none", roleInfo.color)}>
                                    <span className="mr-1">{roleInfo.icon}</span>
                                    {roleInfo.label}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Section */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Bio */}
                        <div>
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                {user.profile?.bio || "This user hasn't added a bio yet."}
                            </p>
                        </div>

                        {/* Private Info (Email) */}
                        {showPrivateInfo && user.email && (
                            <div className="flex items-center gap-3 text-sm p-3 bg-muted/50 rounded-lg">
                                <Mail size={16} className="text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email Address</p>
                                    <p className="text-foreground">{user.email}</p>
                                </div>
                                {isOwnProfile && (
                                    <Badge variant="outline" className="ml-auto text-[10px] uppercase font-bold">Only you can see this</Badge>
                                )}
                            </div>
                        )}

                        {/* Skills */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Code size={16} className="text-secondary" />
                                Skills & Expertise
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {skills.length > 0 ? (
                                    skills.map((skill, index) => (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className="bg-secondary/5 border-secondary/20 py-1"
                                        >
                                            {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No skills listed</p>
                                )}
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Globe size={16} className="text-secondary" />
                                Online Presence
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {socialLinks.github && (
                                    <a
                                        href={socialLinks.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 px-3 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                                    >
                                        <Github size={16} />
                                        GitHub
                                    </a>
                                )}
                                {socialLinks.linkedin && (
                                    <a
                                        href={socialLinks.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 px-3 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                                    >
                                        <Linkedin size={16} />
                                        LinkedIn
                                    </a>
                                )}
                                {socialLinks.twitter && (
                                    <a
                                        href={socialLinks.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 px-3 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                                    >
                                        <Twitter size={16} />
                                        Twitter
                                    </a>
                                )}
                                {socialLinks.website && (
                                    <a
                                        href={socialLinks.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 px-3 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
                                    >
                                        <Globe size={16} />
                                        Website
                                    </a>
                                )}
                                {!socialLinks.github && !socialLinks.linkedin && !socialLinks.twitter && !socialLinks.website && (
                                    <p className="text-sm text-muted-foreground italic">No social links provided</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default UserProfilePage;
