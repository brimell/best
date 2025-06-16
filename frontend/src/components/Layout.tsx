import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  IconButton,
  useColorMode,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Button,
  Text,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { HamburgerIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Top Rated', path: '/top-rated' },
    { name: 'Profile', path: '/profile' },
  ];

  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
    const isActive = location.pathname === to;
    return (
      <ChakraLink
        as={RouterLink}
        to={to}
        px={4}
        py={2}
        rounded="md"
        bg={isActive ? 'blue.500' : 'transparent'}
        color={isActive ? 'white' : 'inherit'}
        _hover={{
          textDecoration: 'none',
          bg: isActive ? 'blue.600' : 'gray.100',
        }}
      >
        {children}
      </ChakraLink>
    );
  };

  return (
    <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.900'}>
      {/* Mobile Navigation */}
      <Box display={{ base: 'block', md: 'none' }} p={4}>
        <Flex justify="space-between" align="center">
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            onClick={onOpen}
            variant="ghost"
          />
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />
        </Flex>
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {navItems.map((item) => (
                <NavLink key={item.path} to={item.path}>
                  {item.name}
                </NavLink>
              ))}
              <Button onClick={logout} colorScheme="red" variant="ghost">
                Logout
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop Navigation */}
      <Flex>
        <Box
          w={{ base: 'full', md: '64' }}
          h="100vh"
          position="fixed"
          display={{ base: 'none', md: 'block' }}
          bg={colorMode === 'light' ? 'white' : 'gray.800'}
          borderRight="1px"
          borderColor={colorMode === 'light' ? 'gray.200' : 'gray.700'}
          p={4}
        >
          <VStack spacing={4} align="stretch">
            <Text fontSize="xl" fontWeight="bold" mb={4}>
              Inventory App
            </Text>
            {navItems.map((item) => (
              <NavLink key={item.path} to={item.path}>
                {item.name}
              </NavLink>
            ))}
            <Button onClick={logout} colorScheme="red" variant="ghost" mt="auto">
              Logout
            </Button>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
            />
          </VStack>
        </Box>

        {/* Main Content */}
        <Box
          ml={{ base: 0, md: '64' }}
          w={{ base: 'full', md: 'calc(100% - 16rem)' }}
          p={4}
        >
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout; 