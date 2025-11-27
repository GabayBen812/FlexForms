import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'glass';

type ButtonProps = ComponentPropsWithoutRef<typeof Pressable> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  loading?: boolean;
  label?: string;
  textClassName?: string;
  leftIcon?: ReactNode;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-eduBlue-500 active:bg-eduBlue-600',
  secondary: 'bg-peach-500 active:bg-peach-600',
  glass: 'border border-gray-200 bg-white/80 backdrop-blur-md',
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  glass: 'text-gray-800',
};

const BaseButton = forwardRef<any, ButtonProps>(
  (
    {
      asChild,
      variant = 'primary',
      loading = false,
      disabled,
      label,
      className,
      textClassName,
      leftIcon,
      children,
      ...rest
    },
    ref
  ) => {
    const Comp: any = asChild ? Slot : Pressable;
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        className={cn(
          'flex-row items-center justify-center rounded-xl px-4 py-3',
          variantStyles[variant],
          isDisabled && 'opacity-50',
          className
        )}
        disabled={isDisabled}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'glass' ? '#1e293b' : '#ffffff'} />
        ) : (
          <>
            {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
            {label ? (
              <Text className={cn('text-base font-semibold', variantTextStyles[variant], textClassName)}>
                {label}
              </Text>
            ) : (
              children
            )}
          </>
        )}
      </Comp>
    );
  }
);

BaseButton.displayName = 'Button';

export const Button = BaseButton;

export default Button;


