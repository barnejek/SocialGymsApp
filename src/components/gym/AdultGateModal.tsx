import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { setAdultAttestation } from '../../lib/gamification';
import { useGamification } from '../GamificationProvider';
import { COLORS } from '../../constants/colors';

/**
 * One-time self-attestation gate for the Romance & Dating path.
 * Exact required copy: "This path contains adult dating scenarios."
 */
export const AdultGateModal = ({
  open,
  onClose,
  onConfirmed,
}: {
  open: boolean;
  onClose: () => void;
  onConfirmed?: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refresh } = useGamification();

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await setAdultAttestation();
      await refresh();
      onClose();
      onConfirmed?.();
    } catch {
      setError("Couldn't save your confirmation. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/70 px-6">
        <View className="w-full max-w-sm rounded-3xl border border-border bg-surface p-6">
          <View className="flex-row items-center mb-3">
            <Heart size={20} color={COLORS.primary} />
            <Text className="text-lg font-bold text-foreground ml-2">Romance &amp; Dating</Text>
          </View>
          <Text className="text-sm text-muted-foreground leading-relaxed">
            This path contains adult dating scenarios. Confirm you're 18 or older to
            unlock it. You'll only be asked once.
          </Text>
          {error && <Text className="text-xs text-muted-foreground mt-3">{error}</Text>}
          <View className="flex-row justify-end gap-3 mt-6">
            <Pressable
              onPress={onClose}
              disabled={busy}
              accessibilityRole="button"
              className="px-4 py-2.5 rounded-full border border-border"
            >
              <Text className="text-sm font-medium text-foreground">Not now</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={busy}
              accessibilityRole="button"
              className={`px-4 py-2.5 rounded-full bg-primary flex-row items-center ${busy ? 'opacity-60' : ''}`}
            >
              {busy && <ActivityIndicator size="small" color={COLORS.primaryForeground} style={{ marginRight: 6 }} />}
              <Text className="text-sm font-bold text-primary-foreground">I'm 18 or older</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
