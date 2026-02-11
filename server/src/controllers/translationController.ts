import { Request, Response } from 'express';
import { Translation } from '../models/Translation';
import { t } from '../i18n';

/**
 * Get all translations (optionally filtered by category)
 */
export const getTranslations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, lang } = req.query;
    const query: any = {};

    if (category) {
      query.category = category;
    }

    const translations = await Translation.find(query).sort({ category: 1, key: 1 });

    // If lang is specified, return flat key-value object for that language
    if (lang === 'en' || lang === 'ar') {
      const flatTranslations: Record<string, string> = {};
      translations.forEach((t) => {
        flatTranslations[t.key] = t[lang];
      });
      res.json({ translations: flatTranslations, lang });
      return;
    }

    // Otherwise return full objects
    res.json({ translations });
  } catch (error: any) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Get a single translation by key
 */
export const getTranslationByKey = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.params;

    const translation = await Translation.findOne({ key });

    if (!translation) {
      res.status(404).json({ error: t('error.translation.not_found', req.locale) });
      return;
    }

    res.json({ translation });
  } catch (error: any) {
    console.error('Error fetching translation:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Create a new translation
 */
export const createTranslation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, en, ar, category, description } = req.body;

    // Check if translation with this key already exists
    const existingTranslation = await Translation.findOne({ key });
    if (existingTranslation) {
      res.status(400).json({ error: t('error.translation.already_exists', req.locale) });
      return;
    }

    const translation = await Translation.create({
      key,
      en,
      ar,
      category,
      description,
    });

    res.status(201).json({
      message: t('success.translation.created', req.locale),
      translation,
    });
  } catch (error: any) {
    console.error('Error creating translation:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Update a translation
 */
export const updateTranslation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { en, ar, category, description } = req.body;

    const translation = await Translation.findByIdAndUpdate(
      id,
      { en, ar, category, description },
      { new: true, runValidators: true }
    );

    if (!translation) {
      res.status(404).json({ error: t('error.translation.not_found', req.locale) });
      return;
    }

    res.json({
      message: t('success.translation.updated', req.locale),
      translation,
    });
  } catch (error: any) {
    console.error('Error updating translation:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Delete a translation
 */
export const deleteTranslation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const translation = await Translation.findByIdAndDelete(id);

    if (!translation) {
      res.status(404).json({ error: t('error.translation.not_found', req.locale) });
      return;
    }

    res.json({
      message: t('success.translation.deleted', req.locale),
    });
  } catch (error: any) {
    console.error('Error deleting translation:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Bulk import translations
 */
export const bulkImportTranslations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { translations } = req.body;

    if (!Array.isArray(translations)) {
      res.status(400).json({ error: 'Translations must be an array' });
      return;
    }

    const results = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const trans of translations) {
      try {
        const existing = await Translation.findOne({ key: trans.key });

        if (existing) {
          await Translation.findByIdAndUpdate(existing._id, {
            en: trans.en,
            ar: trans.ar,
            category: trans.category,
            description: trans.description,
          });
          results.updated++;
        } else {
          await Translation.create(trans);
          results.created++;
        }
      } catch (error: any) {
        results.errors.push(`Error processing key ${trans.key}: ${error.message}`);
      }
    }

    res.json({
      message: t('success.translation.bulk_imported', req.locale),
      results,
    });
  } catch (error: any) {
    console.error('Error bulk importing translations:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Export all translations as JSON
 */
export const exportTranslations = async (req: Request, res: Response): Promise<void> => {
  try {
    const translations = await Translation.find().sort({ category: 1, key: 1 });

    const en: Record<string, string> = {};
    const ar: Record<string, string> = {};

    translations.forEach((t) => {
      en[t.key] = t.en;
      ar[t.key] = t.ar;
    });

    res.json({ en, ar });
  } catch (error: any) {
    console.error('Error exporting translations:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};
