# 🔥 SETUP SOCIAL MEDIA - SOLO X (TWITTER)

## ✅ X (Twitter) - LISTO PARA FUNCIONAR

### Credenciales Actuales:
```
X_CONSUMER_KEY=UQzgSidvL0AvQBu69Pxf52hM4
X_CONSUMER_SECRET=FYYuPhmXm0WdDNno1GRg3HWSjwt3T8O7PIxgfHw4VnN8SyezAR
```

### Falta: Access Token + Access Token Secret

**Obtenerlos en 2 minutos:**

1. Ve a https://developer.twitter.com/en/portal/dashboard
2. Click tu app (dvgsstudio)
3. Tab "Keys and tokens"
4. Sección "Authentication Tokens"
5. Click "Generate" (si no existen)
6. Copia los 2 tokens
7. Actualiza `.env.local`:
   ```
   X_ACCESS_TOKEN=Tu_Token_Aqui
   X_ACCESS_TOKEN_SECRET=Tu_Token_Secret_Aqui
   ```

---

## ❌ TikTok - NO DISPONIBLE

**Por qué:** No tienes Business Account ni acceso a TikTok API oficial

**Alternativa:** Usar Selenium para automatizar manualmente (más lento, pero gratuito)

---

## ❌ Instagram - NO CONFIGURADO

**Por qué:** Requiere Facebook Business Account (no quieres hacerlo)

**Alternativa:** Usar Selenium para automatizar (igual que TikTok)

---

## ❌ LinkedIn - NO CONFIGURADO

**Por qué:** Requiere OAuth2 flow completo

**Alternativa:** Usar Selenium para automatizar

---

## 🚀 CÓMO FUNCIONA AHORA

### Publicar en X desde Dashboard:

1. Ve a https://crm.dvgsstudio.com/marketing
2. Crea un post
3. Selecciona plataforma: **X** (solo opción activa)
4. Click "Publicar"
5. ¡Tweet publicado automáticamente!

### API Endpoint:

```bash
POST /api/marketing/publish
{
  "platforms": ["X"],
  "content": {
    "text": "🔥 Tu mensaje aquí"
  }
}
```

---

## 📊 Status Actual

| Plataforma | Status | Acción |
|-----------|--------|--------|
| **X** | ✅ ACTIVO | Obtener 2 tokens en Twitter Dev |
| TikTok | ❌ INACTIVO | Alternativa: Selenium |
| Instagram | ❌ INACTIVO | Alternativa: Selenium |
| LinkedIn | ❌ INACTIVO | Alternativa: Selenium |

---

## ⚡ Próximo Paso

**Una vez tengas los Access Tokens de X:**

1. Actualiza `.env.local`
2. `git push` → Vercel redeploya
3. Ve a `/marketing` en CRM
4. ¡Publica tu primer tweet!

---

**¿LISTO?** Dame los 2 tokens de X y lo activo todo. 🚀
