import { useEffect, useState } from 'react';
import { REPO_CHANGE_EVENT } from '@/mocks/repository';

export function useRepoSubscription(topics?: string[]) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleRepoChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ topic?: string }>;
      const eventTopic = customEvent.detail?.topic;

      if (!topics || !eventTopic || eventTopic === 'all' || topics.includes(eventTopic)) {
        setVersion((v) => v + 1);
      }
    };

    window.addEventListener(REPO_CHANGE_EVENT, handleRepoChange);
    return () => {
      window.removeEventListener(REPO_CHANGE_EVENT, handleRepoChange);
    };
  }, [topics]);

  return version;
}
