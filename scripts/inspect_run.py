import sqlite3

conn = sqlite3.connect('D:/SMARTBUYAI/gpu-server-FASHN-8GB/data/history.db')
cursor = conn.cursor()
cursor.execute('PRAGMA table_info(runs)')
columns = [col[1] for col in cursor.fetchall()]
print("Runs table columns:", columns)

cursor.execute('SELECT * FROM runs ORDER BY id DESC LIMIT 5')
for row in cursor.fetchall():
    print(dict(zip(columns, row)))
    print("-" * 50)

