# Product API Implementation Guide

## Overview

This guide documents the enhanced product features for your e-commerce platform, following Shopify's best practices for product variants, color-specific images, inventory management, and rich text formatting.

## Features Implemented

### 1. **Color-Specific Product Images**

When a user clicks on a specific color, the product details API returns images related only to that color.

#### API Endpoint

```
GET /api/products/:id?color=red
```

#### How It Works

- Each image in the product has a corresponding color tag stored in the `imageColors` array
- When a `color` query parameter is provided, the API filters images to show only those matching the requested color
- If no images match the requested color, the API falls back to default images (images with empty color tags)
- If no color parameter is provided, all default images are returned

#### Example Request

```javascript
// Get product with red color images
fetch('/api/products/123?color=red')

// Get product with default images
fetch('/api/products/123')
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "123",
      "name": { "en": "Cotton T-Shirt", "ar": "تيشيرت قطني" },
      "price": 299,
      "discountPrice": 249,
      "colors": ["red", "blue", "black"],
      "sizes": ["S", "M", "L", "XL"],
      "media": {
        "default": {
          "type": "image",
          "url": "/uploads/products/red-tshirt-front.jpg"
        },
        "hover": {
          "type": "image",
          "url": "/uploads/products/red-tshirt-back.jpg"
        }
      },
      "availability": {
        "colors": [
          { "color": "red", "available": true, "outOfStock": false },
          { "color": "blue", "available": true, "outOfStock": false },
          { "color": "black", "available": false, "outOfStock": true }
        ],
        "sizes": [
          { "size": "S", "available": true, "outOfStock": false },
          { "size": "M", "available": true, "outOfStock": false },
          { "size": "L", "available": false, "outOfStock": true },
          { "size": "XL", "available": false, "outOfStock": true }
        ],
        "variants": [
          { "color": "red", "size": "S", "stock": 10, "outOfStock": false },
          { "color": "red", "size": "M", "stock": 5, "outOfStock": false },
          { "color": "black", "size": "L", "stock": 0, "outOfStock": true }
        ]
      }
    }
  }
}
```

---

### 2. **Variant Inventory Management (Color & Size Stock Tracking)**

Products now support granular inventory tracking for specific color and size combinations.

#### Database Model

```typescript
interface VariantInventory {
  color?: string;
  size?: string;
  stock: number;
  outOfStock?: boolean; // Manual override for out-of-stock status
}

interface ProductDocument {
  // ... other fields
  variants: VariantInventory[];
}
```

#### How It Works

- The `variants` array stores stock information for each color/size combination
- If `variants` is empty, the global `stock` field is used
- The `outOfStock` flag allows manual override (e.g., marking discontinued variants)
- The API automatically calculates availability for each color and size

#### Example Database Entry

```javascript
{
  "_id": "123",
  "name": { "en": "Cotton T-Shirt" },
  "colors": ["red", "blue", "black"],
  "sizes": ["S", "M", "L", "XL"],
  "stock": 50, // Global stock (fallback)
  "variants": [
    { "color": "red", "size": "S", "stock": 10, "outOfStock": false },
    { "color": "red", "size": "M", "stock": 5, "outOfStock": false },
    { "color": "red", "size": "L", "stock": 0, "outOfStock": true },
    { "color": "blue", "size": "S", "stock": 8, "outOfStock": false },
    { "color": "black", "size": "M", "stock": 0, "outOfStock": true }
  ]
}
```

---

### 3. **Discount Price Handling**

Discount prices are fully supported across all product APIs.

#### Features

- Products can have both a regular `price` and a `discountPrice`
- The product list API uses the effective price (discount price if available, otherwise regular price) for sorting
- Both prices are returned in API responses
- The frontend can display original price with strikethrough and discount price prominently

#### Example

```json
{
  "price": 299,
  "discountPrice": 249,
  "media": { ... }
}
```

Frontend rendering:
```html
<span class="original-price strikethrough">299 EGP</span>
<span class="discount-price">249 EGP</span>
```

---

### 4. **Out-of-Stock Indicators**

The API provides comprehensive availability information for colors and sizes.

#### Availability Response Structure

```json
{
  "availability": {
    "colors": [
      { "color": "red", "available": true, "outOfStock": false },
      { "color": "black", "available": false, "outOfStock": true }
    ],
    "sizes": [
      { "size": "S", "available": true, "outOfStock": false },
      { "size": "XL", "available": false, "outOfStock": true }
    ],
    "variants": [
      { "color": "red", "size": "S", "stock": 10, "outOfStock": false },
      { "color": "black", "size": "XL", "stock": 0, "outOfStock": true }
    ]
  }
}
```

#### Frontend Implementation

Display out-of-stock items with a line-through or disabled state:

```jsx
{product.availability.colors.map(colorInfo => (
  <button
    key={colorInfo.color}
    disabled={colorInfo.outOfStock}
    className={colorInfo.outOfStock ? 'line-through opacity-50' : ''}
  >
    {colorInfo.color}
  </button>
))}

{product.availability.sizes.map(sizeInfo => (
  <button
    key={sizeInfo.size}
    disabled={sizeInfo.outOfStock}
    className={sizeInfo.outOfStock ? 'line-through opacity-50' : ''}
  >
    {sizeInfo.size}
  </button>
))}
```

---

### 5. **Rich Text Formatting for Product Details (Shopify-Style)**

The `details` field now supports structured rich text formatting with titles, paragraphs, and lists.

#### Format Syntax

When entering product details in the admin dashboard, use these conventions:

- **Titles**: Start with `# ` (e.g., `# Features`)
- **List items**: Start with `- ` or `* ` (e.g., `- Premium fabric`)
- **Paragraphs**: Regular text lines
- **Spacing**: Empty lines separate sections

#### Example Input (Admin Dashboard)

```
# Product Details
This premium cotton t-shirt is perfect for everyday wear.

# Features
- 100% premium cotton
- Machine washable
- Breathable fabric
- Available in multiple colors

# Care Instructions
Wash in cold water.
Tumble dry low.
Do not bleach.

# Size Guide
Please refer to our size chart for accurate measurements.
```

#### API Response (Structured Format)

The API automatically parses this into structured blocks:

```json
{
  "formattedDetails": {
    "en": [
      { "type": "title", "text": "Product Details" },
      { "type": "paragraph", "text": "This premium cotton t-shirt is perfect for everyday wear." },
      { "type": "title", "text": "Features" },
      {
        "type": "list",
        "items": [
          "100% premium cotton",
          "Machine washable",
          "Breathable fabric",
          "Available in multiple colors"
        ]
      },
      { "type": "title", "text": "Care Instructions" },
      { "type": "paragraph", "text": "Wash in cold water. Tumble dry low. Do not bleach." },
      { "type": "title", "text": "Size Guide" },
      { "type": "paragraph", "text": "Please refer to our size chart for accurate measurements." }
    ],
    "ar": [ /* Same structure for Arabic */ ]
  }
}
```

#### Frontend Rendering

```jsx
{product.formattedDetails?.en.map((block, index) => {
  if (block.type === 'title') {
    return <h3 key={index} className="text-lg font-bold mt-4">{block.text}</h3>;
  }
  if (block.type === 'paragraph') {
    return <p key={index} className="text-gray-700 mt-2">{block.text}</p>;
  }
  if (block.type === 'list') {
    return (
      <ul key={index} className="list-disc list-inside mt-2">
        {block.items.map((item, i) => (
          <li key={i} className="text-gray-700">{item}</li>
        ))}
      </ul>
    );
  }
})}
```

---

## API Endpoints Summary

### Get Product Details

**Endpoint**: `GET /api/products/:id`

**Query Parameters**:
- `color` (optional): Filter images by specific color

**Response**: Full product details with:
- Color-specific media (if color parameter provided)
- Variant availability information
- Formatted details (rich text blocks)
- Discount pricing
- Stock information

### List Products

**Endpoint**: `GET /api/products`

**Query Parameters**:
- Standard filtering (category, search, status, etc.)
- `color`: Filter by color
- `minPrice`, `maxPrice`: Price range filtering (uses effective price)
- `sort`: Various sort options (price considers discount)

**Response**: List of products with basic information (media in list mode)

---

## Best Practices

### 1. Color-Specific Images

- Always tag images with their corresponding color in the `imageColors` array
- Use empty string (`""`) for default/multi-color images
- Ensure color names match exactly between `colors` array and `imageColors` array

### 2. Variant Inventory

- Create variant entries for all color/size combinations you want to track
- Use `outOfStock: true` for discontinued variants even if stock shows > 0
- If not using variants, rely on the global `stock` field

### 3. Discount Pricing

- Always set `discountPrice` lower than `price`
- Set `discountPrice` to `null` or omit it when no discount is active
- The system automatically uses discount price for sorting and filtering

### 4. Rich Text Details

- Keep formatting simple and consistent
- Use titles to organize information into clear sections
- Use lists for features, specifications, and care instructions
- Support both English and Arabic content

---

## Frontend Implementation Examples

### Display Color Selector with Availability

```jsx
<div className="color-selector">
  {product.colors.map(color => {
    const colorInfo = product.availability.colors.find(c => c.color === color);
    const isOutOfStock = colorInfo?.outOfStock;

    return (
      <button
        key={color}
        onClick={() => !isOutOfStock && fetchProductWithColor(color)}
        disabled={isOutOfStock}
        className={`
          color-option
          ${selectedColor === color ? 'selected' : ''}
          ${isOutOfStock ? 'line-through opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {color}
        {isOutOfStock && <span className="ml-1">(Out of Stock)</span>}
      </button>
    );
  })}
</div>
```

### Display Size Selector with Availability

```jsx
<div className="size-selector">
  {product.sizes.map(size => {
    const sizeInfo = product.availability.sizes.find(s => s.size === size);
    const isOutOfStock = sizeInfo?.outOfStock;

    return (
      <button
        key={size}
        disabled={isOutOfStock}
        className={`
          size-option
          ${selectedSize === size ? 'selected' : ''}
          ${isOutOfStock ? 'line-through opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {size}
      </button>
    );
  })}
</div>
```

### Display Price with Discount

```jsx
<div className="product-price">
  {product.discountPrice ? (
    <>
      <span className="original-price line-through text-gray-500">
        {formatPrice(product.price)} EGP
      </span>
      <span className="discount-price text-red-600 font-bold ml-2">
        {formatPrice(product.discountPrice)} EGP
      </span>
      <span className="discount-badge bg-red-100 text-red-600 px-2 py-1 rounded ml-2">
        {Math.round((1 - product.discountPrice / product.price) * 100)}% OFF
      </span>
    </>
  ) : (
    <span className="regular-price font-bold">
      {formatPrice(product.price)} EGP
    </span>
  )}
</div>
```

---

## Migration Guide

### Adding Variant Support to Existing Products

If you have existing products without variant tracking:

1. Products will continue to work with the global `stock` field
2. To add variant tracking, populate the `variants` array:

```javascript
db.products.updateOne(
  { _id: "product-id" },
  {
    $set: {
      variants: [
        { color: "red", size: "S", stock: 10, outOfStock: false },
        { color: "red", size: "M", stock: 5, outOfStock: false },
        // ... more variants
      ]
    }
  }
);
```

### Adding Rich Text Details

Existing plain text details will continue to work. To convert to rich text:

1. Edit the product details in the admin dashboard
2. Add formatting using the syntax above (`#` for titles, `-` for lists)
3. The API will automatically parse and return structured blocks

---

## Troubleshooting

### Issue: Images not changing when selecting color

**Solution**: Ensure `imageColors` array is populated and color names match exactly (case-insensitive matching is supported).

### Issue: All sizes showing as out of stock

**Solution**: Check that `variants` array has entries with `outOfStock: false` and `stock > 0`.

### Issue: Discount price not showing

**Solution**: Verify `discountPrice` is set and is less than `price`. Use `null` to remove discount.

### Issue: Rich text not formatting

**Solution**: Ensure proper syntax with `# ` for titles and `- ` for lists (note the space after symbol).

---

## Conclusion

This implementation provides a complete, Shopify-inspired product management system with:

✅ Color-specific image filtering
✅ Granular variant inventory tracking
✅ Comprehensive out-of-stock indicators
✅ Discount price support
✅ Rich text formatting for product details

All features are fully backward compatible and can be adopted gradually.
