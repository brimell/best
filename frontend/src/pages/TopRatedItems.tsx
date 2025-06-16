import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Heading,
    SimpleGrid,
    Select,
    VStack,
    Text,
    Image,
    Badge,
    useToast,
    Skeleton,
    SkeletonText,
} from '@chakra-ui/react';
import Rating from '../components/Rating';

interface PricePointCategory {
    id: number;
    name: string;
    min_price: number;
    max_price: number;
}

interface TopRatedItem {
    id: number;
    name: string;
    description: string;
    image_url: string;
    price: number;
    average_rating: number;
    total_ratings: number;
    price_point_category_id: number;
    price_point_category: string;
}

const TopRatedItems: React.FC = () => {
    const [pricePoints, setPricePoints] = useState<PricePointCategory[]>([]);
    const [selectedPricePoint, setSelectedPricePoint] = useState<number | null>(null);
    const [items, setItems] = useState<TopRatedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        const fetchPricePoints = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ratings/price-points`);
                if (response.ok) {
                    const data = await response.json();
                    setPricePoints(data);
                    if (data.length > 0) {
                        setSelectedPricePoint(data[0].id);
                    }
                }
            } catch (error) {
                console.error('Error fetching price points:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load price point categories',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        };

        fetchPricePoints();
    }, [toast]);

    useEffect(() => {
        const fetchTopRatedItems = async () => {
            if (!selectedPricePoint) return;

            setIsLoading(true);
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/api/ratings/top-rated/${selectedPricePoint}`
                );
                if (response.ok) {
                    const data = await response.json();
                    setItems(data);
                }
            } catch (error) {
                console.error('Error fetching top rated items:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load top rated items',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopRatedItems();
    }, [selectedPricePoint, toast]);

    const handleRatingChange = () => {
        // Refresh the items list when a rating is changed
        if (selectedPricePoint) {
            fetch(`${process.env.REACT_APP_API_URL}/api/ratings/top-rated/${selectedPricePoint}`)
                .then((response) => response.json())
                .then((data) => setItems(data))
                .catch((error) => {
                    console.error('Error refreshing items:', error);
                    toast({
                        title: 'Error',
                        description: 'Failed to refresh items',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                    });
                });
        }
    };

    return (
        <Container maxW="container.xl" py={8}>
            <VStack spacing={8} align="stretch">
                <Heading as="h1" size="xl" textAlign="center">
                    Top Rated Items by Price Point
                </Heading>

                <Select
                    value={selectedPricePoint || ''}
                    onChange={(e) => setSelectedPricePoint(Number(e.target.value))}
                    placeholder="Select price point category"
                    maxW="400px"
                    mx="auto"
                >
                    {pricePoints.map((point) => (
                        <option key={point.id} value={point.id}>
                            {point.name} (${point.min_price} - ${point.max_price})
                        </option>
                    ))}
                </Select>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                    {isLoading
                        ? Array(6)
                              .fill(0)
                              .map((_, index) => (
                                  <Box
                                      key={index}
                                      borderWidth="1px"
                                      borderRadius="lg"
                                      overflow="hidden"
                                      p={4}
                                  >
                                      <Skeleton height="200px" mb={4} />
                                      <SkeletonText mt="4" noOfLines={4} spacing="4" />
                                  </Box>
                              ))
                        : items.map((item) => (
                              <Box
                                  key={item.id}
                                  borderWidth="1px"
                                  borderRadius="lg"
                                  overflow="hidden"
                                  p={4}
                                  _hover={{ shadow: 'md' }}
                                  transition="shadow 0.2s"
                              >
                                  <Image
                                      src={item.image_url || '/placeholder.png'}
                                      alt={item.name}
                                      height="200px"
                                      width="100%"
                                      objectFit="cover"
                                      borderRadius="md"
                                      mb={4}
                                  />
                                  <VStack align="start" spacing={2}>
                                      <Heading as="h3" size="md">
                                          {item.name}
                                      </Heading>
                                      <Badge colorScheme="green">
                                          ${item.price.toFixed(2)}
                                      </Badge>
                                      <Text noOfLines={2}>{item.description}</Text>
                                      <Rating
                                          itemId={item.id}
                                          averageRating={item.average_rating}
                                          totalRatings={item.total_ratings}
                                          pricePointCategoryId={item.price_point_category_id}
                                          onRatingChange={handleRatingChange}
                                      />
                                  </VStack>
                              </Box>
                          ))}
                </SimpleGrid>

                {!isLoading && items.length === 0 && (
                    <Text textAlign="center" color="gray.500">
                        No items found in this price point category. Be the first to rate an item!
                    </Text>
                )}
            </VStack>
        </Container>
    );
};

export default TopRatedItems; 