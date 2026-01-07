import { useEffect } from 'react';
import { Trophy, X, PartyPopper, Gift, Mail } from 'lucide-react';
import { Button, Badge } from './index';
import { Card, CardContent } from './Card';
import { cn } from '../../lib/utils';

/**
 * Winner Celebration Modal
 * Displays congratulations message for prize winners
 */
function WinnerCelebrationModal({
    isOpen,
    onClose,
    prizeInfo,
    teamName
}) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !prizeInfo) return null;

    const { rank, title, value, description } = prizeInfo;

    // Get trophy color based on rank
    const getTrophyStyle = () => {
        switch (rank) {
            case 1:
                return 'from-yellow-400 to-yellow-600 text-yellow-100 shadow-yellow-500/50';
            case 2:
                return 'from-gray-300 to-gray-500 text-gray-100 shadow-gray-400/50';
            case 3:
                return 'from-amber-500 to-amber-700 text-amber-100 shadow-amber-500/50';
            default:
                return 'from-secondary to-secondary/80 text-white shadow-secondary/50';
        }
    };

    const getRankLabel = () => {
        switch (rank) {
            case 1: return '1st Place 🥇';
            case 2: return '2nd Place 🥈';
            case 3: return '3rd Place 🥉';
            default: return `${rank}th Place`;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <Card className="relative z-10 w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors z-10"
                >
                    <X size={20} className="text-muted-foreground" />
                </button>

                {/* Decorative top banner */}
                <div className={cn(
                    "h-2 w-full bg-gradient-to-r",
                    getTrophyStyle()
                )} />

                <CardContent className="pt-8 pb-6 text-center">
                    {/* Confetti emojis */}
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <span className="text-3xl animate-bounce" style={{ animationDelay: '0ms' }}>🎉</span>
                        <span className="text-3xl animate-bounce" style={{ animationDelay: '100ms' }}>🎊</span>
                        <span className="text-3xl animate-bounce" style={{ animationDelay: '200ms' }}>🎉</span>
                    </div>

                    {/* Trophy icon */}
                    <div className={cn(
                        "w-20 h-20 mx-auto rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg mb-6",
                        getTrophyStyle()
                    )}>
                        <Trophy size={40} className="text-white" />
                    </div>

                    {/* Congratulations text */}
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Congratulations!
                    </h2>

                    <p className="text-muted-foreground mb-4">
                        Your team <span className="font-semibold text-foreground">"{teamName}"</span> won
                    </p>

                    {/* Rank badge */}
                    <Badge className={cn(
                        "text-lg px-4 py-2 mb-6 bg-gradient-to-r border-0",
                        getTrophyStyle()
                    )}>
                        {getRankLabel()}
                    </Badge>

                    {/* Prize details */}
                    <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary/10 rounded-lg">
                                <Gift size={18} className="text-secondary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Prize</p>
                                <p className="font-semibold text-foreground">{title || 'Winner Prize'}</p>
                            </div>
                        </div>

                        {value && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-success/10 rounded-lg">
                                    <Trophy size={18} className="text-success" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Value</p>
                                    <p className="font-semibold text-foreground">{value}</p>
                                </div>
                            </div>
                        )}

                        {description && (
                            <p className="text-sm text-muted-foreground pt-2 border-t border-border">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Contact message */}
                    <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground mb-6">
                        <Mail size={14} />
                        <span>You'll be contacted soon for prize details!</span>
                    </div>

                    {/* Close button */}
                    <Button onClick={onClose} className="w-full gap-2">
                        <PartyPopper size={18} />
                        Awesome!
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default WinnerCelebrationModal;
