import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDnbShYlNil3sQxTbi8SlLmE-v2MMa4gJo",
  authDomain: "tsuproject-46e4b.firebaseapp.com",
  projectId: "tsuproject-46e4b",
  storageBucket: "tsuproject-46e4b.appspot.com",
  messagingSenderId: "778827424787",
  appId: "1:778827424787:web:2bcf692f84dd3cae034be6",
  measurementId: "G-WL9HGY1DRF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const Storage = getStorage(app)



export default Storage



