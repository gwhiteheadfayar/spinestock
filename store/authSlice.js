import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth } from '../Firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }) => {
    await signInWithEmailAndPassword(auth, email, password);
    return { email, uid: auth.currentUser.uid };
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password }) => {
    await createUserWithEmailAndPassword(auth, email, password);
    return { email, uid: auth.currentUser.uid };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isSignedIn: false,
  },
  reducers: {
    signOut: (state) => {
      state.user = null;
      state.isSignedIn = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isSignedIn = true;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isSignedIn = true;
      });
  },
});

export const { signOut } = authSlice.actions;
export default authSlice.reducer;