import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: "AIzaSyAPcSCnI6laKA7Ve9NIBa_-GnQlddTgjW0",
//   authDomain: "adeverinte-d954a.firebaseapp.com",
//   projectId: "adeverinte-d954a",
//   storageBucket: "adeverinte-d954a.firebasestorage.app",
//   messagingSenderId: "42304109954",
//   appId: "1:42304109954:web:35b5098627c42a0acf639b",
// };

export const firebaseConfig = {
  apiKey: "AIzaSyAD6lfFuMoFpyh4MePzbb6eLiNiNROT3AE",
  authDomain: "adeverinte-app-b8cc1.firebaseapp.com",
  projectId: "adeverinte-app-b8cc1",
  storageBucket: "adeverinte-app-b8cc1.firebasestorage.app",
  messagingSenderId: "173171564380",
  appId: "1:173171564380:web:69676aeca34a01e1ce6b99",
};

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
