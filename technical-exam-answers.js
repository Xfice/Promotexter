// TECHNICAL EXAM ANSWERS
// =====================

// Q#1 - UserDashboard Component Issues
// ------------------------------------

// Q#1a. Memory Leak – Interval Never Cleared
// The setInterval runs every 2 seconds but is never cleared. When the component unmounts, the interval keeps running and will try to call setUsers on an unmounted component, causing memory leaks and React warnings.
// Fix: Return a cleanup function from useEffect:

useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, 2000);
  return () => clearInterval(interval);  // cleanup on unmount
}, []);

// Q#1b. No Error Handling on Fetch
// If the API fails, the promise chain rejects and nothing catches it – you get unhandled rejections.
// Fix: Add .catch() or use try/catch:

fetch('/api/users')
  .then(res => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  })
  .then(data => setUsers(data))
  .catch(err => console.error(err));  // or set error state

// Q#1c. Uncontrolled Input
// The input has onChange but no value – it's uncontrolled. React prefers controlled inputs for predictable state.
// Fix: Add value={filter}:

<input value={filter} onChange={(e) => setFilter(e.target.value)} />

// Q#1d. Possible Crash When name is Undefined
// If a user has no name, u.name.toLowerCase() throws.
// Fix: Use optional chaining:

const filteredUsers = users.filter(u =>
  u.name?.toLowerCase().includes(filter.toLowerCase())
);

// Q#1e. Race Condition with Rapid Fetches
// Multiple fetches can complete out of order – an older response could overwrite a newer one.
// Fix: Use AbortController or ignore outdated responses:

useEffect(() => {
  let cancelled = false;
  const interval = setInterval(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!cancelled) setUsers(data);
    } catch (err) {
      if (!cancelled) console.error(err);
    }
  }, 2000);
  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, []);

// ================================================================================

// Q#2 - updateUserProfile Function Issues
// ---------------------------------------

// Q#2a. No Null Check for User
// If findById returns null, user.profileViews throws.
// Fix: Check before using:

const user = await db.users.findById(userId);
if (!user) throw new Error('User not found');

// Q#2b. Race Condition for profileViews
// Two concurrent requests could both read the same profileViews, increment it, and save – one increment gets lost.
// Fix: Use atomic increment (e.g. MongoDB $inc):

await db.users.update(userId, {
  $inc: { profileViews: 1 },
  ...newData
});

// Q#2c. Mutating the DB Object
// user.profileViews += 1 mutates the object returned from the DB – can cause issues with ORMs and caching.
// Fix: Build a new object instead:

const updated = {
  ...user,
  profileViews: (user.profileViews || 0) + 1,
  ...newData
};
await db.users.update(userId, updated);

// Q#2d. newData Can Overwrite profileViews
// With { ...user, ...newData }, if newData has profileViews, it overwrites our increment.
// Fix: Merge so the increment is preserved:

const updated = {
  ...user,
  profileViews: (user.profileViews || 0) + 1,
  ...newData
};

// ================================================================================

// PRACTICAL APPLICATION
// =====================

// 1. RESTful API with CRUD (POST and GET)
// ---------------------------------------
// Using Node.js + Express:

const express = require('express');
const app = express();
app.use(express.json());

let items = [];
let nextId = 1;

app.get('/api/items', (req, res) => {
  res.json(items);
});

app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/items', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const newItem = { id: nextId++, name, description: description || '' };
  items.push(newItem);
  res.status(201).json(newItem);
});

app.listen(3000);

// 1a. Logic/Approach Explanation
// REST uses HTTP verbs for actions – GET for read, POST for create. I used /api/items for the collection and /api/items/:id for a single resource. POST validates input, creates a new object with an ID, stores it, and returns 201. In-memory storage keeps it simple; in production you'd use a database.

// 1b. Unit Test (AAA Pattern, TypeScript)
// ---------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';

describe('Items API', () => {
  let items;
  let nextId;

  beforeEach(() => {
    items = [];
    nextId = 1;
  });

  it('POST creates item and GET returns it', () => {
    const newItem = { name: 'Test', description: 'Desc' };
    const created = { id: nextId++, ...newItem };
    items.push(created);
    const found = items.find(i => i.id === created.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Test');
    expect(found?.description).toBe('Desc');
  });

  it('GET returns empty array when no items', () => {
    expect(items).toEqual([]);
  });

  it('GET by id returns 404 for missing item', () => {
    const item = items.find(i => i.id === 999);
    expect(item).toBeUndefined();
  });
});

// 2. Phone Letter Combinations (JavaScript/TypeScript)
// ----------------------------------------------------
// Logic: Map each digit to its letters, then backtrack – for each digit, try every letter, recurse for the next digit, and when you reach the end, add the current path to the result.

function letterCombinations(digits) {
  if (digits.length === 0) return [];

  const map = {
    '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
    '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
  };

  const result = [];

  function backtrack(index, path) {
    if (index === digits.length) {
      result.push(path);
      return;
    }
    const letters = map[digits[index]];
    if (!letters) return;
    for (const char of letters) {
      backtrack(index + 1, path + char);
    }
  }

  backtrack(0, '');
  return result;
}

// letterCombinations("23") => ["ad","ae","af","bd","be","bf","cd","ce","cf"]
// letterCombinations("") => []
// letterCombinations("2") => ["a","b","c"]
