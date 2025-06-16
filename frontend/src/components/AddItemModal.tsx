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
    onItemAdded: (item: any) => void;
}

interface FormData {
    name: string;
    description: string;
    category_id: number;
    quantity: number;
    condition: string;
    location: string;
    image_url: string;
    new_value: number;
    resell_value: number;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onItemAdded }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();
    const toast = useToast();

    const initialFormData: FormData = {
        name: '',
        description: '',
        category_id: 0,
        quantity: 1,
        condition: 'new',
        location: '',
        image_url: '',
        new_value: 0,
        resell_value: 0
    };

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add item');
            }

            const data = await response.json();
            toast({
                title: 'Item added successfully',
                status: 'success',
                duration: 3000,
                isClosable: true
            });
            onItemAdded(data);
            onClose();
            setFormData(initialFormData);
        } catch (error) {
            console.error('Error adding item:', error);
            toast({
                title: 'Error adding item',
                description: error instanceof Error ? error.message : 'An error occurred',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add New Item</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Name</FormLabel>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter item name"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter item description"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Category</FormLabel>
                                <Select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
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
                                    onChange={(_, value) => handleInputChange({ target: { name: 'quantity', value } } as any)}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Condition</FormLabel>
                                <Select
                                    name="condition"
                                    value={formData.condition}
                                    onChange={handleInputChange}
                                >
                                    <option value="new">New</option>
                                    <option value="like_new">Like New</option>
                                    <option value="excellent">Excellent</option>
                                    <option value="good">Good</option>
                                    <option value="fair">Fair</option>
                                    <option value="poor">Poor</option>
                                </Select>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Location</FormLabel>
                                <Input
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="Enter item location"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Image URL</FormLabel>
                                <Input
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleInputChange}
                                    placeholder="Enter image URL"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>New Value (£)</FormLabel>
                                <NumberInput
                                    min={0}
                                    precision={2}
                                    value={formData.new_value}
                                    onChange={(_, value) => handleInputChange({ target: { name: 'new_value', value } } as any)}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Resell Value (£)</FormLabel>
                                <NumberInput
                                    min={0}
                                    precision={2}
                                    value={formData.resell_value}
                                    onChange={(_, value) => handleInputChange({ target: { name: 'resell_value', value } } as any)}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <Button
                                type="submit"
                                colorScheme="blue"
                                width="full"
                                isLoading={isSubmitting}
                                loadingText="Adding item..."
                            >
                                Add Item
                            </Button>
                        </VStack>
                    </form>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default AddItemModal; 