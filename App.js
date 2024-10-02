import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Image, FlatList, Text, Dimensions, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store';
import { fetchBooks, addBook, updateBook, deleteBook } from './store/booksSlice';
import { signOut } from './store/authSlice';
import SplashScreen from './SplashScreen';
import SignInScreen from './SignInScreen';
import AddBookScreen from './AddBookScreen';
import BookMenuScreen from './BookMenu';
import BookDetailsScreen from './BookDetailsScreen';

const { width } = Dimensions.get('window');
const numColumns = 4;
const itemWidth = (width - 40) / numColumns;

const AppContent = () => {
  const dispatch = useDispatch();
  const { isSignedIn, user } = useSelector(state => state.auth);
  const books = useSelector(state => state.books);

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookMenu, setShowBookMenu] = useState(false);
  const [showBookDetails, setShowBookDetails] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();

    setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    if (isSignedIn && user) {
      dispatch(fetchBooks(user.uid));
    }
  }, [isSignedIn, user, dispatch]);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    setShowCamera(false);
    searchIsbn(data);
  };

  const searchIsbn = async (isbn) => {
    try {
      const response = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
      const data = await response.json();
      const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
      const title = data.title || 'Unknown Title';

      if (title !== 'Unknown Title' && coverUrl) {
        const newBook = { isbn, coverUrl, title };
        dispatch(addBook({ userId: user.uid, book: newBook }));
      } else {
        Alert.alert('Book not found', 'No book found with the provided ISBN.');
      }
    } catch (error) {
      console.error('Error fetching book data:', error);
      Alert.alert('Error', 'Failed to fetch book data. Please try again.');
    }
  };

  const handleDeleteBook = (bookId) => {
    dispatch(deleteBook({ userId: user.uid, bookId }));
  };

  const handleUpdateBook = (updatedBook) => {
    dispatch(updateBook({ userId: user.uid, book: updatedBook }));
  };

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity onPress={() => handleBookPress(item)} onLongPress={() => handleLongPress(item)}>
      <View style={styles.bookContainer}>
        <Image source={{ uri: item.coverUrl }} style={styles.coverImage} resizeMode="cover" />
        <Text style={styles.bookTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
      </View>
    </TouchableOpacity>
  ), []);

  const handleLongPress = (book) => {
    setSelectedBook(book);
    setShowBookMenu(true);
  };

  const handleBookPress = (book) => {
    setSelectedBook(book);
    setShowBookDetails(true);
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isSignedIn) {
    return <SignInScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.userEmail}>Logged in as: {user.email}</Text>
      {showCamera ? (
        <View style={styles.cameraContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417', 'ean13'],
            }}
            style={StyleSheet.absoluteFillObject}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {books.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Add a book!</Text>
            </View>
          ) : (
            <FlatList
              data={books}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              numColumns={4}
              style={styles.bookGrid}
            />
          )}
          <TouchableOpacity
            style={styles.logButton}
            onPress={() => setShowAddBook(true)}
          >
            <Text style={styles.logButtonText}>+</Text>
          </TouchableOpacity>
        </>
      )}
      {showAddBook && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <AddBookScreen
              onClose={() => setShowAddBook(false)}
              onAddBook={(book) => {
                dispatch(addBook({ userId: user.uid, book }));
                setShowAddBook(false);
              }}
              onOpenCamera={() => {
                setShowAddBook(false);
                setShowCamera(true);
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      {showBookMenu && selectedBook && (
        <BookMenuScreen
          onClose={() => setShowBookMenu(false)}
          onDelete={() => {
            handleDeleteBook(selectedBook.id);
            setShowBookMenu(false);
          }}
          onEdit={() => {
            setShowBookMenu(false);
            setShowBookDetails(true);
          }}
        />
      )}
      {showBookDetails && selectedBook && (
        <BookDetailsScreen
          book={selectedBook}
          onClose={() => setShowBookDetails(false)}
          onUpdateBook={handleUpdateBook}
        />
      )}
    </View>
  );
};

const App = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
);


export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#343b45',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  userEmail: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
    backgroundColor: '#2a2e39',
  },
  bookContainer: {
    width: itemWidth,
    marginBottom: 20,
    alignItems: 'center',
  },
  coverImage: {
    width: itemWidth - 20,
    height: (itemWidth - 20) * 1.5, // Assuming a 2:3 aspect ratio for book covers
    borderRadius: 8,
  },
  bookTitle: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    width: itemWidth - 20,
  },
  bookGrid: {
    paddingTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
  },
  logButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logButtonText: {
    color: '#343b45',
    fontSize: 30,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#343b45',
    fontWeight: 'bold',
  },
});