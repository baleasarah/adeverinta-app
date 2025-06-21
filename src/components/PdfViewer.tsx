import React from 'react';
import { SafeAreaView, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PdfViewer({ uri }: { uri: string }) {
  // On iOS you can use Google Docs viewer, on Android WebView supports pdf URL natively
  const pdfSource =
    Platform.OS === 'ios'
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri)}`
      : uri;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: pdfSource }}
        style={{ flex: 1 }}
        scalesPageToFit
        startInLoadingState
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});