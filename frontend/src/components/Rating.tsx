import React, { useState, useEffect } from 'react';
import {
    Box,
    HStack,
    Icon,
    Text,
    Tooltip,
    useToast,
    VStack,
    Textarea,
    Button,
    Select,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
} from '@chakra-ui/react';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { useAuth } from '../contexts/AuthContext';

interface RatingProps {
    itemId: number;
    averageRating?: number;
    totalRatings?: number;
    userRating?: number;
    userReview?: string;
    pricePointCategoryId?: number;
    onRatingChange?: () => void;
    showReviewButton?: boolean;
}

interface PricePointCategory {
    id: number;
    name: string;
    min_price: number;
    max_price: number;
}

const Rating: React.FC<RatingProps> = ({
    itemId,
    averageRating = 0,
    totalRatings = 0,
    userRating = 0,
    userReview = '',
    pricePointCategoryId,
    onRatingChange,
    showReviewButton = true,
}) => {
    const { isAuthenticated, token } = useAuth();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [rating, setRating] = useState(userRating);
    const [review, setReview] = useState(userReview);
    const [selectedPricePoint, setSelectedPricePoint] = useState<number | undefined>(pricePointCategoryId);
    const [pricePoints, setPricePoints] = useState<PricePointCategory[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Fetch price point categories
        const fetchPricePoints = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ratings/price-points`);
                if (response.ok) {
                    const data = await response.json();
                    setPricePoints(data);
                }
            } catch (error) {
                console.error('Error fetching price points:', error);
            }
        };

        fetchPricePoints();
    }, []);

    const handleRatingClick = (newRating: number) => {
        if (!isAuthenticated) {
            toast({
                title: 'Authentication required',
                description: 'Please log in to rate items',
                status: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setRating(newRating);
        onOpen();
    };

    const handleSubmit = async () => {
        if (!isAuthenticated || !token) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/ratings/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    rating,
                    review,
                    price_point_category_id: selectedPricePoint,
                }),
            });

            if (response.ok) {
                toast({
                    title: 'Rating submitted',
                    description: 'Thank you for your rating!',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                onClose();
                if (onRatingChange) {
                    onRatingChange();
                }
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to submit rating');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to submit rating',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <VStack align="start" spacing={2}>
                <HStack spacing={1}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Tooltip
                            key={star}
                            label={`${star} star${star !== 1 ? 's' : ''}`}
                            placement="top"
                        >
                            <Box
                                as="button"
                                onClick={() => handleRatingClick(star)}
                                _hover={{ transform: 'scale(1.1)' }}
                                transition="transform 0.2s"
                            >
                                <Icon
                                    as={star <= rating ? AiFillStar : AiOutlineStar}
                                    w={6}
                                    h={6}
                                    color={star <= rating ? 'yellow.400' : 'gray.200'}
                                />
                            </Box>
                        </Tooltip>
                    ))}
                </HStack>
                <Text fontSize="sm" color="gray.600">
                    {averageRating.toFixed(1)} ({totalRatings} ratings)
                </Text>
                {showReviewButton && userRating > 0 && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onOpen}
                        colorScheme="blue"
                    >
                        {userReview ? 'Edit Review' : 'Write a Review'}
                    </Button>
                )}
            </VStack>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Rate this Item</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <HStack spacing={1}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Box
                                        key={star}
                                        as="button"
                                        onClick={() => setRating(star)}
                                        _hover={{ transform: 'scale(1.1)' }}
                                        transition="transform 0.2s"
                                    >
                                        <Icon
                                            as={star <= rating ? AiFillStar : AiOutlineStar}
                                            w={8}
                                            h={8}
                                            color={star <= rating ? 'yellow.400' : 'gray.200'}
                                        />
                                    </Box>
                                ))}
                            </HStack>
                            <Select
                                placeholder="Select price point category"
                                value={selectedPricePoint}
                                onChange={(e) => setSelectedPricePoint(Number(e.target.value))}
                            >
                                {pricePoints.map((point) => (
                                    <option key={point.id} value={point.id}>
                                        {point.name} (${point.min_price} - ${point.max_price})
                                    </option>
                                ))}
                            </Select>
                            <Textarea
                                placeholder="Write your review (optional)"
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                rows={4}
                            />
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                        >
                            Submit Rating
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default Rating; 