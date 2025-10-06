# 🎨 FiFuFa Favicon & Logo Setup

This folder contains all the favicon and logo files for your FiFuFa app.

## 📁 Current Files

### Favicon Files
- `favicon.svg` - Main favicon (32x32, scalable)
- `apple-touch-icon.svg` - Apple touch icon (180x180) 
- `manifest.json` - Web app manifest for PWA support

### Logo Files  
- `Logo_Granite.png` - IBM Granite logo
- `Logo_Hactiv8.png` - Hactiv8 logo
- `Logo_IBM.png` - IBM logo
- `Logo_IBM2.png` - IBM alternative logo

## 🔄 How to Replace with Your Own Logo

### Option 1: Replace Existing Files
1. Create your logo in these formats:
   - `favicon.svg` (32x32 pixels, SVG format)
   - `apple-touch-icon.svg` (180x180 pixels, SVG format)
2. Replace the existing files in the `/public/` folder
3. Keep the same filenames
4. Deploy: `vercel --prod`

### Option 2: Use PNG/ICO Format
1. Create your logo in these sizes:
   - `favicon.ico` (16x16, 32x32 combined)
   - `favicon-192.png` (192x192 pixels)
   - `favicon-512.png` (512x512 pixels)
   - `apple-touch-icon.png` (180x180 pixels)
2. Add them to `/public/` folder
3. Update `/index.html` favicon links:
   ```html
   <link rel="icon" type="image/x-icon" href="/favicon.ico" />
   <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
   <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
   ```

## 🎨 Current Logo Design

The current logo features:
- **Hand Symbol**: 🖐🏻 representing "Five" 
- **Navy Blue Background**: `#1E3A8A` (your app's primary color)
- **Golden Hand**: `#FBBF24` (warm, friendly color)
- **Red "5" Badge**: `#E11D48` (emphasizing the "Five Facts")
- **FiFuFa Text**: White text on the app icon

## 🛠 Logo Design Specifications

### Colors Used
- **Primary**: `#1E3A8A` (Navy Blue)
- **Secondary**: `#FBBF24` (Amber/Gold) 
- **Accent**: `#E11D48` (Red)
- **Text**: `#FFFFFF` (White)

### Concept
- **5 Fingers** = Five Fun Facts
- **Hand Gesture** = Friendly, approachable
- **Number "5"** = Clear branding
- **Rounded Design** = Modern, friendly

## 📱 Where Your Logo Appears

- **Browser Tab** (favicon)
- **Bookmarks**
- **iOS Home Screen** (when saved as web app)
- **Android Home Screen** (when saved as web app)
- **App Switcher**
- **Sharing Previews** (social media)

## 🚀 Quick Replacement Steps

1. **Prepare your logo** in SVG format (recommended) or PNG
2. **Name it** `favicon.svg` (or `favicon.png`)
3. **Place it** in `/public/` folder
4. **Deploy**: `vercel --prod`
5. **Clear browser cache** to see changes
