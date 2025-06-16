import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    Select,
    Textarea,
    VStack,
    useToast,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

interface Category {
    id: number;
    parent_id: number | null;
    name: string;
    description: string;
    level: number;
    path: string;
    name_path: string[];
    has_children: boolean;
}

interface AddItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onItemAdded: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onItemAdded }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();
    const toast = useToast();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category_id: '',
        quantity: 1,
        purchase_price: '',
        purchase_date: '',
        condition: '',
        location: '',
        image_url: ''
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                if (!response.ok) throw new Error('Failed to fetch categories');
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                toast({
                    title: 'Error',
                    description: 'Failed to load categories',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
        };

        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const renderCategoryOptions = (categories: Category[], level = 0) => {
        return categories
            .filter(cat => cat.level === level)
            .map(category => (
                <React.Fragment key={category.id}>
                    <option value={category.id}>
                        {'—'.repeat(level)} {category.name}
                    </option>
                    {category.has_children && renderCategoryOptions(categories, level + 1)}
                </React.Fragment>
            ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    category_id: parseInt(formData.category_id),
                    quantity: parseInt(formData.quantity.toString()),
                    purchase_price: parseFloat(formData.purchase_price)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add item');
            }

            toast({
                title: 'Success',
                description: 'Item added successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onItemAdded();
            onClose();
            setFormData({
                name: '',
                description: '',
                category_id: '',
                quantity: 1,
                purchase_price: '',
                purchase_date: '',
                condition: '',
                location: '',
                image_url: ''
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to add item',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader>Add New Item</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Name</FormLabel>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter item name"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Enter item description"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Category</FormLabel>
                                <Select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                    placeholder="Select category"
                                >
                                    {renderCategoryOptions(categories)}
                                </Select>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Quantity</FormLabel>
                                <NumberInput
                                    min={1}
                                    value={formData.quantity}
                                    onChange={(value) => handleNumberChange('quantity', value)}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Purchase Price</FormLabel>
                                <NumberInput
                                    min={0}
                                    precision={2}
                                    value={formData.purchase_price}
                                    onChange={(value) => handleNumberChange('purchase_price', value)}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Purchase Date</FormLabel>
                                <Input
                                    type="date"
                                    name="purchase_date"
                                    value={formData.purchase_date}
                                    onChange={handleChange}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Condition</FormLabel>
                                <Select
                                    name="condition"
                                    value={formData.condition}
                                    onChange={handleChange}
                                    placeholder="Select condition"
                                >
                                    <option value="new">New</option>
                                    <option value="like-new">Like New</option>
                                    <option value="excellent">Excellent</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Location</FormLabel>
                                <Input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Enter storage location"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Image URL</FormLabel>
                                <Input
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    placeholder="Enter image URL"
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            type="submit"
                            isLoading={loading}
                            loadingText="Adding..."
                        >
                            Add Item
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default AddItemModal; 