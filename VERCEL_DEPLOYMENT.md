# 🚀 Vercel Deployment Guide for FiFuFa

This guide will walk you through deploying FiFuFa to Vercel, which should resolve the Cloudflare blocking issues you experienced with Render.

## 🎯 Why Vercel?

- **Better IP Reputation**: Vercel uses different IP ranges that are less likely to be blocked by Cloudflare
- **Serverless Functions**: Automatically scales and reduces cold start issues
- **Integrated Frontend + Backend**: Single domain for both UI and API
- **Edge Network**: Global CDN for better performance
- **Zero Configuration**: Works out of the box with our setup

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Replicate API Token**: Get from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
3. **GitHub Repository**: Your code should be in a GitHub repo

## 🚀 Deployment Steps

### Method 1: One-Click Deploy (Recommended)

1. **Click the Deploy Button**
   
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Otachiking/FiFuFa-Deploy)

2. **Configure Repository**
   - Connect your GitHub account if not already connected
   - Choose a project name
   - Select your GitHub organization/account

3. **Set Environment Variables**
   - Add `REPLICATE_API_TOKEN` with your actual token
   - Leave `VITE_API_URL` empty (will use relative paths)

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Get your deployment URL

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Directory**
   ```bash
   cd FiFuFa-Deploy
   vercel
   ```

4. **Follow Prompts**
   ```
   ? Set up and deploy "~/FiFuFa-Deploy"? [Y/n] y
   ? Which scope do you want to deploy to? [Your Account]
   ? Link to existing project? [y/N] n
   ? What's your project's name? fifufa-app
   ? In which directory is your code located? ./
   ```

5. **Set Environment Variables**
   ```bash
   vercel env add REPLICATE_API_TOKEN
   # Enter your token when prompted
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Method 3: GitHub Integration

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"

2. **Import Git Repository**
   - Connect GitHub if needed
   - Select your FiFuFa repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: Auto-detected
   - **Output Directory**: Auto-detected

4. **Environment Variables**
   - Click "Environment Variables"
   - Add: `REPLICATE_API_TOKEN` = `your_token_here`
   - Environment: Production (and Preview if needed)

5. **Deploy**
   - Click "Deploy"
   - Wait for completion

## 🔧 Configuration Explained

Our `vercel.json` handles the setup:

```json
{
  "version": 2,
  "name": "fifufa-app",
  "builds": [
    {
      "src": "fifufa-ui/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/fifufa-ui/$1" }
  ],
  "functions": {
    "api/facts.js": { "maxDuration": 30 },
    "api/random-words.js": { "maxDuration": 30 }
  }
}
```

## 🧪 Testing Your Deployment

### 1. Frontend Test
Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
- Should load the FiFuFa interface
- Language toggle should work
- Input field should accept text

### 2. API Tests

**Health Check:**
```bash
curl https://your-app.vercel.app/api/health
```

**Facts API:**
```bash
curl -X POST https://your-app.vercel.app/api/facts \
  -H "Content-Type: application/json" \
  -d '{"topic": "ninja", "language": "en"}'
```

**Random Words:**
```bash
curl https://your-app.vercel.app/api/random-words?language=en
```

### 3. Full Integration Test
1. Visit your app
2. Click the random topic button (🎲)
3. Click "Discover Amazing Facts"
4. Verify facts are generated
5. Test "More Facts" button
6. Switch language and repeat

## 🔍 Troubleshooting

### Build Issues

**Error: Missing dependencies**
```bash
# Local development dependencies should be in fifufa-ui/
cd fifufa-ui && npm install
```

**Error: Build command failed**
- Check that `fifufa-ui/package.json` has `"build": "vite build"`
- Verify all imports are correct (case-sensitive)

### Runtime Issues

**Error: 500 Internal Server Error on API calls**
- Check Vercel function logs in dashboard
- Verify `REPLICATE_API_TOKEN` is set correctly
- Test API token separately

**Error: CORS issues**
- Should not occur with our setup (same domain)
- If it happens, check that API functions include CORS headers

**Error: Replicate API still blocked**
- Unlikely with Vercel, but if it happens:
- Try different Vercel regions
- Contact Vercel support
- Consider alternative AI providers

### Performance Issues

**Slow API responses**
- Functions have 30s timeout
- Check Replicate API status
- Monitor function execution time in Vercel dashboard

## 📊 Monitoring & Maintenance

### Vercel Dashboard Features
- **Functions**: Monitor API call performance
- **Analytics**: Track usage and performance
- **Deployments**: View build history and logs
- **Domains**: Configure custom domains

### Environment Management
```bash
# List environment variables
vercel env ls

# Add new environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME
```

### Updating the App
```bash
# With GitHub integration - just push to main branch
git push origin main

# With CLI - redeploy
vercel --prod
```

## 🔐 Security Considerations

- ✅ API token is secure in Vercel environment variables
- ✅ No sensitive data in client-side code
- ✅ CORS properly configured
- ✅ Input validation on all endpoints
- ✅ Rate limiting handled by Replicate API

## 🌟 Next Steps

1. **Custom Domain** (Optional)
   - Add your domain in Vercel dashboard
   - Configure DNS records
   - Enable automatic HTTPS

2. **Analytics Setup**
   - Enable Vercel Analytics
   - Add custom tracking if needed

3. **Performance Optimization**
   - Monitor Core Web Vitals
   - Optimize images and assets
   - Consider caching strategies

## 💡 Pro Tips

- **Preview Deployments**: Every PR creates a preview URL
- **Instant Rollback**: Revert to previous deployment instantly
- **Edge Functions**: Consider upgrading for better performance
- **Team Collaboration**: Invite team members to project

## 📞 Support

If you encounter issues:

1. **Check Vercel Status**: [status.vercel.com](https://status.vercel.com)
2. **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
3. **Replicate Status**: [status.replicate.com](https://status.replicate.com)
4. **Create Issue**: [GitHub Issues](https://github.com/Otachiking/FiFuFa-Deploy/issues)

---

🎉 **You're all set!** Your FiFuFa app should now be running smoothly on Vercel without Cloudflare blocking issues.