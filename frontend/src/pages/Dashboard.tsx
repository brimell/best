import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Heading,
    Text,
    useColorModeValue,
    VStack,
    HStack,
    Icon,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { 
    AiFillStar, 
    AiFillEye, 
    AiFillShopping, 
    AiFillDollarCircle,
    AiFillShop,
    AiFillStar as AiFillStarOutline 
} from 'react-icons/ai';

interface DashboardStats {
    totalItems: number;
    totalValue: number;
    activeListings: number;
    totalViews: number;
    totalRatings: number;
    averageRating: number;
    recentActivity: Array<{
        id: number;
        type: string;
        description: string;
        timestamp: string;
    }>;
}

const Dashboard: React.FC = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalItems: 0,
        totalValue: 0,
        activeListings: 0,
        totalViews: 0,
        totalRatings: 0,
        averageRating: 0,
        recentActivity: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        const fetchDashboardStats = async () => {
            if (!token) return;

            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardStats();
    }, [token]);

    const StatCard = ({ label, value, helpText, icon }: { label: string; value: string | number; helpText?: string; icon?: React.ReactElement }) => (
        <Box
            bg={bgColor}
            p={6}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
            _hover={{ shadow: 'md' }}
            transition="shadow 0.2s"
        >
            <HStack spacing={4} align="start">
                {icon && (
                    <Box
                        p={2}
                        bg="blue.50"
                        borderRadius="full"
                        color="blue.500"
                    >
                        {icon}
                    </Box>
                )}
                <VStack align="start" spacing={1}>
                    <Stat>
                        <StatLabel color="gray.600">{label}</StatLabel>
                        <StatNumber fontSize="2xl" fontWeight="bold">
                            {value}
                        </StatNumber>
                        {helpText && (
                            <StatHelpText mb={0} color="gray.500">
                                {helpText}
                            </StatHelpText>
                        )}
                    </Stat>
                </VStack>
            </HStack>
        </Box>
    );

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Box>
                    <Heading as="h1" size="xl" mb={2}>
                        Dashboard
                    </Heading>
                    <Text color="gray.600">
                        Welcome to your inventory management dashboard
                    </Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                    <StatCard
                        label="Total Items"
                        value={stats.totalItems}
                        helpText="Items in inventory"
                        icon={<Icon as={AiFillShopping} boxSize={5} />}
                    />
                    <StatCard
                        label="Total Value"
                        value={`$${stats.totalValue.toFixed(2)}`}
                        helpText="Estimated value of inventory"
                        icon={<Icon as={AiFillDollarCircle} boxSize={5} />}
                    />
                    <StatCard
                        label="Active Listings"
                        value={stats.activeListings}
                        helpText="Items in marketplace"
                        icon={<Icon as={AiFillShop} boxSize={5} />}
                    />
                    <StatCard
                        label="Total Views"
                        value={stats.totalViews}
                        helpText="Marketplace views"
                        icon={<Icon as={AiFillEye} boxSize={5} />}
                    />
                    <StatCard
                        label="Average Rating"
                        value={stats.averageRating.toFixed(1)}
                        helpText="Based on user reviews"
                        icon={<Icon as={AiFillStar} boxSize={5} />}
                    />
                </SimpleGrid>

                <Box>
                    <Heading as="h2" size="lg" mb={4}>
                        Recent Activity
                    </Heading>
                    <VStack spacing={4} align="stretch">
                        {stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((activity, index) => (
                                <Box
                                    key={index}
                                    p={4}
                                    bg={bgColor}
                                    borderRadius="md"
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                >
                                    <HStack justify="space-between">
                                        <Text>{activity.description}</Text>
                                        <Text color="gray.500" fontSize="sm">
                                            {new Date(activity.timestamp).toLocaleDateString()}
                                        </Text>
                                    </HStack>
                                </Box>
                            ))
                        ) : (
                            <Text color="gray.500" textAlign="center">
                                No recent activity
                            </Text>
                        )}
                    </VStack>
                </Box>
            </VStack>
        </Container>
    );
};

export default Dashboard; 