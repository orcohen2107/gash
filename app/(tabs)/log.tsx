import { View, Text, StyleSheet } from 'react-native'

export default function LogScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>תיעוד גישה</Text>
      <Text style={styles.subtitle}>טופס התיעוד יופיע כאן</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
})
