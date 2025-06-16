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
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { HamburgerIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiShoppingBag, FiSettings, FiUser } from 'react-icons/fi';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItemProps {
  icon: any;
  children: React.ReactNode;
  to: string;
  isActive?: boolean;
}

const NavItem = ({ icon, children, to, isActive }: NavItemProps) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('blue.600', 'blue.200');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
      px={4}
      py={2}
      rounded="md"
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : textColor}
      _hover={{
        textDecoration: 'none',
        bg: isActive ? activeBg : hoverBg,
      }}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
      >
        <Icon
          mr="4"
          fontSize="16"
          as={icon}
        />
        <Text fontSize="sm" fontWeight={isActive ? 'bold' : 'normal'}>
          {children}
        </Text>
      </Flex>
    </ChakraLink>
  );
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Navigation />
      {/* Main Content */}
      <Box pt="4rem">
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 