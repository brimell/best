import { Box, Flex, Link, Button, HStack, Icon, Text, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiHome, FiShoppingBag, FiSettings, FiUser, FiStar } from 'react-icons/fi';

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
    <Link
      as={RouterLink}
      to={to}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
    >
      <Flex
        align="center"
        px={4}
        py={2}
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : textColor}
        _hover={{
          bg: isActive ? activeBg : hoverBg,
          color: activeColor,
        }}
      >
        <Icon
          mr={2}
          fontSize="16"
          as={icon}
        />
        <Text fontSize="sm" fontWeight={isActive ? 'bold' : 'normal'}>
          {children}
        </Text>
      </Flex>
    </Link>
  );
};

const Navigation = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const navItems = [
    { icon: FiHome, label: 'Inventory', path: '/inventory' },
    { icon: FiShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: FiStar, label: 'Top Rated', path: '/top-rated' },
    { icon: FiUser, label: 'Profile', path: '/profile' },
    { icon: FiSettings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box bg={bgColor} px={4} borderBottom="1px" borderColor={borderColor} position="fixed" w="100%" zIndex={1000}>
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="container.xl" mx="auto">
        <HStack spacing={8} alignItems="center">
          <Link as={RouterLink} to="/" fontWeight="bold" fontSize="lg">
            Inventory Manager
          </Link>
          {isAuthenticated && (
            <HStack spacing={1}>
              {navItems.map((item) => (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  to={item.path}
                  isActive={location.pathname === item.path}
                >
                  {item.label}
                </NavItem>
              ))}
            </HStack>
          )}
        </HStack>

        <HStack spacing={4}>
          {isAuthenticated ? (
            <Button onClick={handleLogout} variant="ghost">
              Logout
            </Button>
          ) : (
            <>
              <Link as={RouterLink} to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link as={RouterLink} to="/register">
                <Button colorScheme="blue">Register</Button>
              </Link>
            </>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navigation; 