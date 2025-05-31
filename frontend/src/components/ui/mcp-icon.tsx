import React from 'react';
import { Plug } from 'lucide-react';
import { cn } from '@/lib/utils';

interface McpIconProps {
  size?: number;
  className?: string;
  containerClassName?: string;
}

export const McpIcon: React.FC<McpIconProps> = ({
  size = 24,
  className,
  containerClassName
}) => {
  const icon = (
    <Plug
      size={size}
      className={cn('inline-block align-middle', className)}
    />
  );

  if (!containerClassName) {
    return icon;
  }

  return (
    <div className={cn('rounded-lg border bg-background p-2', containerClassName)}>
      {icon}
    </div>
  );
};
