import { useAuth } from "@/hooks/use-auth";

interface CanProps {
    allowed: string[];
    children: React.ReactNode;
}

export function Can({ allowed, children }: CanProps) {
    const { user } = useAuth();

    if (!user || !allowed.includes(user.perfil)) {
        return null;
    }

    return <>{children}</>;
}