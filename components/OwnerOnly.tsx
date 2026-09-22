import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { strings } from '@/constants/strings';
import { useAuth } from '@/hooks/useAuth';

/** Screen-level role guard. The database blocks staff too (RLS), this just shows a friendly page. */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { isOwner } = useAuth();
  const router = useRouter();
  if (!isOwner) {
    return (
      <EmptyState
        icon="lock-closed-outline"
        title={strings.common.noAccessTitle}
        body={strings.common.noAccessBody}
        actionLabel={strings.common.goHome}
        onAction={() => router.replace('/')}
      />
    );
  }
  return <>{children}</>;
}
