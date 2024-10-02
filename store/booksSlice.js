import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { firestore } from '../Firebase';

export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async (userId) => {
    const snapshot = await firestore.collection('users').doc(userId).collection('books').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
);

export const addBook = createAsyncThunk(
  'books/addBook',
  async ({ userId, book }) => {
    const docRef = await firestore.collection('users').doc(userId).collection('books').add(book);
    return { id: docRef.id, ...book };
  }
);

export const updateBook = createAsyncThunk(
  'books/updateBook',
  async ({ userId, book }) => {
    await firestore.collection('users').doc(userId).collection('books').doc(book.id).update(book);
    return book;
  }
);

export const deleteBook = createAsyncThunk(
  'books/deleteBook',
  async ({ userId, bookId }) => {
    await firestore.collection('users').doc(userId).collection('books').doc(bookId).delete();
    return bookId;
  }
);

const booksSlice = createSlice({
  name: 'books',
  initialState: [],
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(addBook.fulfilled, (state, action) => {
        state.push(action.payload);
      })
      .addCase(updateBook.fulfilled, (state, action) => {
        const index = state.findIndex(book => book.id === action.payload.id);
        if (index !== -1) {
          state[index] = action.payload;
        }
      })
      .addCase(deleteBook.fulfilled, (state, action) => {
        return state.filter(book => book.id !== action.payload);
      });
  },
});

export default booksSlice.reducer;