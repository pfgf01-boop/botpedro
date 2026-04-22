"""
Módulo de Armazenamento Local - SQLite
Gerencia a fila de sincronização offline para garantir resiliência.
"""

import sqlite3
import json
import os
from datetime import datetime
from config import logger

class LocalStorage:
    def __init__(self, db_path='pending_sync.db'):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Inicializa o banco de dados e cria as tabelas se não existirem"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS pending_sync (
                    id TEXT PRIMARY KEY,
                    tipo_registro TEXT,
                    dados_json TEXT,
                    data_criacao DATETIME
                )
            ''')
            conn.commit()
            conn.close()
            logger.info(f"✅ Banco de dados local inicializado em {self.db_path}")
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar banco de dados local: {e}")

    def add_pending(self, registro_id: str, tipo: str, dados: dict):
        """Adiciona um registro à fila de sincronização pendente"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO pending_sync (id, tipo_registro, dados_json, data_criacao)
                VALUES (?, ?, ?, ?)
            ''', (registro_id, tipo, json.dumps(dados), datetime.now().isoformat()))
            conn.commit()
            conn.close()
            logger.info(f"📥 Registro {registro_id} adicionado à fila local ({tipo})")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao adicionar registro local: {e}")
            return False

    def get_all_pending(self):
        """Retorna todos os registros pendentes"""
        try:
            conn = sqlite3.connect(self.db_path)
            # Retornar como dicionários
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM pending_sync ORDER BY data_criacao ASC')
            rows = cursor.fetchall()
            
            result = []
            for row in rows:
                result.append({
                    'id': row['id'],
                    'tipo': row['tipo_registro'],
                    'dados': json.loads(row['dados_json']),
                    'data_criacao': row['data_criacao']
                })
            
            conn.close()
            return result
        except Exception as e:
            logger.error(f"❌ Erro ao recuperar registros locais: {e}")
            return []

    def remove_pending(self, registro_id: str):
        """Remove um registro da fila local após sucesso na sincronização"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM pending_sync WHERE id = ?', (registro_id,))
            conn.commit()
            conn.close()
            logger.info(f"🗑️ Registro {registro_id} removido da fila local")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao remover registro local: {e}")
            return False

# Instância global
local_storage = LocalStorage()
