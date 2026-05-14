import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { buildNoCookieEmbedUrl } from '@/lib/integrations/youtube';

interface Props {
  videoId: string;
  height?: number;
}

export function VideoPlayer({ videoId, height = 220 }: Props) {
  const embedUrl = buildNoCookieEmbedUrl(videoId);

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ uri: embedUrl }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        style={styles.webview}
        renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color="#0F2D5A" />}
        startInLoadingState
        javaScriptEnabled
        // No third-party cookies; we use youtube-nocookie.com
        thirdPartyCookiesEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
});
