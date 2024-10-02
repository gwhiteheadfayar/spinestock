//screen for book details in library

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated, PanResponder, ScrollView, ActivityIndicator } from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { updateBook } from './store/booksSlice';

const BookDetailsScreen = ({ book, onClose }) => {
  const dispatch = useDispatch();
  const userId = useSelector(state => state.auth.user.uid);

  const handleUpdateBook = async (updatedBook) => {
    await dispatch(updateBook({ userId, book: updatedBook }));
  };

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);

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
    if (book && book.id) {
      fetchBookDetails();

    Animated.timing(panY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }
  }, [book]);

  const fetchBookDetails = async () => {
    if (!book.isbn) return; // Ensure there's an ISBN before trying to fetch details
  
    try {
      const response = await fetch(`https://openlibrary.org/isbn/${book.isbn}.json`);
      const data = await response.json();
  
      let authorName = book.author || 'Unknown Author';
      if (data.authors && data.authors.length > 0) {
        const authorResponse = await fetch(`https://openlibrary.org${data.authors[0].key}.json`);
        const authorData = await authorResponse.json();
        authorName = authorData.name || book.author || 'Unknown Author';
      }
  
      const bookDetails = {
        title: data.title || book.title || 'Unknown Title',
        author: authorName,
        description: data.description ? (typeof data.description === 'string' ? data.description : data.description.value || 'No description available.') : 'No description available.',
        publishDate: data.publish_date || 'Unknown',
        pageCount: data.number_of_pages || 'Unknown',
      };
  
      // Only update book details if book.id exists
      if (book.id) {
        setDetails(bookDetails);
        setLoading(false);
        onUpdateBook({ ...book, ...bookDetails });
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
      setLoading(false);
      setDetails({
        title: book.title || 'Unknown Title',
        author: book.author || 'Unknown Author',
        description: 'Failed to load book details.',
        publishDate: 'Unknown',
        pageCount: 'Unknown',
      });
    }
  };

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
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <>
            <Image source={{ uri: book.coverUrl }} style={styles.coverImage} resizeMode="contain" />
            <Text style={styles.title}>{details.title}</Text>
            <Text style={styles.author}>{details.author}</Text>
            <Text style={styles.info}>Published: {details.publishDate}</Text>
            <Text style={styles.info}>Pages: {details.pageCount}</Text>
            <Text style={styles.description}>{details.description}</Text>
          </>
        )}
      </ScrollView>
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
    height: '80%',
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  content: {
    alignItems: 'center',
  },
  coverImage: {
    width: 150,
    height: 225,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  author: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  rating: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#343b45',
  },
  info: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 10,
  },
});

export default BookDetailsScreen;