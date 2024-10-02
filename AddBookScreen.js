import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, PanResponder, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addBook } from './store/booksSlice';

const AddBookScreen = ({ onClose, onOpenCamera }) => {
  const dispatch = useDispatch();
  const userId = useSelector(state => state.auth.user.uid);

  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('isbn');
  const [author, setAuthor] = useState('');

  const panY = useRef(new Animated.Value(0)).current;

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

  const handleSubmit = async () => {
    if (mode === 'isbn' && isbn) {
      try {
        const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
        const data = await response.json();
        const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
        const bookTitle = data.title || 'Unknown Title';

        if (bookTitle !== 'Unknown Title' && coverUrl) {
          dispatch(addBook({ 
            userId, 
            book: { 
              title: bookTitle, 
              author: data.authors?.[0]?.name, 
              isbn, 
              coverUrl 
            } 
          }));
          onClose();
        } else {
          Alert.alert('Book not found', 'No book found with the provided ISBN.');
        }
      } catch (error) {
        console.error('Error fetching book data:', error);
        Alert.alert('Error', 'Failed to fetch book data. Please try again.');
      }
    } else if (mode === 'title' && title) {
      try {
        let query = `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=1&mode=everything`;
        if (author) {
          query += `&author=${encodeURIComponent(author)}`;
        }
    
        const response = await fetch(query);
        const data = await response.json();
        const book = data.docs[0];
        if (book && book.cover_i) {
          const cover = book.cover_i;
          const coverUrl = `https://covers.openlibrary.org/b/id/${cover}-M.jpg`;
          dispatch(addBook({ 
            userId, 
            book: { 
              title: book.title, 
              author: book.author_name?.[0], 
              isbn: book.isbn?.[0], 
              coverUrl 
            } 
          }));
          onClose();
        } else {
          Alert.alert('Book not found', 'No book found with the provided title and author, or cover image not available.');
        }
      } catch (error) {
        console.error('Error searching by title and author:', error);
        Alert.alert('Error', 'Failed to search for the book. Please try again.');
      }
    }
  };

  useEffect(() => {
    Animated.timing(panY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: panY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Add a Book</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === 'isbn' && styles.activeTab]}
              onPress={() => setMode('isbn')}
            >
              <Text style={styles.tabText}>ISBN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'title' && styles.activeTab]}
              onPress={() => setMode('title')}
            >
              <Text style={styles.tabText}>Title</Text>
            </TouchableOpacity>
          </View>
          {mode === 'isbn' ? (
            <TextInput
              style={styles.input}
              placeholder="Enter ISBN"
              value={isbn}
              onChangeText={setIsbn}
              keyboardType="numeric"
            />
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter Title"
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Author (optional)"
                value={author}
                onChangeText={setAuthor}
              />
            </>
          )}
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Add Book</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onOpenCamera}>
            <Text style={styles.buttonText}>Scan Barcode</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#343b45',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#343b45',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddBookScreen;