import React from 'react';
import { Pressable, Text, PressableProps, View } from 'react-native';

interface ButtonProps extends PressableProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'default', size = 'default', children, className = '', ...props }: ButtonProps) {
  const baseClass = "flex-row items-center justify-center rounded-md";
  
  const variants = {
    default: "bg-primary",
    outline: "border border-input bg-transparent",
    ghost: "bg-transparent",
  };
  
  const textVariants = {
    default: "text-primary-foreground font-medium",
    outline: "text-foreground font-medium",
    ghost: "text-foreground font-medium",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
  };

  return (
    <Pressable 
      className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className={textVariants[variant]}>{children}</Text>
      ) : children}
    </Pressable>
  );
}
