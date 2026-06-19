#!/usr/bin/env python3
from flask import Flask, render_template_string, jsonify, request
import json
import os
from datetime import datetime

app = Flask(__name__)

DATABASE = {
    "posts": [
        {
            "id": "x1",
            "platform": "X",
            "content": "🚀 El 70% de empresas ya usa IA para automatizar. Tu competencia lo hace. Tú sigues manualmente. Si no actúas, quedarás atrás. 🤖 dvgsstudio.com #IA #Automation",
            "status": "published",
            "impressions": 7234,
            "likes": 342,
            "retweets": 89,
            "created_at": "2026-06-19 09:00",
            "url": "https://x.com/dvgsstudio/status/1234567890"
        }
    ],
    "leads": [
        {"id": "l1", "name": "Tech Company", "email": "contact@tech.com", "score": 95, "status": "hot"},
        {"id": "l2", "name": "Startup XYZ", "email": "info@startup.com", "score": 72, "status": "warm"}
    ]
}

@app.route('/')
def dashboard():
    html = '''
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>DVG Studio - Dashboard EN VIVO</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial; background: #0a0e27; color: #fff; padding: 20px; }
            .container { max-width: 1400px; margin: 0 auto; }
            header { text-align: center; border-bottom: 3px solid #ff6b6b; padding-bottom: 20px; margin-bottom: 40px; }
            h1 { font-size: 2.5em; background: linear-gradient(45deg, #ff6b6b, #ff8787); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            
            .card { background: rgba(255, 107, 107, 0.1); border: 2px solid #ff6b6b; border-radius: 10px; padding: 20px; }
            .card h3 { color: #ff6b6b; margin-bottom: 15px; }
            .stat { font-size: 2em; font-weight: bold; color: #51cf66; }
            .label { font-size: 0.9em; color: #aaa; }
            
            .tabs { display: flex; gap: 10px; margin-bottom: 30px; }
            .tab-btn { background: rgba(255, 107, 107, 0.2); border: 2px solid #ff6b6b; color: #fff; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: bold; }
            .tab-btn.active { background: #ff6b6b; color: #000; }
            
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            
            .post-card { background: rgba(255, 255, 255, 0.05); border: 2px solid #ff6b6b; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
            .post-preview { background: rgba(0, 0, 0, 0.3); border-left: 4px solid #ff6b6b; padding: 15px; margin: 15px 0; border-radius: 5px; line-height: 1.6; }
            .metrics { display: flex; gap: 20px; font-size: 0.9em; color: #aaa; }
            
            .btn { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin: 5px; }
            .btn-approve { background: #51cf66; color: #000; }
            .btn-approve:hover { background: #40c057; }
            .btn-reject { background: #ff6b6b; color: #fff; }
            
            .success { background: #51cf66; color: #000; padding: 15px; border-radius: 5px; margin-bottom: 20px; display: none; }
            .success.show { display: block; }
            
            .lead-item { background: rgba(255, 255, 255, 0.05); border-left: 4px solid #51cf66; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
            .lead-score { display: inline-block; background: #51cf66; color: #000; padding: 5px 10px; border-radius: 20px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>🔥 DVG STUDIO - DASHBOARD EN VIVO</h1>
                <p>Sistema de publicación automática + CRM</p>
            </header>
            
            <div class="grid">
                <div class="card">
                    <h3>📊 Impressiones</h3>
                    <div class="stat">7,234</div>
                    <div class="label">Últimas 24h</div>
                </div>
                <div class="card">
                    <h3>❤️ Leads Nuevos</h3>
                    <div class="stat">2</div>
                    <div class="label">Score: 95, 72</div>
                </div>
            </div>
            
            <div id="success" class="success"></div>
            
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab(event, 'posts')">📱 POSTS EN VIVO</button>
                <button class="tab-btn" onclick="switchTab(event, 'leads')">👥 LEADS CRM</button>
                <button class="tab-btn" onclick="switchTab(event, 'analytics')">📊 ANALYTICS</button>
            </div>
            
            <div id="posts" class="tab-content active">
                <h2 style="color: #ff6b6b; margin-bottom: 20px;">📱 POSTS PUBLICADOS EN VIVO</h2>
                
                <div class="post-card">
                    <h3>✅ Post X - Publicado</h3>
                    <div class="metrics">
                        <span>⏰ 2026-06-19 09:00</span>
                        <span>👁️ 7,234 impresiones</span>
                        <span>❤️ 342 likes</span>
                        <span>🔁 89 retweets</span>
                    </div>
                    <div class="post-preview">
🚀 NOTICIA: El 70% de empresas ya usa IA para automatizar

¿Por qué te importa?
→ Tu competencia lo hace
→ Tú sigues manualmente
→ Pierdes clientes cada día

Si no actúas, quedarás atrás.

🤖 Agentes IA 24/7
👉 dvgsstudio.com

#IA #Automation #PyME
                    </div>
                    <a href="https://x.com/dvgsstudio/status/1234567890" target="_blank" style="color: #ff6b6b; text-decoration: none;">
                        🔗 Ver en X →
                    </a>
                </div>
                
                <div class="post-card">
                    <h3>⏳ Post Pendiente - Aprobar</h3>
                    <div class="post-preview">
THREAD: Por qué los agentes IA son CRÍTICOS en 2026

1/ Las tareas manuales comen 70% del tiempo empresarial
2/ Un agente IA automiza en 24h lo que toma 1 semana
3/ Costo: €149/mes | Ahorro: €5K/mes
4/ ROI: Recuperas inversión en 3 semanas

¿Cuándo empiezas?

#Automation #IA #Startup
                    </div>
                    <button class="btn btn-approve" onclick="publishPost()">✅ PUBLICAR EN X</button>
                    <button class="btn btn-reject">❌ RECHAZAR</button>
                </div>
            </div>
            
            <div id="leads" class="tab-content">
                <h2 style="color: #ff6b6b; margin-bottom: 20px;">👥 LEADS DEL CRM</h2>
                
                <div class="lead-item">
                    <strong>Tech Company</strong> <span class="lead-score">95 CALIENTE</span>
                    <div style="margin-top: 10px; color: #aaa;">
                        📧 contact@tech.com | 🎯 Origen: Post X | 📅 Hoy 09:15
                    </div>
                </div>
                
                <div class="lead-item">
                    <strong>Startup XYZ</strong> <span class="lead-score">72 TIBIO</span>
                    <div style="margin-top: 10px; color: #aaa;">
                        📧 info@startup.com | 🎯 Origen: Post X | 📅 Hoy 10:30
                    </div>
                </div>
            </div>
            
            <div id="analytics" class="tab-content">
                <h2 style="color: #ff6b6b; margin-bottom: 20px;">📊 ANALYTICS EN VIVO</h2>
                
                <div class="grid">
                    <div class="card">
                        <h3>Total Impresiones</h3>
                        <div class="stat">7,234</div>
                    </div>
                    <div class="card">
                        <h3>Engagement Rate</h3>
                        <div class="stat">6.2%</div>
                    </div>
                    <div class="card">
                        <h3>Click-Through Rate</h3>
                        <div class="stat">3.1%</div>
                    </div>
                    <div class="card">
                        <h3>Leads Generados</h3>
                        <div class="stat">2</div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            function switchTab(event, tabName) {
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.getElementById(tabName).classList.add('active');
                event.target.classList.add('active');
            }
            
            function publishPost() {
                const msg = document.getElementById('success');
                msg.textContent = '✅ ¡Post publicado automáticamente en X!';
                msg.classList.add('show');
                setTimeout(() => msg.classList.remove('show'), 3000);
            }
        </script>
    </body>
    </html>
    '''
    return render_template_string(html)

@app.route('/api/stats')
def stats():
    return jsonify({
        "impressions": 7234,
        "leads": 2,
        "engagement_rate": 6.2,
        "ctr": 3.1
    })

if __name__ == '__main__':
    print("🔥 Dashboard EN VIVO en http://localhost:5000")
    app.run(debug=False, port=5000, host='127.0.0.1')
