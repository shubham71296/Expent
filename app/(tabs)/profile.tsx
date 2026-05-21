import { Button } from '@/components/ui/Button';
import { IconTextInput } from '@/components/ui/IconTextInput';
import { Card, CardSectionHeader } from '@/components/ui/Card';
import { AppScreen } from '@/components/ui/Screen';
import { credentialAuthErrorMessage } from '@/lib/authUserMessage';
import { validateProfileName } from '@/lib/authValidation';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { getProfileFromSession } from '@/lib/userProfile';
import { useSupabase } from '@/providers/SupabaseProvider';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Text, TouchableOpacity, View } from 'react-native';

function ProfileHero({ name, email, avatarLetter }: { name: string; email: string | null; avatarLetter: string }) {
  return (
    <View className="mb-5 overflow-hidden rounded-3xl border border-indigo-200 bg-indigo-600 p-5 shadow-sm dark:border-indigo-800 dark:bg-indigo-700">
      <View className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/20">
          <Text className="text-2xl font-bold text-white">{avatarLetter}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-bold text-white" numberOfLines={1}>
            {name}
          </Text>
          <Text className="mt-1 text-sm text-indigo-100" numberOfLines={1}>
            {email ?? 'Expent account'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { session, updateProfile } = useSupabase();
  const profile = getProfileFromSession(session);
  const [name, setName] = useState(profile.name);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(profile.name);
  }, [profile.name]);

  const onNameChange = useCallback((text: string) => {
    setName(text);
    toast.hide();
  }, []);

  const onUpdate = useCallback(async () => {
    const validationError = validateProfileName(name);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    const { error } = await updateProfile(name);
    setSubmitting(false);

    if (error) {
      toast.error(credentialAuthErrorMessage(error));
      return;
    }

    toast.success('Your profile has been updated.');
  }, [name, updateProfile]);

  const header = (
    <View className="mb-4 flex-row items-center">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Go back"
        activeOpacity={BUTTON_ACTIVE_OPACITY}
        onPress={() => router.back()}
        className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <MaterialCommunityIcons name="arrow-left" size={22} color="#64748b" />
      </TouchableOpacity>
    </View>
  );

  if (!isSupabaseConfigured) {
    return (
      <AppScreen scroll variant="tab">
        <View className="px-4 pb-8">
          {header}
          <Text className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">My profile</Text>
          <Card>
            <Text className="text-base text-slate-600 dark:text-slate-300">
              Sign-in is not configured. Add Supabase keys to use a profile.
            </Text>
          </Card>
        </View>
      </AppScreen>
    );
  }

  if (!session?.user) {
    return (
      <AppScreen scroll variant="tab">
        <View className="px-4 pb-8">
          {header}
          <Text className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">My profile</Text>
          <Text className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Sign in to view and update your account.
          </Text>
          <Card>
            <Button title="Sign in" onPress={() => router.push('/(auth)/login')} />
          </Card>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll variant="tab">
      <View className="px-4 pb-8">
        {header}
        <ProfileHero name={profile.name} email={profile.email} avatarLetter={profile.avatarLetter} />

        <Card className="border border-indigo-100 p-5 dark:border-indigo-900/50">
          <CardSectionHeader
            title="Account details"
            subtitle="Update how your name appears in the app"
            icon="account-edit-outline"
            iconColor="#4f46e5"
            iconBg="bg-indigo-50 dark:bg-indigo-950/50"
            className="mb-5"
          />

          <View className="mb-4">
            <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Full name
            </Text>
            <IconTextInput
              icon="account-outline"
              value={name}
              onChangeText={onNameChange}
              placeholder="Your name"
              autoCapitalize="words"
              autoComplete="name"
              containerClassName="mb-0"
              wrapperClassName="flex-row items-center rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              accessibilityLabel="Full name"
            />
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Email
            </Text>
            <IconTextInput
              icon="email-outline"
              value={profile.email ?? ''}
              editable={false}
              placeholder=""
              containerClassName="mb-0"
              wrapperClassName="flex-row items-center rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              accessibilityLabel="Email address"
            />
            <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Email cannot be changed here.
            </Text>
          </View>

          <Button title="Update profile" onPress={() => void onUpdate()} loading={submitting} />
        </Card>
      </View>
    </AppScreen>
  );
}
