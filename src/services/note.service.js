const prisma = require('../config/prisma');

// Helper: format note for response
function formatNote(note) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    isPinned: note.isPinned,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

// Get all notes for a user (owned + shared), pinned first, then by updatedAt
async function getAllNotes(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  // Get owned notes
  const [ownedNotes, sharedNoteLinks, totalOwned, totalShared] = await Promise.all([
    prisma.note.findMany({
      where: { ownerId: userId },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.sharedNote.findMany({
      where: { userId },
      include: {
        note: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.note.count({ where: { ownerId: userId } }),
    prisma.sharedNote.count({ where: { userId } }),
  ]);

  const sharedNotes = sharedNoteLinks.map((sn) => ({
    ...sn.note,
    isShared: true,
  }));

  const allNotes = [
    ...ownedNotes.map((n) => ({ ...n, isShared: false })),
    ...sharedNotes,
  ];

  return {
    data: allNotes.map(formatNote),
    pagination: {
      page,
      limit,
      total: totalOwned + totalShared,
      totalPages: Math.ceil((totalOwned + totalShared) / limit),
    },
  };
}

// Get a single note by ID — user must be owner or have shared access
async function getNoteById(noteId, userId) {
  const note = await prisma.note.findUnique({
    where: { id: noteId },
  });

  if (!note) {
    const err = new Error('Note not found');
    err.status = 404;
    throw err;
  }

  // Check ownership or shared access
  if (note.ownerId !== userId) {
    const shared = await prisma.sharedNote.findUnique({
      where: { noteId_userId: { noteId, userId } },
    });

    if (!shared) {
      const err = new Error('Access denied');
      err.status = 403;
      throw err;
    }
  }

  return formatNote(note);
}

// Create a new note
async function createNote(userId, title, content) {
  const note = await prisma.note.create({
    data: {
      title,
      content,
      ownerId: userId,
    },
  });

  return formatNote(note);
}

// Update a note — only owner can update
async function updateNote(noteId, userId, title, content) {
  const note = await prisma.note.findUnique({ where: { id: noteId } });

  if (!note) {
    const err = new Error('Note not found');
    err.status = 404;
    throw err;
  }

  if (note.ownerId !== userId) {
    const err = new Error('Access denied: only the owner can update this note');
    err.status = 403;
    throw err;
  }

  const updated = await prisma.note.update({
    where: { id: noteId },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
    },
  });

  return formatNote(updated);
}

// Delete a note — only owner can delete
async function deleteNote(noteId, userId) {
  const note = await prisma.note.findUnique({ where: { id: noteId } });

  if (!note) {
    const err = new Error('Note not found');
    err.status = 404;
    throw err;
  }

  if (note.ownerId !== userId) {
    const err = new Error('Access denied: only the owner can delete this note');
    err.status = 403;
    throw err;
  }

  await prisma.note.delete({ where: { id: noteId } });
}

// Share a note with another user by email
async function shareNote(noteId, ownerId, shareWithEmail) {
  const note = await prisma.note.findUnique({ where: { id: noteId } });

  if (!note) {
    const err = new Error('Note not found');
    err.status = 404;
    throw err;
  }

  if (note.ownerId !== ownerId) {
    const err = new Error('Access denied: only the owner can share this note');
    err.status = 403;
    throw err;
  }

  const targetUser = await prisma.user.findUnique({
    where: { email: shareWithEmail.trim().toLowerCase() },
  });

  if (!targetUser) {
    const err = new Error('User with that email not found');
    err.status = 404;
    throw err;
  }

  if (targetUser.id === ownerId) {
    const err = new Error('You cannot share a note with yourself');
    err.status = 400;
    throw err;
  }

  // Upsert to avoid duplicate share error
  await prisma.sharedNote.upsert({
    where: { noteId_userId: { noteId, userId: targetUser.id } },
    update: {},
    create: { noteId, userId: targetUser.id },
  });

  return { message: `Note shared successfully with ${shareWithEmail}` };
}

// Toggle pin status — only owner can pin/unpin
async function togglePin(noteId, userId) {
  const note = await prisma.note.findUnique({ where: { id: noteId } });

  if (!note) {
    const err = new Error('Note not found');
    err.status = 404;
    throw err;
  }

  if (note.ownerId !== userId) {
    const err = new Error('Access denied: only the owner can pin this note');
    err.status = 403;
    throw err;
  }

  const updated = await prisma.note.update({
    where: { id: noteId },
    data: { isPinned: !note.isPinned },
  });

  return formatNote(updated);
}

// Full-text search across notes the user can access
async function searchNotes(userId, query) {
  if (!query || query.trim() === '') {
    const err = new Error('Search query cannot be empty');
    err.status = 400;
    throw err;
  }

  const q = query.trim();

  // Search owned notes
  const ownedNotes = await prisma.note.findMany({
    where: {
      ownerId: userId,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ],
    },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
  });

  // Search shared notes
  const sharedLinks = await prisma.sharedNote.findMany({
    where: { userId },
    include: { note: true },
  });

  const sharedNotes = sharedLinks
    .map((sl) => sl.note)
    .filter(
      (n) =>
        n.title.toLowerCase().includes(q.toLowerCase()) ||
        n.content.toLowerCase().includes(q.toLowerCase())
    );

  const allNotes = [...ownedNotes, ...sharedNotes];

  return allNotes.map(formatNote);
}

module.exports = {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
  togglePin,
  searchNotes,
};
