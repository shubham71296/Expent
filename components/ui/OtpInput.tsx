import { OTP_DIGIT_COUNT } from '@/lib/otp';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type TextInput as RNTextInput,
  type ViewStyle,
} from 'react-native';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function OtpInput({ value, onChange, disabled, autoFocus }: OtpInputProps) {
  const inputRef = useRef<RNTextInput>(null);
  const [focused, setFocused] = useState(false);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const code = value.replace(/\D/g, '').slice(0, OTP_DIGIT_COUNT);
  const digits = useMemo(() => {
    const list = code.split('');
    while (list.length < OTP_DIGIT_COUNT) list.push('');
    return list;
  }, [code]);

  const activeIndex =
    code.length < OTP_DIGIT_COUNT ? code.length : OTP_DIGIT_COUNT - 1;

  const onChangeText = useCallback(
    (text: string) => {
      onChange(text.replace(/\D/g, '').slice(0, OTP_DIGIT_COUNT));
    },
    [onChange]
  );

  const cellStyle = useCallback(
    (index: number, digit: string): ViewStyle => {
      const filled = digit.length > 0;
      const active = focused && index === activeIndex && !disabled;

      if (active) {
        return isDark
          ? { borderColor: '#818cf8', backgroundColor: 'rgba(30, 27, 75, 0.5)' }
          : { borderColor: '#6366f1', backgroundColor: '#eef2ff' };
      }
      if (filled) {
        return isDark
          ? { borderColor: '#818cf8', backgroundColor: '#0f172a' }
          : { borderColor: '#818cf8', backgroundColor: '#ffffff' };
      }
      return isDark
        ? { borderColor: '#475569', backgroundColor: 'rgba(30, 41, 59, 0.8)' }
        : { borderColor: '#e2e8f0', backgroundColor: '#f8fafc' };
    },
    [activeIndex, disabled, focused, isDark]
  );

  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={styles.row}>
        {digits.map((digit, index) => {
          const active = focused && index === activeIndex && !disabled;
          const showCursor = active && !digit;

          return (
            <View
              key={index}
              style={styles.cellOuter}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              <View
                style={[
                  styles.cell,
                  cellStyle(index, digit),
                  disabled ? styles.cellDisabled : null,
                ]}>
                {digit ? (
                  <Text style={[styles.digit, isDark && styles.digitDark]}>{digit}</Text>
                ) : showCursor ? (
                  <View style={[styles.cursor, isDark && styles.cursorDark]} />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={OTP_DIGIT_COUNT}
        editable={!disabled}
        autoFocus={autoFocus}
        caretHidden
        blurOnSubmit={false}
        selectionColor="transparent"
        style={styles.hiddenInput}
        accessibilityLabel={`${OTP_DIGIT_COUNT}-digit verification code`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cellOuter: {
    flex: 1,
    minWidth: 0,
  },
  cell: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
  },
  cellDisabled: {
    opacity: 0.5,
  },
  digit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  digitDark: {
    color: '#f8fafc',
  },
  cursor: {
    height: 24,
    width: 2,
    borderRadius: 1,
    backgroundColor: '#4f46e5',
  },
  cursorDark: {
    backgroundColor: '#818cf8',
  },
  hiddenInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0,
    zIndex: 10,
  },
});
