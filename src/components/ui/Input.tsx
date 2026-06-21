import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';
import { Colors } from '../../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  mask?: string;
  onChangeText?: (text: string) => void;
  hint?: string;
}

export function Input({
  label,
  error,
  containerStyle,
  mask,
  onChangeText,
  hint,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.danger
    : focused
    ? Colors.primary.main
    : Colors.border;

  const commonStyle = [
    styles.input,
    { borderColor },
    props.multiline && styles.multiline,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      {mask ? (
        <MaskedTextInput
          mask={mask}
          onChangeText={(masked) => onChangeText?.(masked)}
          style={commonStyle}
          placeholderTextColor={Colors.gray[500]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...(props as any)}
        />
      ) : (
        <TextInput
          onChangeText={onChangeText}
          style={commonStyle}
          placeholderTextColor={Colors.gray[500]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      )}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.gray[900],
    backgroundColor: Colors.white,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.danger,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.gray[500],
  },
});
