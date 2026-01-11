import { useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface TrackActivityOptions {
  type: 'article_published' | 'user_registered' | 'article_edited' | 'custom';
  title: string;
  silent?: boolean; 
}

export function useActivityTracking() {
  const { data: session } = useSession();

  const trackActivity = useCallback(
    async (options: TrackActivityOptions) => {
      try {
        const response = await fetch('/api/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: options.type,
            title: options.title,
            userId: (session?.user as any)?.id || null,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          if (!options.silent) {
            console.log('Activity tracked:', options.title);
          }
          return await response.json();
        } else {
          console.error('Failed to track activity');
        }
      } catch (error) {
        console.error('Error tracking activity:', error);
      }
    },
    [session?.user]
  );

  return { trackActivity };
}
