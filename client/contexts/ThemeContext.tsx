import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check localStorage first
    const stored = localStorage.getItem("darkMode");
    if (stored !== null) {
      return JSON.parse(stored);
    }
    // Default to dark mode
    return true;
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const initTheme = async () => {
      const stored = localStorage.getItem("darkMode");
      let theme = isDark;

      // If no localStorage, check Firestore
      if (stored === null && user?.uid) {
        try {
          const userDoc = await import("firebase/firestore").then(
            ({ getDoc }) => getDoc(doc(db, "users", user.uid)),
          );
          if (userDoc.exists() && userDoc.data().darkMode !== undefined) {
            theme = userDoc.data().darkMode;
          }
        } catch (error) {
          console.error("Error loading theme from Firestore:", error);
        }
      } else if (stored !== null) {
        theme = JSON.parse(stored);
      }

      setIsDark(theme);
      applyTheme(theme);
      setIsInitialized(true);
    };

    initTheme();
  }, [user?.uid]);

  // Apply theme to DOM
  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("darkMode", JSON.stringify(newTheme));

    // Sync to Firestore if user is logged in
    if (user?.uid) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          darkMode: newTheme,
        });
      } catch (error) {
        console.error("Error updating theme in Firestore:", error);
      }
    }
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
