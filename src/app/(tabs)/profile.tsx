import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useAuth } from '../../components/AuthProvider';
import { COLORS } from '../../constants/colors';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name.split(' ')[0] ?? '');
  const [email, setEmail] = useState("alex@example.com");
  const [isPublic, setIsPublic] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pt-4 pb-6 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 items-center justify-center bg-surface rounded-full border border-border">
          <ArrowLeft size={20} color={COLORS.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">Edit Profile</Text>
        <View className="h-10 w-10" />
      </View>

      <ScrollView className="flex-1 px-6 pt-8">
        <View className="mb-6">
          <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">Display Name</Text>
          <TextInput 
            value={name}
            onChangeText={setName}
            className="w-full bg-surface border border-border rounded-xl p-4 text-foreground text-lg"
            placeholderTextColor={COLORS.mutedForeground}
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-muted-foreground mb-2 ml-1">Email Address</Text>
          <TextInput 
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            className="w-full bg-surface border border-border rounded-xl p-4 text-foreground text-lg"
            placeholderTextColor={COLORS.mutedForeground}
          />
        </View>

        <View className="bg-surface border border-border rounded-xl p-4 mb-8 flex-row items-center justify-between">
          <View>
            <Text className="text-foreground font-semibold text-lg">Public Profile</Text>
            <Text className="text-muted-foreground text-sm mt-1">Allow friends to see your level</Text>
          </View>
          <Switch 
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: COLORS.muted, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-full bg-primary py-4 rounded-xl items-center justify-center flex-row"
        >
          <Save size={20} color={COLORS.primaryForeground} className="mr-2" />
          <Text className="text-primary-foreground font-bold text-lg">Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
