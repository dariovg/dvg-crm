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

## 💼 LinkedIn - OAuth2 Setup

### Prerequisitos:
- Cuenta LinkedIn Company
- LinkedIn Developers

### Pasos:
1. Ve a https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Nombre: "DVG Studio Social"
4. LinkedIn Page: Selecciona tu company page
5. App Logo: Sube (cualquier cosa)
6. Click "Create app"

### Generar Access Token:
1. En App Dashboard
2. Tab "Auth"
3. En "Authorized redirect URLs"
4. Añade: `https://crm.dvgsstudio.com/api/auth/linkedin/callback`
5. Tab "Sign in with LinkedIn"
6. Copia:
   - **Client ID**
   - **Client Secret**

### Para obtener Access Token (usuario final):
1. Implementar OAuth2 flow
2. O usar LinkedIn Token Generator (si es personal)
3. Token → `LINKEDIN_ACCESS_TOKEN`

### Obtener Organization ID:
1. En LinkedIn, ve a tu company page
2. URL: `https://www.linkedin.com/company/dvg-studio-xxx`
3. El ID está en la URL → `LINKEDIN_ORGANIZATION_ID`

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

# LinkedIn
LINKEDIN_ACCESS_TOKEN=Tu_LinkedIn_Token_Aqui
LINKEDIN_ORGANIZATION_ID=Tu_Organization_ID_Aqui
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
4. **LinkedIn:** Requiere OAuth2 flow completo

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
