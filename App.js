import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Image, FlatList, Text, Dimensions, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import firebase from './Firebase';
import { deleteDoc } from 'firebase/firestore';
import { auth, firestore } from './Firebase';
import SplashScreen from './SplashScreen';
import SignInScreen from './SignInScreen';
import AddBookScreen from './AddBookScreen';
import BookMenuScreen from './BookMenu';
import BookDetailsScreen from './BookDetailsScreen';

const { width } = Dimensions.get('window');
const numColumns = 4;
const itemWidth = (width - 40) / numColumns;

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [books, setBooks] = useState([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBook, setShowAddBook] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);  // To store the selected book for editing or deleting
  const [showBookMenu, setShowBookMenu] = useState(false); // To show the book menu
  const [showBookDetails, setShowBookDetails] = useState(false); //To show book details screen

  const deleteBook = async (bookId) => {
    try {
      const userId = auth.currentUser.uid;
      await firestore.collection('users').doc(userId).collection('books').doc(bookId).delete();
      setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
    } catch (error) {
      console.error('Error deleting book:', error);
      Alert.alert('Error', 'Failed to delete the book. Please try again.');
    }
  };

  //Show edit menu on long press
  const handleLongPress = (book) => {
    setSelectedBook(book);
    setShowBookMenu(true);
  };

  //show details on short press
  const handleBookPress = (book) => {
    setSelectedBook(book);
    setShowBookDetails(true);
  };

  const handleUpdateBook = async (updatedBook) => {
    try {
      const userId = auth.currentUser.uid;
      console.log("Updating book with ID:", updatedBook.id);
      
      if (!updatedBook.id) {
        console.error('Book ID is missing');
        return;
      }
  
      const bookRef = firestore.collection('users').doc(userId).collection('books').doc(updatedBook.id);
      
      // Check if the document exists before updating
      const doc = await bookRef.get();
      if (!doc.exists) {
        console.error('Document does not exist');
        return;
      }
  
      await bookRef.update(updatedBook);
      setBooks(prevBooks => prevBooks.map(book => book.id === updatedBook.id ? updatedBook : book));
    } catch (error) {
      console.error('Error updating book:', error);
      Alert.alert('Error', 'Failed to update book details. Please try again.');
    }
  };

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();

    setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user ? "User signed in" : "User signed out");
      if (user) {
        setIsSignedIn(true);
        setUserEmail(user.email);
        fetchUserBooks(user.uid);
      } else {
        setIsSignedIn(false);
        setUserEmail('');
        setBooks([]);
      }
    });

    return unsubscribe;
  }, []);

  const fetchUserBooks = async (userId) => {
    try {
      const snapshot = await firestore.collection('users').doc(userId).collection('books').get();
      const fetchedBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBooks(fetchedBooks);
    } catch (error) {
      console.error('Error fetching user books:', error);
    }
  };

  const handleSignIn = (email) => {
    console.log("handleSignIn called with email:", email);
    setUserEmail(email);
    setIsSignedIn(true);
  };

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
        await addBookToFirestore(newBook);
        setBooks((prevBooks) => [...prevBooks, newBook]);
      } else {
        Alert.alert('Book not found', 'No book found with the provided ISBN.');
      }
    } catch (error) {
      console.error('Error fetching book data:', error);
      Alert.alert('Error', 'Failed to fetch book data. Please try again.');
    }
  };

  const addBookToFirestore = async (book) => {
    try {
      const userId = auth.currentUser.uid;
      await firestore.collection('users').doc(userId).collection('books').add(book);
    } catch (error) {
      console.error('Error adding book to Firestore:', error);
    }
  };

  // const searchByTitle = async (title) => {
  //   try {
  //     const response = await fetch(`https://openlibrary.org/search.json?title=${title}`);
  //     const data = await response.json();
  //     const book = data.docs[0];
  //     if (book) {
  //       const isbn = book.isbn ? book.isbn[0] : '';
  //       const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  //       const newBook = { isbn, coverUrl, title: book.title };
  //       await addBookToFirestore(newBook);
  //       setBooks((prevBooks) => [...prevBooks, newBook]);
  //     } else {
  //       Alert.alert('Book not found', 'No book found with the provided title.');
  //     }
  //   } catch (error) {
  //     console.error('Error searching by title:', error);
  //     Alert.alert('Error', 'Failed to search for the book. Please try again.');
  //   }
  // };

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity onPress={() => handleBookPress(item)} onLongPress={() => handleLongPress(item)}>
      <View style={styles.bookContainer}>
        <Image source={{ uri: item.coverUrl }} style={styles.coverImage} resizeMode="cover" />
        <Text style={styles.bookTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
      </View>
    </TouchableOpacity>
  ), []);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isSignedIn) {
    return <SignInScreen onSignIn={handleSignIn} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.userEmail}>Logged in as: {userEmail}</Text>
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
              keyExtractor={(item) => item.isbn}
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
                addBookToFirestore(book);
                setBooks((prevBooks) => [...prevBooks, book]);
              }}
              onOpenCamera={() => {
                setShowAddBook(false);
                setShowCamera(true);
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView> //maybe remove scroll and keyavoid or put somewhere else
      )}
      {showBookMenu && selectedBook && (
        <BookMenuScreen
          onClose={() => setShowBookMenu(false)}
          onDelete={() => {
            deleteBook(selectedBook.id);
            setShowBookMenu(false);
          }}
          onEdit={() => {
            // Logic to edit the book can go here
            setShowBookMenu(false);
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
}

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