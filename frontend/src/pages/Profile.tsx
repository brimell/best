import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    VStack,
    HStack,
    Heading,
    Text,
    Avatar,
    Button,
    useToast,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    SimpleGrid,
    Badge,
    Icon,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Divider,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage,
} from '@chakra-ui/react';
import {
    AiOutlineEdit,
    AiOutlineStar,
    AiOutlineShoppingCart,
    AiOutlineDollar,
    AiOutlineUser,
    AiOutlineMail,
    AiOutlineLock,
    AiOutlineSave,
} from 'react-icons/ai';
import { useAuth } from '../contexts/AuthContext';
import Rating from '../components/Rating';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    created_at: string;
    total_items: number;
    active_listings: number;
    total_sales: number;
    average_rating: number;
    total_ratings: number;
}

interface UserRating {
    id: number;
    item_id: number;
    item_name: string;
    item_image_url: string | null;
    rating: number;
    review: string;
    created_at: string;
    price_point_category: string;
}

interface Transaction {
    id: number;
    item_id: number;
    item_name: string;
    item_image_url: string | null;
    price: number;
    seller_id: number;
    seller_name: string;
    buyer_id: number;
    buyer_name: string;
    status: string;
    created_at: string;
}

const Profile: React.FC = () => {
    const { token, user, updateProfile } = useAuth();
    const toast = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [ratings, setRatings] = useState<UserRating[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchRatings();
            fetchTransactions();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch profile');
            const data = await response.json();
            setProfile(data);
            setEditForm(prev => ({
                ...prev,
                username: data.username,
                email: data.email,
            }));
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load profile information',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRatings = async () => {
        try {
            const response = await fetch('/api/ratings/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch ratings');
            const data = await response.json();
            setRatings(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load ratings',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await fetch('/api/transactions/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch transactions');
            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load transactions',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!editForm.username) errors.username = 'Username is required';
        if (!editForm.email) errors.email = 'Email is required';
        if (!editForm.email.includes('@')) errors.email = 'Invalid email format';
        
        if (editForm.newPassword) {
            if (!editForm.currentPassword) {
                errors.currentPassword = 'Current password is required to set a new password';
            }
            if (editForm.newPassword.length < 6) {
                errors.newPassword = 'Password must be at least 6 characters';
            }
            if (editForm.newPassword !== editForm.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: editForm.username,
                    email: editForm.email,
                    currentPassword: editForm.currentPassword,
                    newPassword: editForm.newPassword,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }

            const updatedUser = await response.json();
            updateProfile(updatedUser);
            
            toast({
                title: 'Success',
                description: 'Profile updated successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            
            onClose();
            fetchProfile();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update profile',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    if (loading) {
        return (
            <Container maxW="container.xl" py={8}>
                <Text>Loading profile...</Text>
            </Container>
        );
    }

    if (!profile) {
        return (
            <Container maxW="container.xl" py={8}>
                <Text>Profile not found</Text>
            </Container>
        );
    }

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Box>
                    <HStack spacing={6} align="start">
                        <Avatar
                            size="2xl"
                            name={profile.username}
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`}
                        />
                        <VStack align="start" spacing={2} flex={1}>
                            <HStack>
                                <Heading size="lg">{profile.username}</Heading>
                                <Button
                                    leftIcon={<Icon as={AiOutlineEdit} />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={onOpen}
                                >
                                    Edit Profile
                                </Button>
                            </HStack>
                            <Text color="gray.500">Member since {new Date(profile.created_at).toLocaleDateString()}</Text>
                            <HStack spacing={4}>
                                <Stat>
                                    <StatLabel>Items</StatLabel>
                                    <StatNumber>{profile.total_items}</StatNumber>
                                    <StatHelpText>Total inventory</StatHelpText>
                                </Stat>
                                <Stat>
                                    <StatLabel>Listings</StatLabel>
                                    <StatNumber>{profile.active_listings}</StatNumber>
                                    <StatHelpText>Active listings</StatHelpText>
                                </Stat>
                                <Stat>
                                    <StatLabel>Sales</StatLabel>
                                    <StatNumber>${profile.total_sales.toFixed(2)}</StatNumber>
                                    <StatHelpText>Total sales</StatHelpText>
                                </Stat>
                                <Stat>
                                    <StatLabel>Rating</StatLabel>
                                    <StatNumber>{profile.average_rating.toFixed(1)}</StatNumber>
                                    <StatHelpText>{profile.total_ratings} ratings</StatHelpText>
                                </Stat>
                            </HStack>
                        </VStack>
                    </HStack>
                </Box>

                <Divider />

                <Tabs>
                    <TabList>
                        <Tab>
                            <HStack>
                                <Icon as={AiOutlineStar} />
                                <Text>Ratings & Reviews</Text>
                            </HStack>
                        </Tab>
                        <Tab>
                            <HStack>
                                <Icon as={AiOutlineShoppingCart} />
                                <Text>Transactions</Text>
                            </HStack>
                        </Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                {ratings.map(rating => (
                                    <Box
                                        key={rating.id}
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        p={4}
                                    >
                                        <HStack spacing={4} align="start">
                                            {rating.item_image_url && (
                                                <Image
                                                    src={rating.item_image_url}
                                                    alt={rating.item_name}
                                                    boxSize="100px"
                                                    objectFit="cover"
                                                    borderRadius="md"
                                                />
                                            )}
                                            <VStack align="start" spacing={2} flex={1}>
                                                <Heading size="sm">{rating.item_name}</Heading>
                                                <Badge colorScheme="blue">{rating.price_point_category}</Badge>
                                                <Rating
                                                    itemId={rating.item_id}
                                                    averageRating={rating.rating}
                                                    totalRatings={1}
                                                    userRating={rating.rating}
                                                    userReview={rating.review}
                                                    pricePointCategoryId={undefined}
                                                    onRatingChange={fetchRatings}
                                                />
                                                {rating.review && (
                                                    <Text fontSize="sm" color="gray.600">
                                                        {rating.review}
                                                    </Text>
                                                )}
                                                <Text fontSize="xs" color="gray.500">
                                                    Rated on {new Date(rating.created_at).toLocaleDateString()}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </Box>
                                ))}
                                {ratings.length === 0 && (
                                    <Text textAlign="center" color="gray.500">
                                        No ratings yet
                                    </Text>
                                )}
                            </VStack>
                        </TabPanel>

                        <TabPanel>
                            <VStack spacing={4} align="stretch">
                                {transactions.map(transaction => (
                                    <Box
                                        key={transaction.id}
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        p={4}
                                    >
                                        <HStack spacing={4} align="start">
                                            {transaction.item_image_url && (
                                                <Image
                                                    src={transaction.item_image_url}
                                                    alt={transaction.item_name}
                                                    boxSize="100px"
                                                    objectFit="cover"
                                                    borderRadius="md"
                                                />
                                            )}
                                            <VStack align="start" spacing={2} flex={1}>
                                                <Heading size="sm">{transaction.item_name}</Heading>
                                                <HStack>
                                                    <Badge colorScheme={
                                                        transaction.status === 'completed' ? 'green' :
                                                        transaction.status === 'pending' ? 'yellow' :
                                                        'red'
                                                    }>
                                                        {transaction.status}
                                                    </Badge>
                                                    <Text fontSize="sm" color="gray.500">
                                                        {transaction.buyer_id === user?.id ? 'Bought from' : 'Sold to'}:{' '}
                                                        {transaction.buyer_id === user?.id ? transaction.seller_name : transaction.buyer_name}
                                                    </Text>
                                                </HStack>
                                                <HStack>
                                                    <Icon as={AiOutlineDollar} />
                                                    <Text fontWeight="bold">${transaction.price.toFixed(2)}</Text>
                                                </HStack>
                                                <Text fontSize="xs" color="gray.500">
                                                    {new Date(transaction.created_at).toLocaleDateString()}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </Box>
                                ))}
                                {transactions.length === 0 && (
                                    <Text textAlign="center" color="gray.500">
                                        No transactions yet
                                    </Text>
                                )}
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>

                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Edit Profile</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4}>
                                <FormControl isInvalid={!!formErrors.username}>
                                    <FormLabel>
                                        <HStack>
                                            <Icon as={AiOutlineUser} />
                                            <Text>Username</Text>
                                        </HStack>
                                    </FormLabel>
                                    <Input
                                        value={editForm.username}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                    />
                                    <FormErrorMessage>{formErrors.username}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={!!formErrors.email}>
                                    <FormLabel>
                                        <HStack>
                                            <Icon as={AiOutlineMail} />
                                            <Text>Email</Text>
                                        </HStack>
                                    </FormLabel>
                                    <Input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                    <FormErrorMessage>{formErrors.email}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={!!formErrors.currentPassword}>
                                    <FormLabel>
                                        <HStack>
                                            <Icon as={AiOutlineLock} />
                                            <Text>Current Password</Text>
                                        </HStack>
                                    </FormLabel>
                                    <Input
                                        type="password"
                                        value={editForm.currentPassword}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    />
                                    <FormErrorMessage>{formErrors.currentPassword}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={!!formErrors.newPassword}>
                                    <FormLabel>New Password</FormLabel>
                                    <Input
                                        type="password"
                                        value={editForm.newPassword}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                    />
                                    <FormErrorMessage>{formErrors.newPassword}</FormErrorMessage>
                                </FormControl>

                                <FormControl isInvalid={!!formErrors.confirmPassword}>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <Input
                                        type="password"
                                        value={editForm.confirmPassword}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    />
                                    <FormErrorMessage>{formErrors.confirmPassword}</FormErrorMessage>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="ghost" mr={3} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                colorScheme="blue"
                                onClick={handleSubmit}
                                leftIcon={<Icon as={AiOutlineSave} />}
                            >
                                Save Changes
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Container>
    );
};

export default Profile;