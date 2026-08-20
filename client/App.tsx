import React from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Headphones } from 'lucide-react-native';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090D16" />
        <View style={styles.header}>
          <View style={styles.badge}>
            <Sparkles size={14} color="#60A5FA" />
            <Text style={styles.badgeText}>PaperPod Core AI</Text>
          </View>
          <Text style={styles.title}>PaperPod</Text>
          <Text style={styles.subtitle}>
            Interactive 2-Host AI Audio Research Companion
          </Text>
        </View>

        <View style={styles.card}>
          <Headphones size={32} color="#38BDF8" />
          <Text style={styles.cardTitle}>Ready to Ingest</Text>
          <Text style={styles.cardDesc}>
            Upload an arXiv link or PDF paper to generate your first dual-host audio briefing.
          </Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 16,
  },
  badgeText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  card: {
    backgroundColor: '#131B2E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  cardDesc: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
