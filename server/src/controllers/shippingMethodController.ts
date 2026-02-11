import { Request, Response } from 'express';
import { ShippingMethod } from '../models/ShippingMethod';
import { t } from '../i18n';

/**
 * Get all shipping methods (public, returns only enabled methods)
 */
export const getShippingMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeDisabled } = req.query;

    // For admin users, include disabled methods if requested
    const query = includeDisabled === 'true' ? {} : { enabled: true };

    const shippingMethods = await ShippingMethod.find(query).sort({ order: 1 });

    res.json({ shippingMethods });
  } catch (error: any) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Get a single shipping method by ID
 */
export const getShippingMethodById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const shippingMethod = await ShippingMethod.findById(id);

    if (!shippingMethod) {
      res.status(404).json({ error: t('error.shipping_method.not_found', req.locale) });
      return;
    }

    res.json({ shippingMethod });
  } catch (error: any) {
    console.error('Error fetching shipping method:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Create a new shipping method
 */
export const createShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, estimatedDays, price, enabled, order } = req.body;

    const shippingMethod = await ShippingMethod.create({
      name,
      description,
      estimatedDays,
      price,
      enabled,
      order,
    });

    res.status(201).json({
      message: t('success.shipping_method.created', req.locale),
      shippingMethod,
    });
  } catch (error: any) {
    console.error('Error creating shipping method:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Update a shipping method
 */
export const updateShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, estimatedDays, price, enabled, order } = req.body;

    const shippingMethod = await ShippingMethod.findByIdAndUpdate(
      id,
      { name, description, estimatedDays, price, enabled, order },
      { new: true, runValidators: true }
    );

    if (!shippingMethod) {
      res.status(404).json({ error: t('error.shipping_method.not_found', req.locale) });
      return;
    }

    res.json({
      message: t('success.shipping_method.updated', req.locale),
      shippingMethod,
    });
  } catch (error: any) {
    console.error('Error updating shipping method:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Delete a shipping method
 */
export const deleteShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const shippingMethod = await ShippingMethod.findByIdAndDelete(id);

    if (!shippingMethod) {
      res.status(404).json({ error: t('error.shipping_method.not_found', req.locale) });
      return;
    }

    res.json({
      message: t('success.shipping_method.deleted', req.locale),
    });
  } catch (error: any) {
    console.error('Error deleting shipping method:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};

/**
 * Toggle shipping method enabled status
 */
export const toggleShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const shippingMethod = await ShippingMethod.findById(id);

    if (!shippingMethod) {
      res.status(404).json({ error: t('error.shipping_method.not_found', req.locale) });
      return;
    }

    shippingMethod.enabled = !shippingMethod.enabled;
    await shippingMethod.save();

    res.json({
      message: t('success.shipping_method.updated', req.locale),
      shippingMethod,
    });
  } catch (error: any) {
    console.error('Error toggling shipping method:', error);
    res.status(500).json({ error: t('error.general', req.locale) });
  }
};
