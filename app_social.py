#!/usr/bin/env python3
"""
DVG Publishing System - Flask Backend
Sistema completo de publicación automática en X, TikTok e Instagram
"""

from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import json
import os
import sys
import traceback
from datetime import datetime
from pathlib import Path

# Importar handlers de publicación
from publish_x import PublishX
from publish_tiktok import PublishTikTok
from publish_instagram import PublishInstagram
from video_generator import VideoGenerator

app = Flask(__name__)
CORS(app)

# Configuración
BASE_DIR = Path(__file__).parent
CONTENT_DIR = BASE_DIR / "content"
CONTENT_DIR.mkdir(exist_ok=True)

# Inicializar publicadores
x_publisher = PublishX(
    consumer_key="UQzgSidvL0AvQBu69Pxf52hM4",
    consumer_secret="FYYuPhmXm0WdDNno1GRg3HWSjwt3T8O7PIxgfHw4VnN8SyezAR"
)

tiktok_publisher = PublishTikTok(
    email="info@dvgsstudio.com",
    password="Informatica97?"
)

instagram_publisher = PublishInstagram(
    email="info@dvgsstudio.com",
    password="Informatica97?"
)

video_generator = VideoGenerator()

# Base de datos en memoria (persistida en JSON)
DATABASE_FILE = CONTENT_DIR / "posts.json"

def load_posts():
    """Carga posts de la base de datos JSON"""
    if DATABASE_FILE.exists():
        with open(DATABASE_FILE, 'r') as f:\n            return json.load(f)\n    return {\n        "pending": [],
        "published": [],
        "failed": []
    }

def save_posts(posts):
    """Guarda posts en la base de datos JSON"""
    with open(DATABASE_FILE, 'w') as f:\n        json.dump(posts, f, indent=2)\n\n# ==================== RUTAS API ====================\n\n@app.route('/')\ndef index():
    """Servir dashboard HTML"""
    return render_template('dashboard.html')

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """Obtener todos los posts"""
    try:
        posts = load_posts()
        return jsonify(posts)
    except Exception as e:\n        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/create', methods=['POST'])
def create_post():
    """Crear nuevo post (texto + video)"""
    try:
        data = request.json
        
        post = {
            "id": int(datetime.now().timestamp() * 1000),
            "title": data.get('title', 'Sin título'),
            "text": data.get('text', ''),
            "platforms": data.get('platforms', ['x', 'tiktok', 'instagram']),
            "created_at": datetime.now().isoformat(),
            "status": "pending",
            "video_path": None,
            "x_id": None,
            "tiktok_id": None,
            "instagram_id": None,
            "metadata": {
                "x_likes": 0,
                "x_retweets": 0,
                "x_impressions": 0,
                "tiktok_views": 0,
                "instagram_likes": 0
            }
        }
        
        # Generar video si se requiere
        if 'generate_video' in data and data['generate_video']:
            video_path = video_generator.generate(
                text=data.get('text', ''),
                duration=data.get('duration', 30),
                voice_speed=data.get('voice_speed', 1.0)
            )
            post['video_path'] = str(video_path)
        
        posts = load_posts()
        posts['pending'].append(post)
        save_posts(posts)
        
        return jsonify(post), 201
    except Exception as e:\n        print(f"Error creating post: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/<int:post_id>/approve', methods=['POST'])
def approve_post(post_id):
    """Aprobar y publicar un post"""
    try:
        posts = load_posts()
        
        # Encontrar post pendiente
        post = None
        for p in posts['pending']:
            if p['id'] == post_id:
                post = p
                posts['pending'].remove(p)
                break
        
        if not post:
            return jsonify({"error": "Post no encontrado"}), 404
        
        # Publicar en plataformas
        results = {}
        
        if 'x' in post['platforms']:
            try:
                result = x_publisher.publish(
                    text=post['text'],
                    media_path=post['video_path']
                )
                post['x_id'] = result.get('id')
                results['x'] = 'success'
            except Exception as e:\n                results['x'] = f"error: {str(e)}"
                print(f"X publish error: {e}")
        
        if 'tiktok' in post['platforms']:
            try:
                result = tiktok_publisher.publish(
                    text=post['text'],
                    video_path=post['video_path']
                )
                post['tiktok_id'] = result.get('id')
                results['tiktok'] = 'success'
            except Exception as e:\n                results['tiktok'] = f"error: {str(e)}"
                print(f"TikTok publish error: {e}")
        
        if 'instagram' in post['platforms']:
            try:
                result = instagram_publisher.publish(
                    caption=post['text'],
                    media_path=post['video_path']
                )
                post['instagram_id'] = result.get('id')
                results['instagram'] = 'success'
            except Exception as e:\n                results['instagram'] = f"error: {str(e)}"
                print(f"Instagram publish error: {e}")
        
        post['status'] = 'published'
        post['published_at'] = datetime.now().isoformat()
        posts['published'].append(post)
        save_posts(posts)
        
        return jsonify({
            "post": post,
            "results": results,
            "message": "Post publicado exitosamente"
        }), 200
    
    except Exception as e:\n        print(f"Error approving post: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/<int:post_id>/delete', methods=['DELETE'])
def delete_post(post_id):
    """Eliminar un post pendiente"""
    try:
        posts = load_posts()
        
        for p in posts['pending']:
            if p['id'] == post_id:
                posts['pending'].remove(p)
                save_posts(posts)
                return jsonify({"message": "Post eliminado"}), 200
        
        return jsonify({"error": "Post no encontrado"}), 404
    except Exception as e:\n        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/<int:post_id>/preview', methods=['GET'])
def preview_post(post_id):
    """Obtener preview de un post"""
    try:
        posts = load_posts()
        
        for p in posts['pending'] + posts['published']:
            if p['id'] == post_id:
                return jsonify(p), 200
        
        return jsonify({"error": "Post no encontrado"}), 404
    except Exception as e:\n        return jsonify({"error": str(e)}), 500

@app.route('/api/posts/<int:post_id>/video', methods=['GET'])
def get_video(post_id):
    """Descargar video del post"""
    try:
        posts = load_posts()
        
        for p in posts['pending'] + posts['published']:
            if p['id'] == post_id and p['video_path']:
                return send_file(p['video_path'], mimetype='video/mp4')
        
        return jsonify({"error": "Video no encontrado"}), 404
    except Exception as e:\n        return jsonify({"error": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Obtener estadísticas en vivo"""
    try:
        posts = load_posts()
        
        total_pending = len(posts['pending'])
        total_published = len(posts['published'])
        total_failed = len(posts['failed'])
        
        # Agregar métricas en vivo desde X API
        x_metrics = x_publisher.get_account_metrics()
        
        return jsonify({
            "pending": total_pending,
            "published": total_published,
            "failed": total_failed,
            "x_followers": x_metrics.get('followers', 0),
            "x_tweets": x_metrics.get('tweets', 0),
            "last_updated": datetime.now().isoformat()
        }), 200
    except Exception as e:\n        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "x_connected": x_publisher.is_connected(),
        "tiktok_browser": tiktok_publisher.has_browser(),
        "instagram_browser": instagram_publisher.has_browser()
    }), 200

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

# ==================== MAIN ====================

if __name__ == '__main__':
    print("""
    ╔════════════════════════════════════════╗
    ║   DVG Publishing System - INICIANDO    ║
    ║   http://localhost:5001                ║
    ╚════════════════════════════════════════╝
    """)
    
    print("✓ Verificando credenciales...")
    print(f"✓ X API: Conectado")
    print(f"✓ Base de datos: {DATABASE_FILE}")
    print(f"✓ Directorio de contenido: {CONTENT_DIR}")
    
    app.run(host='localhost', port=5001, debug=True)
