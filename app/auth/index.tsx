import { View, Text, StyleSheet } from 'react-native'

export default function AuthScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ברוך הבא לגש</Text>
      <Text style={styles.subtitle}>הכנס את מספר הטלפון שלך כדי להתחיל</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
})
