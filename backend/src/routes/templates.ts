import express from 'express';

const router = express.Router();

interface ItemTemplate {
  id: number;
  name: string;
  category: string[];
  brand: string;
  specs: Record<string, any>;
  defaultImageURL: string;
  tags: string[];
}

interface TemplateRating {
  id: number;
  userId: number;
  templateId: number;
  wantRating: number;
  needRating: number;
  ratedAt: Date;
}

const templates: ItemTemplate[] = [
  {
    id: 1,
    name: 'Telecaster Standard',
    category: ['Instruments'],
    brand: 'Fender',
    specs: { model: 'Standard', year: 2024 },
    defaultImageURL: 'https://example.com/telecaster.jpg',
    tags: ['guitar', 'electric'],
  },
  {
    id: 2,
    name: 'Poäng',
    category: ['Furniture'],
    brand: 'IKEA',
    specs: { type: 'Chair' },
    defaultImageURL: 'https://example.com/poang.jpg',
    tags: ['chair', 'ikea'],
  },
];

const templateRatings: TemplateRating[] = [];

// Get all templates
router.get('/', (req, res) => {
  res.json(templates);
});

// Get template by id
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const template = templates.find(t => t.id === id);
  if (!template) {
    return res.status(404).json({ message: 'Template not found' });
  }
  res.json(template);
});

// Get a user's rating for a template
router.get('/:id/rating', (req, res) => {
  const userId = Number(req.query.userId) || 0;
  const templateId = parseInt(req.params.id, 10);
  const rating = templateRatings.find(r => r.userId === userId && r.templateId === templateId);
  if (!rating) {
    return res.json({ wantRating: 0, needRating: 0 });
  }
  res.json({ wantRating: rating.wantRating, needRating: rating.needRating });
});

// Set a user's rating for a template
router.post('/:id/rating', (req, res) => {
  const userId = Number(req.body.userId) || 0;
  const templateId = parseInt(req.params.id, 10);
  const { wantRating, needRating } = req.body;

  if (wantRating < 0 || wantRating > 10 || needRating < 0 || needRating > 10) {
    return res.status(400).json({ message: 'Ratings must be between 0 and 10' });
  }

  let rating = templateRatings.find(r => r.userId === userId && r.templateId === templateId);
  if (rating) {
    rating.wantRating = wantRating;
    rating.needRating = needRating;
    rating.ratedAt = new Date();
  } else {
    rating = { id: templateRatings.length + 1, userId, templateId, wantRating, needRating, ratedAt: new Date() };
    templateRatings.push(rating);
  }

  res.json({ wantRating: rating.wantRating, needRating: rating.needRating });
});

export default router;
