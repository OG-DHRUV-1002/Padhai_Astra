import type { FC, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

const PageHeader: FC<PageHeaderProps> = ({ title, description, children }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold font-headline tracking-tight">{title}</h1>
        {children}
      </div>
      <p className="text-muted-foreground">{description}</p>
      <div className="mt-4 h-[2px] w-24 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
    </div>
  );
};

export default PageHeader;
