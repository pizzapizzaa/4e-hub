import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, disabled = false }: PrimaryButtonProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.shadow} />
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled}
        onPress={onPress}
        style={[styles.button, disabled && styles.buttonDisabled]}>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'center',
    margin: 20,
  },
  shadow: {
    position: 'absolute',
    bottom: -6,
    left: 4,
    right: -4,
    height: '100%',
    backgroundColor: '#2B1800',
    borderRadius: 5,
    zIndex: 0,
  },
  button: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: '#FFA12B',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 5,
    shadowColor: '#FFE5C4',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    borderBottomWidth: 6,
    borderBottomColor: '#915100',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    color: '#FFFFFF',
    fontFamily: 'System',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    letterSpacing: 1,
  },
});
