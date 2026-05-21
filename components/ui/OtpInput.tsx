import { OTP_DIGIT_COUNT } from '@/lib/otp';
import { useCallback, useRef, useState } from 'react';
import { Text, TextInput, View, type TextInput as RNTextInput } from 'react-native';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function OtpInput({ value, onChange, disabled, autoFocus }: OtpInputProps) {
  const inputRef = useRef<RNTextInput>(null);
  const [focused, setFocused] = useState(false);

  const code = value.replace(/\D/g, '').slice(0, OTP_DIGIT_COUNT);
  const digits = code.split('');
  while (digits.length < OTP_DIGIT_COUNT) digits.push('');

  const activeIndex =
    code.length < OTP_DIGIT_COUNT ? code.length : OTP_DIGIT_COUNT - 1;

  const onChangeText = useCallback(
    (text: string) => {
      onChange(text.replace(/\D/g, '').slice(0, OTP_DIGIT_COUNT));
    },
    [onChange]
  );

  const cellClass = (index: number, digit: string) => {
    const filled = digit.length > 0;
    const active = focused && index === activeIndex && !disabled;

    if (active) {
      return 'border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/50';
    }
    if (filled) {
      return 'border-indigo-500 bg-white dark:border-indigo-400 dark:bg-slate-900';
    }
    return 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900';
  };

  return (
    <View className="relative min-h-[44px]">
      {/* Visual cells only — touches go through to the TextInput above */}
      <View pointerEvents="none" className="flex-row justify-between gap-1.5">
        {digits.map((digit, index) => {
          const active = focused && index === activeIndex && !disabled;
          const showCursor = active && !digit;

          return (
            <View
              key={index}
              className="min-w-0 flex-1"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants">
              <View
                className={`h-11 items-center justify-center rounded-lg border-2 ${cellClass(index, digit)} ${
                  disabled ? 'opacity-50' : ''
                }`}>
                {digit ? (
                  <Text className="text-lg font-bold text-slate-900 dark:text-white">{digit}</Text>
                ) : showCursor ? (
                  <View className="h-6 w-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {/* Full-area invisible input on top so every tap focuses reliably after dismiss */}
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
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          opacity: 0,
          zIndex: 10,
        }}
        accessibilityLabel={`${OTP_DIGIT_COUNT}-digit verification code`}
      />
    </View>
  );
}
