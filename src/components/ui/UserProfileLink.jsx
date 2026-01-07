import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Reusable component to link to a user profile
 * @param {string} userId - The ID of the user
 * @param {string} name - The name of the user
 * @param {string} avatar - Optional avatar URL
 * @param {boolean} showAvatar - Whether to show the avatar (default: true)
 * @param {string} size - Size of the avatar (sm, md, lg)
 * @param {string} className - Additional classes for the container
 */
function UserProfileLink({
    userId,
    name,
    avatar,
    showAvatar = true,
    size = 'sm',
    className
}) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
    };

    const iconSizes = {
        sm: 12,
        md: 16,
        lg: 18,
    };

    if (!userId) {
        return (
            <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
                {showAvatar && (
                    <div className={cn(
                        "bg-muted rounded-full flex items-center justify-center shrink-0",
                        sizeClasses[size]
                    )}>
                        <User size={iconSizes[size]} />
                    </div>
                )}
                <span className="text-sm font-medium">{name || 'Unknown'}</span>
            </div>
        );
    }

    return (
        <Link
            to={`/users/${userId}`}
            className={cn(
                "flex items-center gap-2 group hover:opacity-80 transition-opacity",
                className
            )}
        >
            {showAvatar && (
                <div className={cn(
                    "bg-secondary/10 rounded-full flex items-center justify-center shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-secondary/20 transition-all",
                    sizeClasses[size]
                )}>
                    {avatar ? (
                        <img
                            src={avatar}
                            alt={name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User size={iconSizes[size]} className="text-secondary" />
                    )}
                </div>
            )}
            <span className="text-sm font-medium text-foreground group-hover:text-secondary group-hover:underline decoration-secondary/30 underline-offset-2 transition-colors truncate">
                {name}
            </span>
        </Link>
    );
}

export default UserProfileLink;
