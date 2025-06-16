import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    SimpleGrid,
    Heading,
    Text,
    Button,
    Input,
    Select,
    HStack,
    VStack,
    useToast,
    Badge,
    Image,
    Flex,
    Spacer,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Icon,
    InputGroup,
    InputLeftElement,
    useDisclosure,
    Card,
    CardBody,
    StatGroup,
    Grid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
} from '@chakra-ui/react';
import { 
    AiOutlinePlus,
    AiOutlineDown,
    AiOutlineEdit,
    AiOutlineDelete,
    AiOutlineShoppingCart,
    AiOutlineSearch,
    AiOutlineFilter,
    AiOutlineSortAscending,
    AiOutlineStar,
    AiOutlineEye,
    AiOutlineDollar,
    AiOutlineTag,
    AiOutlineCheckCircle,
    AiOutlineCloseCircle
} from 'react-icons/ai';
import { useAuth } from '../contexts/AuthContext';
import Rating from '../components/Rating';
import AddItemModal from '../components/AddItemModal';

interface InventoryItem {
    id: number;
    name: string;
    description: string;
    price: number;
    condition: string;
    category: string;
    image_url: string | null;
    average_rating: number;
    total_ratings: number;
    is_listed: boolean;
    price_point_category_id: number;
}

interface InventoryStats {
    total_items: number;
    total_new_value: number;
    total_resell_value: number;
    avg_want_rating: number;
    avg_need_rating: number;
}

const Inventory: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('DESC');
    const { token } = useAuth();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [stats, setStats] = useState<InventoryStats>({
        total_items: 0,
        total_new_value: 0,
        total_resell_value: 0,
        avg_want_rating: 0,
        avg_need_rating: 0
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const queryParams = new URLSearchParams({
                search: searchTerm,
                category_id: categoryFilter,
                sort_by: sortBy,
                sort_order: sortOrder
            });

            const response = await fetch(`/api/inventory?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch inventory');
            const data = await response.json();
            setItems(data);

            // Calculate stats
            const stats = data.reduce((acc: InventoryStats, item: InventoryItem) => {
                acc.total_items += 1;
                acc.total_new_value += item.price;
                acc.total_resell_value += item.price;
                acc.avg_want_rating += item.average_rating || 0;
                acc.avg_need_rating += item.average_rating || 0;
                return acc;
            }, {
                total_items: 0,
                total_new_value: 0,
                total_resell_value: 0,
                avg_want_rating: 0,
                avg_need_rating: 0
            });

            // Calculate averages
            if (data.length > 0) {
                stats.avg_want_rating /= data.length;
                stats.avg_need_rating /= data.length;
            }

            setStats(stats);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load inventory items',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (itemId: number) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await fetch(`/api/inventory/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete item');
            
            setItems(items.filter(item => item.id !== itemId));
            toast({
                title: 'Success',
                description: 'Item deleted successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete item',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleToggleListing = async (itemId: number, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/inventory/${itemId}/toggle-listing`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_listed: !currentStatus })
            });
            if (!response.ok) throw new Error('Failed to update listing status');
            
            setItems(items.map(item => 
                item.id === itemId 
                    ? { ...item, is_listed: !currentStatus }
                    : item
            ));
            toast({
                title: 'Success',
                description: `Item ${!currentStatus ? 'listed' : 'unlisted'} successfully`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update listing status',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const filteredItems = items
        .filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (categoryFilter === '' || item.category === categoryFilter)
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price':
                    return a.price - b.price;
                case 'rating':
                    return (b.average_rating || 0) - (a.average_rating || 0);
                default:
                    return 0;
            }
        });

    const categories = Array.from(new Set(items.map(item => item.category)));

    return (
        <Container maxW="container.xl" py={8}>
            {/* Mini Dashboard */}
            <Card mb={8}>
                <CardBody>
                    <StatGroup>
                        <Grid templateColumns="repeat(5, 1fr)" gap={6} width="100%">
                            <Stat>
                                <StatLabel>Total Items</StatLabel>
                                <StatNumber>{stats.total_items}</StatNumber>
                                <StatHelpText>
                                    <StatArrow type="increase" />
                                    {items.length} unique items
                                </StatHelpText>
                            </Stat>

                            <Stat>
                                <StatLabel>Total New Value</StatLabel>
                                <StatNumber>£{stats.total_new_value.toFixed(2)}</StatNumber>
                                <StatHelpText>
                                    Average: £{(stats.total_new_value / stats.total_items || 0).toFixed(2)}
                                </StatHelpText>
                            </Stat>

                            <Stat>
                                <StatLabel>Total Resell Value</StatLabel>
                                <StatNumber>£{stats.total_resell_value.toFixed(2)}</StatNumber>
                                <StatHelpText>
                                    Average: £{(stats.total_resell_value / stats.total_items || 0).toFixed(2)}
                                </StatHelpText>
                            </Stat>

                            <Stat>
                                <StatLabel>Average Want Rating</StatLabel>
                                <StatNumber>{stats.avg_want_rating.toFixed(1)}</StatNumber>
                                <StatHelpText>
                                    Out of 10
                                </StatHelpText>
                            </Stat>

                            <Stat>
                                <StatLabel>Average Need Rating</StatLabel>
                                <StatNumber>{stats.avg_need_rating.toFixed(1)}</StatNumber>
                                <StatHelpText>
                                    Out of 10
                                </StatHelpText>
                            </Stat>
                        </Grid>
                    </StatGroup>
                </CardBody>
            </Card>

            <VStack spacing={8} align="stretch">
                <Flex justify="space-between" align="center">
                    <Heading size="lg">My Inventory</Heading>
                    <Button
                        leftIcon={<Icon as={AiOutlinePlus} />}
                        colorScheme="blue"
                        onClick={onOpen}
                    >
                        Add Item
                    </Button>
                </Flex>

                <HStack spacing={4}>
                    <InputGroup>
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
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        w="200px"
                        icon={<Icon as={AiOutlineSortAscending} />}
                    >
                        <option value="name">Sort by Name</option>
                        <option value="price">Sort by Price</option>
                        <option value="rating">Sort by Rating</option>
                    </Select>
                    <Button
                        onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                    >
                        {sortOrder === 'ASC' ? '↑' : '↓'}
                    </Button>
                </HStack>

                {loading ? (
                    <Text>Loading inventory...</Text>
                ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {filteredItems.map(item => (
                            <Box
                                key={item.id}
                                borderWidth="1px"
                                borderRadius="lg"
                                overflow="hidden"
                                p={4}
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
                                        {item.is_listed && (
                                            <Badge colorScheme="green">
                                                <HStack spacing={1}>
                                                    <Icon as={AiOutlineCheckCircle} />
                                                    <Text>Listed</Text>
                                                </HStack>
                                            </Badge>
                                        )}
                                    </HStack>
                                    <HStack>
                                        <Icon as={AiOutlineDollar} />
                                        <Text fontWeight="bold">${(item.price ?? 0).toFixed(2)}</Text>
                                    </HStack>
                                    {item.average_rating > 0 && (
                                        <Rating
                                            itemId={item.id}
                                            averageRating={item.average_rating}
                                            totalRatings={item.total_ratings}
                                            pricePointCategoryId={item.price_point_category_id}
                                            onRatingChange={() => fetchInventory()}
                                        />
                                    )}
                                    <Flex>
                                        <Spacer />
                                        <Menu>
                                            <MenuButton
                                                as={IconButton}
                                                icon={<Icon as={AiOutlineDown} />}
                                                variant="ghost"
                                                size="sm"
                                            />
                                            <MenuList>
                                                <MenuItem
                                                    icon={<Icon as={AiOutlineEdit} />}
                                                    onClick={() => {/* TODO: Implement edit modal */}}
                                                >
                                                    Edit
                                                </MenuItem>
                                                <MenuItem
                                                    icon={<Icon as={AiOutlineDelete} />}
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    Delete
                                                </MenuItem>
                                                <MenuItem
                                                    icon={<Icon as={item.is_listed ? AiOutlineCloseCircle : AiOutlineShoppingCart} />}
                                                    onClick={() => handleToggleListing(item.id, item.is_listed)}
                                                >
                                                    {item.is_listed ? 'Unlist Item' : 'List Item'}
                                                </MenuItem>
                                            </MenuList>
                                        </Menu>
                                    </Flex>
                                </VStack>
                            </Box>
                        ))}
                    </SimpleGrid>
                )}
            </VStack>

            <AddItemModal
                isOpen={isOpen}
                onClose={onClose}
                onItemAdded={fetchInventory}
            />
        </Container>
    );
};

export default Inventory; 