"""
Server launch script.
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app import app

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"==================================================")
    print(f"  처방사료 복합질환 믹스피딩 추천 & 모니터링 시스템")
    print(f"  웹 서버 주소: http://127.0.0.1:{port}")
    print(f"==================================================")
    app.run(host='127.0.0.1', port=port, debug=False)
