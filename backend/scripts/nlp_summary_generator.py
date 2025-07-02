import mysql.connector
import requests
from datetime import date

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral:7b-instruct"

print("Python script started", flush = True)

# Prompt for summarization
def generate_summary(service, summary_type, location, cursor):
    where_clause = "WHERE 1=1"
    if service != "Overall":
        where_clause += f" AND service_type = '{service}'"
    if summary_type == "Positive":
        where_clause += " AND positive_flag = 1"
    elif summary_type == "Negative":
        where_clause += " AND negative_flag = 1"
    if location:
        where_clause += f" AND issue_location = '{location}'"

    cursor.execute(f"SELECT review_text FROM feedback {where_clause} LIMIT 100")
    reviews = [row[0] for row in cursor.fetchall() if row[0]]

    if not reviews:
        return f"No feedback available for {summary_type.lower()} sentiment on {service} in {location or 'All'}."

    prompt = (
        f"Generate a short and insightful summary of customer feedback for {service} services "
        f"with {summary_type.lower()} sentiment "
        f"{'in ' + location if location else 'across all locations'}:\n\n"
        + "\n".join(reviews)
    )

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        })
        if response.status_code == 200:
            return response.json().get("response", "").strip()
        else:
            return f"Ollama error: {response.status_code}"
    except Exception as e:
        return f"Exception: {str(e)}"


# DB connection
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='Hariom13##',
    database='feedback_db'
)
cursor = conn.cursor()

# Clean up today's summaries
cursor.execute("DELETE FROM summaries WHERE generated_on = CURDATE()")

services = ['Overall', 'Core Banking', 'ATM', 'Online Banking']
summary_types = ['Overall', 'Positive', 'Negative']

# Fetch distinct locations from DB
cursor.execute("SELECT DISTINCT issue_location FROM feedback WHERE issue_location IS NOT NULL")
locations = [row[0] for row in cursor.fetchall()]

# All locations (summary = All)
for service in services:
    for summary_type in summary_types:
        print(f"Generating summary for {service} - {summary_type} - All...", flush = True)
        summary_text = generate_summary(service, summary_type, None, cursor)
        cursor.execute("""
            INSERT INTO summaries (service_type, location, summary_type, summary_text, generated_on)
            VALUES (%s, %s, %s, %s, %s)
        """, (service, 'All', summary_type, summary_text, date.today()))

# Per-location
for service in services:
    for summary_type in summary_types:
        for loc in locations:
            print(f"Generating summary for {service} - {summary_type} - {loc}...", flush = True)
            summary_text = generate_summary(service, summary_type, loc, cursor)
            cursor.execute("""
                INSERT INTO summaries (service_type, location, summary_type, summary_text, generated_on)
                VALUES (%s, %s, %s, %s, %s)
            """, (service, loc, summary_type, summary_text, date.today()))

conn.commit()
cursor.close()
conn.close()

print("Summaries generated with Mistral and saved to database.", flush = True)
