/**
 * PaperPod Tactile Zoomable Figure Component
 * Supports pinch-to-zoom, pan, double-tap reset, and smooth gestures across Web & Mobile.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  ImageSourcePropType,
} from 'react-native';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react-native';
import { theme } from '../../theme';

interface ZoomableFigureProps {
  source: ImageSourcePropType | { uri: string };
  aspectRatio?: number;
  maxScale?: number;
  minScale?: number;
  onDoubleTap?: () => void;
  style?: any;
}

export const ZoomableFigure: React.FC<ZoomableFigureProps> = ({
  source,
  aspectRatio = 1.2,
  maxScale = 3.5,
  minScale = 1.0,
  onDoubleTap,
  style,
}) => {
  const [scale, setScale] = useState(1.0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  const lastTapRef = useRef<number>(0);
  const initialDistanceRef = useRef<number | null>(null);
  const baseScaleRef = useRef<number>(1.0);

  // Pan Responder for multi-touch pinch & pan gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
          // Double Tap Triggered
          handleDoubleTap();
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;

        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          if (touch1 && touch2) {
            const dist = Math.hypot(touch1.pageX - touch2.pageX, touch1.pageY - touch2.pageY);
            initialDistanceRef.current = dist;
            baseScaleRef.current = scale;
          }
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
          // Two-finger Pinch Zoom
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          if (touch1 && touch2 && initialDistanceRef.current && initialDistanceRef.current > 0) {
            const dist = Math.hypot(touch1.pageX - touch2.pageX, touch1.pageY - touch2.pageY);
            const pinchRatio = dist / initialDistanceRef.current;
            const newScale = Math.max(minScale, Math.min(maxScale, baseScaleRef.current * pinchRatio));
            setScale(newScale);
          }
        } else if (scale > 1.05) {
          // One-finger Pan while zoomed in
          setTranslateX((prev) => {
            const maxPan = (scale - 1) * 120;
            return Math.max(-maxPan, Math.min(maxPan, prev + gestureState.dx * 0.15));
          });
          setTranslateY((prev) => {
            const maxPan = (scale - 1) * 100;
            return Math.max(-maxPan, Math.min(maxPan, prev + gestureState.dy * 0.15));
          });
        }
      },
      onPanResponderRelease: () => {
        initialDistanceRef.current = null;
      },
    })
  ).current;

  const handleDoubleTap = () => {
    if (scale > 1.2) {
      handleResetZoom();
    } else {
      setScale(2.2);
    }
    if (onDoubleTap) onDoubleTap();
  };

  const handleResetZoom = () => {
    setScale(1.0);
    setTranslateX(0);
    setTranslateY(0);
  };

  const handleStepZoomIn = () => {
    setScale((prev) => Math.min(maxScale, Number((prev + 0.5).toFixed(1))));
  };

  const handleStepZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(minScale, Number((prev - 0.5).toFixed(1)));
      if (next <= 1.0) {
        setTranslateX(0);
        setTranslateY(0);
      }
      return next;
    });
  };

  return (
    <View style={[styles.container, style]}>
      {/* Interactive Gesture Container */}
      <View style={styles.imageViewport} {...panResponder.panHandlers}>
        <View
          style={[
            styles.transformWrapper,
            {
              transform: [
                { translateX },
                { translateY },
                { scale },
              ],
            },
          ]}
        >
          <Image
            source={source}
            style={[styles.image, { aspectRatio }]}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Floating Zoom Controls Overlay */}
      <View style={styles.controlsBar}>
        {scale > 1.05 && (
          <TouchableOpacity
            style={styles.controlPill}
            onPress={handleResetZoom}
            activeOpacity={0.7}
          >
            <RotateCcw size={12} color="#FFFFFF" />
            <Text style={styles.controlText}>Reset</Text>
          </TouchableOpacity>
        )}

        <View style={styles.scaleBadge}>
          <Text style={styles.scaleText}>{scale.toFixed(1)}x</Text>
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleStepZoomOut}
          disabled={scale <= minScale}
          activeOpacity={0.7}
        >
          <ZoomOut size={14} color={scale <= minScale ? '#4A4D55' : '#FFFFFF'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleStepZoomIn}
          disabled={scale >= maxScale}
          activeOpacity={0.7}
        >
          <ZoomIn size={14} color={scale >= maxScale ? '#4A4D55' : '#D97736'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#090A0C',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  imageViewport: {
    width: '100%',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  transformWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    maxHeight: 380,
  },
  controlsBar: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 119, 54, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  scaleBadge: {
    paddingHorizontal: 4,
  },
  scaleText: {
    color: '#D97736',
    fontSize: 10.5,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  iconBtn: {
    padding: 3,
  },
});
