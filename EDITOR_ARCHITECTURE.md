# Article Editor - Component-Based Architecture

## Overview

The article editor has been refactored into a scalable, component-based architecture with Cloudinary image integration. The editor supports block-based content creation, media management, research resources tracking, and more.

## Architecture

### Core Components

#### 1. **MetadataTab** (`/components/editor/MetadataTab.tsx`)
- Manages article title, excerpt, and tags
- Real-time character count for SEO optimization
- Clean, controlled component pattern

#### 2. **ContentEditor** (`/components/editor/ContentEditor.tsx`)
- Block-based content system
- Supports multiple block types: text, heading, image, code, citation
- Drag-and-drop reordering capability
- Inline block insertion and deletion
- Dynamic block management with temporary IDs

#### 3. **MediaTab** (`/components/editor/MediaTab.tsx`)
- Featured image management
- Image gallery with grid layout
- Upload, edit, and delete capabilities
- Integration with ImageUploadModal

#### 4. **ImageUploadModal** (`/components/editor/ImageUploadModal.tsx`)
- Cloudinary integration for image uploads
- Rich metadata support (title, description, caption, attribution)
- Image preview before upload
- Reusable modal component

#### 5. **ScratchpadTab** (`/components/editor/ScratchpadTab.tsx`)
- Private research notes area
- Word and character count
- Monospace font for better readability
- Helpful tips section

#### 6. **ResourcesTab** (`/components/editor/ResourcesTab.tsx`)
- Track research websites, books, and YouTube videos
- Days spent on research tracking
- Last reviewed date management
- Dynamic add/remove for each resource type

### Utilities

#### **Cloudinary Integration** (`/lib/cloudinary.ts`)
```typescript
// Upload image
const result = await uploadToCloudinary({
  file: imageFile,
  folder: 'articles',
  filename: 'custom-name'
});

// Get optimized URL
const url = getOptimizedImageUrl(publicId, {
  width: 800,
  quality: 80,
  format: 'auto'
});

// Delete image
await deleteFromCloudinary(publicId);
```

#### **API Route** (`/app/api/upload/cloudinary/route.ts`)
- POST: Upload images with automatic optimization
- DELETE: Remove images from Cloudinary
- Session-based authentication

## Data Flow

```
User Action → Component State → Save Handler → API Route → Database
     ↓
  Cloudinary (for images)
```

### State Management

All state is managed at the page level (`/app/editor/[slug]/page.tsx`) and passed down to components via props:

```typescript
const [title, setTitle] = useState("");
const [blocks, setBlocks] = useState<Block[]>([]);
const [featuredImage, setFeaturedImage] = useState<ImageData | null>(null);
// ... etc
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install cloudinary
```

### 2. Configure Cloudinary

Add to your `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

Sign up at [Cloudinary](https://cloudinary.com) to get credentials.

### 3. Update API Route

The `/api/articles/[slug]/route.ts` should handle the `FULL_UPDATE` type:

```typescript
case "FULL_UPDATE":
  await Article.findByIdAndUpdate(article._id, {
    ...payload,
    updatedAt: new Date()
  });
  break;
```

## Block Types

### Supported Blocks

1. **Text Block**
   ```typescript
   {
     type: "text",
     content: "Paragraph content..."
   }
   ```

2. **Heading Block**
   ```typescript
   {
     type: "heading",
     level: 1 | 2 | 3,
     content: "Heading text"
   }
   ```

3. **Image Block**
   ```typescript
   {
     type: "image",
     image: ImageData,
     caption: "Optional caption"
   }
   ```

4. **Code Block** (coming soon)
   ```typescript
   {
     type: "code",
     language: "javascript",
     content: "code here..."
   }
   ```

5. **Citation Block** (coming soon)
   ```typescript
   {
     type: "citation",
     citation: CitationData
   }
   ```

## Component Props

### ContentEditor
```typescript
interface ContentEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  onAddImageClick: (insertIndex: number) => void;
}
```

### MediaTab
```typescript
interface MediaTabProps {
  featuredImage: ImageData | null;
  images: ImageData[];
  onFeaturedImageChange: (image: ImageData | null) => void;
  onImagesChange: (images: ImageData[]) => void;
}
```

### ResourcesTab
```typescript
interface ResourcesTabProps {
  resources: Resources;
  onChange: (resources: Resources) => void;
}
```

## Features

### ✅ Implemented

- Block-based content editor
- Cloudinary image uploads
- Featured image management
- Image gallery
- Research scratchpad
- Resource tracking (websites, books, videos)
- Metadata management
- Auto-save functionality
- Publish workflow
- Responsive design
- Dark theme UI

### 🔄 Coming Soon

- Code block syntax highlighting
- Citation management system
- Block drag-and-drop reordering
- Markdown import/export
- Version history
- Collaborative editing
- AI writing assistance

## Best Practices

1. **Component Isolation**: Each tab is a self-contained component
2. **Prop Drilling**: Minimal - state lives at page level
3. **Type Safety**: Full TypeScript support
4. **Error Handling**: Toast notifications for user feedback
5. **Image Optimization**: Automatic via Cloudinary
6. **Accessibility**: Semantic HTML and ARIA labels

## Troubleshooting

### Images not uploading
- Check Cloudinary credentials in `.env.local`
- Verify API route is accessible
- Check browser console for errors

### Blocks not saving
- Ensure `FULL_UPDATE` case is handled in API
- Check network tab for failed requests
- Verify article ID exists

### UI not responding
- Check React state updates
- Verify component props are correctly passed
- Look for console errors

## Performance Considerations

- Images are optimized automatically by Cloudinary
- Lazy loading for images in gallery
- Debounced auto-save (implement as needed)
- Efficient re-renders with React.memo (add where needed)

## Migration from Old Editor

If migrating from an older editor structure:

1. Backup your database
2. Update article schema to support new block structure
3. Run migration script to convert old content to blocks
4. Test thoroughly before deploying

## Contributing

When adding new block types:

1. Add type to `Block` interface in `ContentEditor.tsx`
2. Create render case in ContentEditor
3. Add insertion button/handler
4. Update API to handle new type
5. Add to this documentation
