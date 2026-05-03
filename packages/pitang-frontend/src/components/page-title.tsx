import { useEffect } from 'react';

interface PageTitleProps {
  title: string;
}

export function PageTitle({ title }: PageTitleProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | Pitang.reembolsos`;

    return () => {
      document.title = prevTitle;
    };
  }, [title]);

  return null;
}
