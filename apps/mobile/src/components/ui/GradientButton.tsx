import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { cn } from '../../utils/cn';

type GradientButtonProps = ComponentPropsWithoutRef<typeof Pressable> & {
  label: string;
  loading?: boolean;
  colors?: [ColorValue, ColorValue, ...ColorValue[]];
  textColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
};

const GradientButton = forwardRef<ComponentRef<typeof Pressable>, GradientButtonProps>(
  (
    {
      label,
      loading = false,
      className,
      disabled,
      colors = ['#FF6B4D', '#457B9D', '#14B8A6'] as [ColorValue, ColorValue, ...ColorValue[]],
      textColor = '#ffffff',
      containerStyle,
      buttonStyle,
      labelStyle,
      icon,
      iconPosition = 'left',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const hasIcon = !!icon;
    const renderIcon = hasIcon ? <View style={styles.iconWrapper}>{icon}</View> : null;

    return (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.gradient, containerStyle, isDisabled && styles.disabled]}
      >
        <Pressable
          ref={ref}
          className={cn('active:opacity-90', className)}
          disabled={isDisabled}
          style={[styles.button, buttonStyle]}
          {...props}
        >
          {loading ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <View
              style={[
                styles.content,
                iconPosition === 'right' && styles.contentReverse,
                !hasIcon && styles.contentCentered,
              ]}
            >
              {hasIcon && iconPosition === 'left' ? renderIcon : null}
              <Text style={[styles.label, { color: textColor }, labelStyle]}>
                {label}
              </Text>
              {hasIcon && iconPosition === 'right' ? renderIcon : null}
            </View>
          )}
        </Pressable>
      </LinearGradient>
    );
  }
);

GradientButton.displayName = 'GradientButton';

export default GradientButton;

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  button: {
    width: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contentReverse: {
    flexDirection: 'row-reverse',
  },
  contentCentered: {
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.7,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


