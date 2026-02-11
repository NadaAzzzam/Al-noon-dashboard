import { Request, Response } from 'express';
import { ShippingMethod } from '../models/ShippingMethod';
import { t } from '../i18n';

/**
 * Get all shipping methods (public, returns only enabled methods).
 * Query: includeDisabled=true (admin) | cityId (optional) – when cityId is set, each method's price
 * is resolved from cityPrices for that city, or falls back to default price.
 */
export const getShippingMethods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeDisabled, cityId } = req.query;

    const query = includeDisabled === 'true' ? {} : { enabled: true };

    const shippingMethods = await ShippingMethod.find(query).sort({ order: 1 }).populate('cityPrices.city', 'name');

    const list = shippingMethods.map((m) => {
      const doc = m.toObject ? m.toObject() : (m as any);
      let resolvedPrice = doc.price;
      if (cityId && typeof cityId === 'string' && doc.cityPrices?.length) {
        const entry = doc.cityPrices.find((cp: any) => String(cp.city?._id || cp.city) === cityId);
        if (entry != null && typeof entry.price === 'number') resolvedPrice = entry.price;
      }
      return {
        ...doc,
        price: resolvedPrice,
        ...(includeDisabled === 'true' ? {} : { cityPrices: undefined }),
      };
    });

    res.json({ shippingMethods: list });
  } catch (error: any) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({ error: t(req.locale, 'errors.common.internal_error') });
  }
};

/**
 * Get a single shipping method by ID
 */
export const getShippingMethodById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const shippingMethod = await ShippingMethod.findById(id).populate('cityPrices.city', 'name');

    if (!shippingMethod) {
      res.status(404).json({ error: t(req.locale, 'errors.shipping_method.not_found') });
      return;
    }

    res.json({ shippingMethod });
  } catch (error: any) {
    console.error('Error fetching shipping method:', error);
    res.status(500).json({ error: t(req.locale, 'errors.common.internal_error') });
  }
};

/**
 * Create a new shipping method. Body may include cityPrices: [{ city: ObjectId, price: number }].
 */
export const createShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, estimatedDays, price, cityPrices, enabled, order } = req.body;

    const shippingMethod = await ShippingMethod.create({
      name,
      description,
      estimatedDays,
      price,
      ...(Array.isArray(cityPrices) ? { cityPrices } : {}),
      enabled,
      order,
    });

    res.status(201).json({
      message: t(req.locale, 'success.shipping_method.created'),
      shippingMethod,
    });
  } catch (error: any) {
    console.error('Error creating shipping method:', error);
    res.status(500).json({ error: t(req.locale, 'errors.common.internal_error') });
  }
};

/**
 * Update a shipping method. Body may include cityPrices: [{ city: ObjectId, price: number }].
 */
export const updateShippingMethod = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, estimatedDays, price, cityPrices, enabled, order } = req.body;

    const updates: Record<string, unknown> = { name, description, estimatedDays, price, enabled, order };
    if (Array.isArray(cityPrices)) updates.cityPrices = cityPrices;

    const shippingMethod = await ShippingMethod.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!shippingMethod) {
      res.status(404).json({ error: t(req.locale, 'errors.shipping_method.not_found') });
      return;
    }

    res.json({
      message: t(req.locale, 'success.shipping_method.updated'),
      shippingMethod,
    });
  } catch (error: any) {
    console.error('Error updating shipping method:', error);
    res.status(500).json({ error: t(req.locale, 'errors.common.internal_error') });
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
      res.status(404).json({ error: t(req.locale, 'errors.shipping_method.not_found') });
      return;
    }

    res.json({
      message: t(req.locale, 'success.shipping_method.deleted'),
    });
  } catch (error: any) {
    console.error('Error deleting shipping method:', error);
    res.status(500).json({ error: t(req.locale, 'errors.common.internal_error') });
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
      res.status(404).json({ error: t(req.locale, 'errors.shipping_method.not_found') });
      return;
    }

    shippingMethod.enabled = !shippingMethod.enabled;
    await shippingMethod.save();

    res.json({
      message: t(req.locale, 'success.shipping_method.updated'),
      shippingMethod,
    });
  } catch (error: any) {
    console.error('Error toggling shipping method:', error);
    res.status(500).json({ error: t(req.locale, 'errors.common.internal_error') });
  }
};
