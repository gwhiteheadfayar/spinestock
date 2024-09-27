import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder, StyleSheet } from 'react-native';

const BookMenuScreen = ({ onClose, onDelete, onEdit }) => {
  const panY = useRef(new Animated.Value(300)).current;

  const resetPosition = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: 300,
    duration: 300,
    useNativeDriver: true,
  });

  useEffect(() => {
    // Slide up the panel when the screen is opened
    Animated.timing(panY, {
      toValue: 0,  // Starts offscreen and slides into place
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gs) => {
        if (gs.dy > 0) {
          panY.setValue(gs.dy);
        }
      },
      onPanResponderRelease: (e, gs) => {
        if (gs.dy > 50) {
          closeAnim.start(onClose);
        } else {
          resetPosition.start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: panY }] },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.handle} />
      <Text style={styles.title}>Manage Book</Text>
      <TouchableOpacity style={styles.optionButton} onPress={onEdit}>
        <Text style={styles.optionText}>Edit Details</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionButton} onPress={onDelete}>
        <Text style={styles.optionText}>Delete Book</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#343b45',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: 300,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  optionText: {
    color: '#343b45',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default BookMenuScreen;
