import { Note } from '../models/note.js';
import createHttpError from 'http-errors';

export const getAllNotes = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, tag, search } = req.query;
    const skip = (page - 1) * perPage;
    let query = Note.find({ userId: req.user._id });
    if (tag) {
      query = query.where('tag').equals(tag);
    }
    if (search) {
      query = query.or([
        {
          title: { $regex: search, $options: 'i' },
        },
        { content: { $regex: search, $options: 'i' } },
      ]);
    }
    const [totalNotes, notes] = await Promise.all([
      query.clone().countDocuments(),
      query.skip(skip).limit(perPage),
    ]);
    const totalPages = Math.ceil(totalNotes / perPage);

    console.log('notes:', notes);
    res.status(200).json({
      page: Number(page),
      perPage: Number(perPage),
      totalNotes,
      totalPages,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await Note.findOne({ _id: noteId, userId: req.user._id });
  if (!note) {
    next(createHttpError(404, 'Note not found'));
    return;
  }
  res.status(200).json(note);
};

export const createNote = async (req, res) => {
  const note = await Note.create({ ...req.body, userId: req.user._id });
  res.status(201).json(note);
};

export const deleteNote = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await Note.findOneAndDelete({
    _id: noteId,
    userId: req.user._id,
  });
  if (!note) {
    next(createHttpError(404, 'Note not found'));
    return;
  }
  res.status(200).json(note);
};

export const updateNote = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await Note.findOneAndUpdate(
    {
      _id: noteId,
      userId: req.user._id,
    },
    req.body,
    {
      new: true,
    },
  );
  if (!note) {
    next(createHttpError(404, 'Note not found'));
    return;
  }
  res.status(200).json(note);
};
