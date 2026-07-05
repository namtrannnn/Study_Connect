import { UserRound, UsersRound } from 'lucide-react';

function Avatar({ src, name, size = 'h-12 w-12', isGroup = false }) {
    if (src) return <img src={src} alt={name} className={`${size} rounded-full object-cover`} />;
    return (
        <div className={`${size} flex items-center justify-center rounded-full bg-primary/10 text-primary`}>
            {isGroup ? <UsersRound className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
        </div>
    );
}

export default Avatar;
