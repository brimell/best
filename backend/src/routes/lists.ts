import express from 'express';

const router = express.Router();

interface ListItem {
  id: number;
  type: 'template' | 'userItem';
  refId: number;
  wantRating?: number;
  needRating?: number;
}

interface UserList {
  id: number;
  ownerId: number;
  name: string;
  isShared: boolean;
  collaboratorIds: number[];
  items: ListItem[];
}

interface OfficialList {
  id: number;
  createdByAdminId: number;
  name: string;
  description: string;
  items: { type: 'template'; refId: number }[];
}

const userLists: UserList[] = [];
const officialLists: OfficialList[] = [];

// Create a new user list
router.post('/', (req, res) => {
  const { ownerId, name, isShared } = req.body;
  const list: UserList = {
    id: userLists.length + 1,
    ownerId,
    name,
    isShared: Boolean(isShared),
    collaboratorIds: [],
    items: [],
  };
  userLists.push(list);
  res.status(201).json(list);
});

// Get all lists
router.get('/', (_req, res) => {
  res.json(userLists);
});

// Get single list
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const list = userLists.find(l => l.id === id);
  if (!list) {
    return res.status(404).json({ message: 'List not found' });
  }
  res.json(list);
});

// Add item to list
router.post('/:id/items', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const list = userLists.find(l => l.id === id);
  if (!list) {
    return res.status(404).json({ message: 'List not found' });
  }
  const { type, refId, wantRating, needRating } = req.body;
  const item: ListItem = { id: list.items.length + 1, type, refId, wantRating, needRating };
  list.items.push(item);
  res.status(201).json(item);
});

// Remove item from list
router.delete('/:id/items/:itemId', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const itemId = parseInt(req.params.itemId, 10);
  const list = userLists.find(l => l.id === id);
  if (!list) {
    return res.status(404).json({ message: 'List not found' });
  }
  const index = list.items.findIndex(i => i.id === itemId);
  if (index === -1) {
    return res.status(404).json({ message: 'Item not found in list' });
  }
  list.items.splice(index, 1);
  res.json({ message: 'Item removed' });
});

// Create official list (admin only in real app)
router.post('/official', (req, res) => {
  const { createdByAdminId, name, description } = req.body;
  const list: OfficialList = { id: officialLists.length + 1, createdByAdminId, name, description, items: [] };
  officialLists.push(list);
  res.status(201).json(list);
});

// Get official lists
router.get('/official', (_req, res) => {
  res.json(officialLists);
});

export default router;
