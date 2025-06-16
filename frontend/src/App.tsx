import React, { useEffect } from 'react';
import { ChakraProvider, CSSReset, Spinner, Center } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';

// Layout components
import Layout from './components/Layout';

// Page components
import Login from './pages/Login';
import Register from './pages/Register';
import Inventory from './pages/Inventory';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import TopRatedItems from './pages/TopRatedItems';
import ProtectedRoute from './components/ProtectedRoute';

// Protected route wrapper
const ProtectedRouteComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Center>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

const App: React.FC = () => {
  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketplace"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Marketplace />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/top-rated"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TopRatedItems />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Redirect root to inventory */}
            <Route path="/" element={<Navigate to="/inventory" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
};

export default App; 