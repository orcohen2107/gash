import { View, Text, StyleSheet } from 'react-native'

export default function VerifyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>אימות קוד</Text>
      <Text style={styles.subtitle}>הכנס את הקוד שנשלח אליך ב-SMS</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
})
