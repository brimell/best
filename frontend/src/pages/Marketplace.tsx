import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    SimpleGrid,
    Heading,
    Text,
    Input,
    Select,
    HStack,
    VStack,
    useToast,
    Badge,
    Image,
    Flex,
    Spacer,
    Button,
    Icon,
    InputGroup,
    InputLeftElement,
    Skeleton,
    SkeletonText,
} from '@chakra-ui/react';
import {
    AiOutlineSearch,
    AiOutlineFilter,
    AiOutlineSortAscending,
    AiOutlineTag,
    AiOutlineEye,
    AiOutlineDollar,
    AiOutlineShoppingCart,
    AiOutlineStar,
} from 'react-icons/ai';
import { useAuth } from '../contexts/AuthContext';
import Rating from '../components/Rating';

interface MarketplaceItem {
    id: number;
    name: string;
    description: string;
    price: number;
    condition: string;
    category: string;
    image_url: string | null;
    seller_id: number;
    seller_name: string;
    average_rating: number;
    total_ratings: number;
    price_point_category_id: number;
}

const Marketplace: React.FC = () => {
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [priceRange, setPriceRange] = useState('');
    const { token, isAuthenticated } = useAuth();
    const toast = useToast();

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/marketplace');
            if (!response.ok) throw new Error('Failed to fetch marketplace items');
            const data = await response.json();
            setItems(data);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load marketplace items',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (itemId: number) => {
        if (!isAuthenticated) {
            toast({
                title: 'Authentication required',
                description: 'Please log in to purchase items',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            const response = await fetch(`/api/transactions/purchase/${itemId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to purchase item');
            }

            toast({
                title: 'Success',
                description: 'Item purchased successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            // Refresh the items list
            fetchItems();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to purchase item',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const filteredItems = items
        .filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (categoryFilter === '' || item.category === categoryFilter) &&
            (priceRange === '' || {
                'under-100': item.price < 100,
                '100-500': item.price >= 100 && item.price <= 500,
                '500-1000': item.price > 500 && item.price <= 1000,
                'over-1000': item.price > 1000
            }[priceRange])
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'rating':
                    return (b.average_rating || 0) - (a.average_rating || 0);
                default:
                    return 0;
            }
        });

    const categories = Array.from(new Set(items.map(item => item.category)));

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Heading size="lg">Marketplace</Heading>

                <HStack spacing={4} wrap="wrap">
                    <InputGroup maxW="300px">
                        <InputLeftElement pointerEvents="none">
                            <Icon as={AiOutlineSearch} color="gray.500" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                    <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        placeholder="All Categories"
                        w="200px"
                        icon={<Icon as={AiOutlineFilter} />}
                    >
                        {categories.map(category => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </Select>
                    <Select
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                        placeholder="Price Range"
                        w="200px"
                        icon={<Icon as={AiOutlineDollar} />}
                    >
                        <option value="under-100">Under $100</option>
                        <option value="100-500">$100 - $500</option>
                        <option value="500-1000">$500 - $1000</option>
                        <option value="over-1000">Over $1000</option>
                    </Select>
                    <Select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        w="200px"
                        icon={<Icon as={AiOutlineSortAscending} />}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating">Sort by Rating</option>
                    </Select>
                </HStack>

                {loading ? (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Box key={i} borderWidth="1px" borderRadius="lg" p={4}>
                                <Skeleton height="200px" mb={4} />
                                <SkeletonText noOfLines={4} spacing={4} />
                            </Box>
                        ))}
                    </SimpleGrid>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {filteredItems.map(item => (
                            <Box
                                key={item.id}
                                borderWidth="1px"
                                borderRadius="lg"
                                overflow="hidden"
                                p={4}
                                _hover={{ shadow: 'md' }}
                                transition="shadow 0.2s"
                            >
                                <VStack align="stretch" spacing={4}>
                                    {item.image_url && (
                                        <Image
                                            src={item.image_url}
                                            alt={item.name}
                                            height="200px"
                                            objectFit="cover"
                                            borderRadius="md"
                                        />
                                    )}
                                    <Heading size="md">{item.name}</Heading>
                                    <Text>{item.description}</Text>
                                    <HStack>
                                        <Badge colorScheme="blue">
                                            <HStack spacing={1}>
                                                <Icon as={AiOutlineTag} />
                                                <Text>{item.category}</Text>
                                            </HStack>
                                        </Badge>
                                        <Badge colorScheme="purple">
                                            <HStack spacing={1}>
                                                <Icon as={AiOutlineEye} />
                                                <Text>{item.condition}</Text>
                                            </HStack>
                                        </Badge>
                                    </HStack>
                                    <HStack>
                                        <Icon as={AiOutlineDollar} />
                                        <Text fontWeight="bold">${item.price.toFixed(2)}</Text>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.500">
                                        Sold by: {item.seller_name}
                                    </Text>
                                    {item.average_rating > 0 && (
                                        <Rating
                                            itemId={item.id}
                                            averageRating={item.average_rating}
                                            totalRatings={item.total_ratings}
                                            pricePointCategoryId={item.price_point_category_id}
                                            onRatingChange={fetchItems}
                                        />
                                    )}
                                    <Button
                                        leftIcon={<Icon as={AiOutlineShoppingCart} />}
                                        colorScheme="blue"
                                        onClick={() => handlePurchase(item.id)}
                                        isDisabled={!isAuthenticated || item.seller_id === parseInt(localStorage.getItem('userId') || '0')}
                                    >
                                        {!isAuthenticated ? 'Login to Purchase' : 
                                         item.seller_id === parseInt(localStorage.getItem('userId') || '0') ? 
                                         'Your Item' : 'Purchase'}
                                    </Button>
                                </VStack>
                            </Box>
                        ))}
                    </SimpleGrid>
                )}

                {!loading && filteredItems.length === 0 && (
                    <Text textAlign="center" color="gray.500">
                        No items found matching your criteria
                    </Text>
                )}
            </VStack>
        </Container>
    );
};

export default Marketplace; 