# 🔥 GUÍA: Obtener Tokens de APIs Sociales

## 📱 X (Twitter) - ✅ YA TIENES

**Consumer Key:** `UQzgSidvL0AvQBu69Pxf52hM4`
**Consumer Secret:** `FYYuPhmXm0WdDNno1GRg3HWSjwt3T8O7PIxgfHw4VnN8SyezAR`

**Falta:** Access Token + Access Token Secret

### Cómo obtenerlos:
1. Ve a https://developer.twitter.com/en/portal/dashboard
2. Click en tu app (dvgsstudio)
3. Tab "Keys and tokens"
4. Sección "Authentication Tokens"
5. Click "Generate" (si no existen)
6. Copia:
   - **Access Token** → `X_ACCESS_TOKEN` en .env.local
   - **Access Token Secret** → `X_ACCESS_TOKEN_SECRET` en .env.local

---

## 🎵 TikTok - Obtener API Access

### Prerequisitos:
- Cuenta TikTok Business (no personal)
- Acceso a TikTok For Business

### Pasos:
1. Ve a https://business.tiktok.com/
2. Click "Tools" → "Developer Tools"
3. Click "Create New Application"
4. Nombre: "DVG Studio Social"
5. Tipo: "Personal Use"
6. Acepta términos
7. En Application Details:
   - Copia **Client Key** → `TIKTOK_CLIENT_KEY`
   - Copia **Client Secret** → `TIKTOK_CLIENT_SECRET`

### Generar Access Token:
1. En Developer Dashboard
2. Click "Generate Access Token"
3. Autoriza con tu cuenta TikTok
4. Copia el token → `TIKTOK_ACCESS_TOKEN`

---

## 📸 Instagram - Graph API Setup

### Prerequisitos:
- Cuenta Meta/Facebook
- Instagram Business Account (convertir a Business)

### Pasos:
1. Ve a https://developers.facebook.com/apps
2. Click "My Apps"
3. Click "Create App" (si no tienes)
4. Tipo: "Business"
5. Nombre: "DVG Studio Social"
6. En App Dashboard:
   - Ve a "Settings" → "Basic"
   - Copia **App ID** (no necesario aquí, pero guarda)
   - Copia **App Secret** (guarda en .env si necesitas)

### Conectar Instagram Business Account:
1. Ve a "Instagram Basic Display" (o Instagram Graph API)
2. Click "Add Product"
3. Click "Configure" → "Instagram Basic Display"
4. En "Role" → "Tester" o "Developer"
5. Ir a "Tools" → "Graph API Explorer"
6. Selecciona tu app
7. En field "Access Token", click "Generate Access Token"
8. Autoriza con tu cuenta Facebook
9. Copia el token → `INSTAGRAM_ACCESS_TOKEN`

### Obtener Business Account ID:
1. En Graph API Explorer
2. Query: `GET me/instagram_business_account`
3. Click "Submit"
4. En respuesta, copia `id` → `INSTAGRAM_BUSINESS_ACCOUNT_ID`

---

## 💼 LinkedIn - OAuth2 + Posts API

### Prerequisitos
- Cuenta LinkedIn con acceso de administrador a la página de empresa (DVG Studio)
- App en [LinkedIn Developers](https://www.linkedin.com/developers/apps)

### 1. Crear la app
1. Ve a https://www.linkedin.com/developers/apps
2. **Create app**
3. Nombre: **DVG Studio Social**
4. **LinkedIn Page:** selecciona la página de DVG Studio
5. Sube un logo y crea la app

### 2. Productos (tab Products)
Activa:
- **Share on LinkedIn** → scope `w_member_social`
- **Sign In with LinkedIn using OpenID Connect** → scopes `openid`, `profile`

Para publicar en la **página de empresa**, el producto de Marketing/Community Management debe conceder `w_organization_social` (el CRM lo pide automáticamente si defines `LINKEDIN_ORGANIZATION_URN`).

### 3. Auth (tab Auth)
En **Authorized redirect URLs for your app**, añade **exactamente**:

```
https://crm.dvgsstudio.com/api/marketing/connect/linkedin/callback
```

En local (opcional):

```
http://localhost:3000/api/marketing/connect/linkedin/callback
```

Copia **Client ID** → `LINKEDIN_CLIENT_ID` y **Client Secret** → `LINKEDIN_CLIENT_SECRET`.

### 4. Scopes (los pide el CRM en el flujo OAuth)
| Scope | Uso |
| --- | --- |
| `openid` | OpenID Connect |
| `profile` | Perfil del miembro |
| `w_member_social` | Publicar en el perfil personal |
| `w_organization_social` | Publicar en la página (solo si `LINKEDIN_ORGANIZATION_URN` está configurado) |

### 5. Conectar en el CRM
1. Despliega con `LINKEDIN_CLIENT_ID` y `LINKEDIN_CLIENT_SECRET` en Vercel
2. Inicia sesión como **ADMIN**
3. **Marketing → Conexiones → Conectar LinkedIn**
4. Autoriza la app con una cuenta que tenga rol **CONTENT_ADMIN** en la página (si publicas como organización)

### 6. Publicar como página de empresa (opcional)
1. Obtén el URN de la organización (ej. `urn:li:organization:12345678`) desde el portal de desarrolladores o la API de organizaciones
2. En Vercel: `LINKEDIN_ORGANIZATION_URN=urn:li:organization:12345678`
3. Reconecta LinkedIn para incluir el scope `w_organization_social`

### Tokens
- **Access token:** ~60 días; el CRM renueva con refresh token
- **Refresh token:** ~365 días; después hay que reconectar en Conexiones
- Fallback manual: `LINKEDIN_ACCESS_TOKEN` (no recomendado)

---

## ▶ YouTube — Data API v3 + OAuth

### Prerequisitos
- Canal de YouTube (personal o de marca)
- Proyecto en [Google Cloud Console](https://console.cloud.google.com)

### 1. Activar API
1. Google Cloud → **APIs & Services → Library**
2. Busca **YouTube Data API v3** → **Enable**

### 2. Pantalla de consentimiento OAuth
1. **APIs & Services → OAuth consent screen**
2. Tipo: **External** (o Internal si usas Google Workspace)
3. App name: **DVG Studio CRM**
4. User support email: `info@dvgsstudio.com`
5. Dominio autorizado: `crm.dvgsstudio.com` y `dvgsstudio.com`
6. Scopes: `youtube.upload`, `youtube.readonly`
7. Añade tu Gmail como **Test user** mientras esté en modo Testing

### 3. Credenciales OAuth (Web application)
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Type: **Web application**
3. Name: **DVG Studio CRM**
4. **Authorized redirect URIs** (exacto):

```
https://crm.dvgsstudio.com/api/marketing/connect/youtube/callback
```

Local (opcional):

```
http://localhost:3000/api/marketing/connect/youtube/callback
```

5. Copia **Client ID** → `GOOGLE_CLIENT_ID`
6. Copia **Client Secret** → `GOOGLE_CLIENT_SECRET`

### 4. Conectar en el CRM
1. Variables en Vercel + `npx prisma db push` (enum `YOUTUBE`)
2. **Marketing → Conexiones → Conectar YouTube** (ADMIN)
3. Autoriza con la cuenta Google del canal

### 5. Publicar vídeos
- Plataforma **YOUTUBE** en el CRM
- **Primera línea del post = título** (máx. 100 caracteres)
- Resto = descripción
- Sube/enlaza vídeo .mp4 en Vista domingo (igual que TikTok)
- Por defecto `YOUTUBE_PRIVACY_STATUS=unlisted` (solo con enlace). Cambia a `public` cuando quieras

### Variables opcionales
| Variable | Default | Uso |
| --- | --- | --- |
| `YOUTUBE_PRIVACY_STATUS` | `unlisted` | `public`, `private`, `unlisted` |
| `YOUTUBE_CATEGORY_ID` | `22` | Categoría YouTube (22 = People & Blogs) |

---

## 🔧 Instalación en .env.local

```bash
# X (Twitter)
X_CONSUMER_KEY=UQzgSidvL0AvQBu69Pxf52hM4
X_CONSUMER_SECRET=FYYuPhmXm0WdDNno1GRg3HWSjwt3T8O7PIxgfHw4VnN8SyezAR
X_ACCESS_TOKEN=Tu_Access_Token_Aqui
X_ACCESS_TOKEN_SECRET=Tu_Access_Token_Secret_Aqui

# TikTok
TIKTOK_CLIENT_KEY=Tu_Client_Key_Aqui
TIKTOK_CLIENT_SECRET=Tu_Client_Secret_Aqui
TIKTOK_ACCESS_TOKEN=Tu_Access_Token_Aqui

# Instagram
INSTAGRAM_BUSINESS_ACCOUNT_ID=Tu_Business_Account_ID_Aqui
INSTAGRAM_ACCESS_TOKEN=Tu_Long_Lived_Token_Aqui

# LinkedIn (OAuth — preferible Marketing → Conexiones)
LINKEDIN_CLIENT_ID=Tu_Client_ID_Aqui
LINKEDIN_CLIENT_SECRET=Tu_Client_Secret_Aqui
# LINKEDIN_ORGANIZATION_URN=urn:li:organization:12345678
# LINKEDIN_REDIRECT_URI=https://crm.dvgsstudio.com/api/marketing/connect/linkedin/callback

# YouTube (OAuth — preferible Marketing → Conexiones)
GOOGLE_CLIENT_ID=Tu_Google_Client_ID
GOOGLE_CLIENT_SECRET=Tu_Google_Client_Secret
# YOUTUBE_PRIVACY_STATUS=unlisted
```

---

## 📦 NPM Packages Necesarios

```bash
npm install twit twitter-api-v2 instagram-api tiktok-api linkedin-api
```

O mejor (recomendado):
```bash
npm install twitter-api-v2 @instagram/instagram-api
```

---

## 🚀 Prueba Rápida

```bash
# En .env.local, completa los tokens

# Luego, en código:
curl -X POST http://localhost:3000/api/marketing/publish \
  -H "Content-Type: application/json" \
  -d '{
    "platforms": ["X"],
    "content": {
      "text": "🔥 Test desde API"
    }
  }'
```

---

## ⚠️ Notas Importantes

1. **X:** Necesita OAuth 1.0a (ya configurado con Twit)
2. **TikTok:** Requiere Business Account (personal no funciona)
3. **Instagram:** Usa Facebook Graph API (long-lived tokens)
4. **LinkedIn:** OAuth2 en Marketing → Conexiones; posts de solo texto (vídeo/imagen pendiente)
5. **YouTube:** OAuth Google en Conexiones; subida de vídeo (título = 1ª línea del post)

---

**Cuando tengas todos los tokens, actualiza .env.local y redeploy a Vercel:**

```bash
git add .env.local
git commit -m "Add social media API credentials"
git push origin main
# Vercel redeploy automático
```

---

**¿NECESITAS AYUDA CON ALGUNO?** Avisame cuál y te guío paso a paso. 🚀
